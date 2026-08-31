import { supabase } from '../lib/supabase';
import { isValidUUID, safeHref, sanitizeText, sanitizeForPayload, validateReviewForm } from '../utils/validators';

// ------------------------------------------------------------------
// IN-MEMORY QUERY CACHE (TTL)
// ------------------------------------------------------------------
const queryCache = new Map();
const DEFAULT_TTL_MS = 60 * 1000; // 60 seconds

export const getCachedData = (key) => {
  const cached = queryCache.get(key);
  if (!cached) return null;
  if (Date.now() > cached.expiresAt) {
    queryCache.delete(key);
    return null;
  }
  return cached.data;
};

export const setCachedData = (key, data, ttlMs = DEFAULT_TTL_MS) => {
  queryCache.set(key, {
    data,
    expiresAt: Date.now() + ttlMs
  });
};

export const invalidateCache = (pattern = null) => {
  if (!pattern) {
    queryCache.clear();
    return;
  }
  for (const key of queryCache.keys()) {
    if (key.includes(pattern)) {
      queryCache.delete(key);
    }
  }
};

// ------------------------------------------------------------------
// PROFILES (CREATORS & BRANDS)
// ------------------------------------------------------------------

export const getStoreProfiles = async (forceRefresh = false) => {
  const cacheKey = 'stores_profiles';
  if (!forceRefresh) {
    const cached = getCachedData(cacheKey);
    if (cached) return cached;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .in('role', ['brand', 'admin']);
    
  if (error) throw error;
  
  const mapped = data.map(store => ({
    ...store,
    name: store.brand_name || store.full_name || 'Brand Name',
    logo: store.avatar_url || 'https://api.dicebear.com/7.x/shapes/svg?seed=brand',
    sector: store.category || 'عام',
    location: store.wilaya || 'الجزائر',
    activeCampaigns: 0,
    totalBudget: 0,
    verified: store.is_verified || false
  }));

  setCachedData(cacheKey, mapped);
  return mapped;
};

export const getCreatorProfiles = async (forceRefresh = false) => {
  const cacheKey = 'creators_profiles';
  if (!forceRefresh) {
    const cached = getCachedData(cacheKey);
    if (cached) return cached;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'creator');
    
  if (error) throw error;
  
  const mapped = data.map(creator => ({
    ...creator,
    name: creator.full_name || 'Creator Name',
    avatar: creator.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=creator',
    ratePerPost: creator.rate_per_post || 0,
    followers: { 
      instagram: creator.instagram_url ? 10000 : 0, 
      tiktok: creator.tiktok_url ? 10000 : 0, 
      youtube: creator.youtube_url ? 10000 : 0 
    },
    location: creator.wilaya || 'الجزائر',
    completedDeals: 0,
    rating: 5.0,
    reviewCount: 0,
    verified: creator.is_verified || false
  }));

  setCachedData(cacheKey, mapped);
  return mapped;
};

export const updateProfile = async (userId, profileData) => {
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id: userId, ...profileData })
    .select()
    .single();
    
  if (error) throw error;
  invalidateCache('profiles');
  return data;
};

export const getCreators = async (forceRefresh = false) => {
  const cacheKey = 'creators_list';
  if (!forceRefresh) {
    const cached = getCachedData(cacheKey);
    if (cached) return cached;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'creator');
    
  if (error) throw error;
  setCachedData(cacheKey, data);
  return data;
};

// ------------------------------------------------------------------
// CAMPAIGNS
// ------------------------------------------------------------------

export const getCampaigns = async (forceRefresh = false) => {
  const cacheKey = 'campaigns_list';
  if (!forceRefresh) {
    const cached = getCachedData(cacheKey);
    if (cached) return cached;
  }

  const { data, error } = await supabase
    .from('campaigns')
    .select(`
      *,
      brand:profiles!campaigns_brand_id_fkey (
        brand_name,
        full_name,
        avatar_url,
        is_verified
      )
    `)
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  setCachedData(cacheKey, data);
  return data;
};

export const createCampaign = async (campaignData) => {
  const { data, error } = await supabase
    .from('campaigns')
    .insert([campaignData])
    .select();
    
  if (error) throw error;
  invalidateCache('campaigns');
  return data;
};

export const updateCampaign = async (campaignId, updates) => {
  const { data, error } = await supabase
    .from('campaigns')
    .update(updates)
    .eq('id', campaignId)
    .select();
    
  if (error) throw error;
  invalidateCache('campaigns');
  return data;
};

export const deleteCampaign = async (campaignId) => {
  // First delete associated applications to preserve referential integrity
  await supabase
    .from('applications')
    .delete()
    .eq('campaign_id', campaignId);

  const { data, error } = await supabase
    .from('campaigns')
    .delete()
    .eq('id', campaignId)
    .select();
    
  if (error) throw error;
  invalidateCache('campaigns');
  invalidateCache('applications');
  return data;
};

// ------------------------------------------------------------------
// APPLICATIONS & DEALS
// ------------------------------------------------------------------

export const applyToCampaign = async (campaignId, creatorId, pitchData = {}) => {
  if (!isValidUUID(campaignId) || !isValidUUID(creatorId)) {
    throw new Error('Invalid campaign or creator UUID');
  }

  const payload = {
    campaign_id: campaignId,
    creator_id: creatorId,
    status: 'pending',
    ...(pitchData.pitch_text ? { pitch_text: sanitizeText(pitchData.pitch_text, 1000) } : {}),
    ...(pitchData.portfolio_url ? { portfolio_url: safeHref(pitchData.portfolio_url) } : {}),
    ...(pitchData.delivery_days ? { delivery_days: Math.max(1, Math.min(60, Number(pitchData.delivery_days) || 5)) } : {})
  };

  let { data, error } = await supabase
    .from('applications')
    .insert([payload])
    .select();
    
  // If specific extra columns don't exist yet in DB schema, fallback to core fields
  if (error && (error.code === '42703' || error.message?.includes('column'))) {
    const fallback = await supabase
      .from('applications')
      .insert([{ campaign_id: campaignId, creator_id: creatorId, status: 'pending' }])
      .select();
    if (fallback.error) throw fallback.error;
    return fallback.data;
  }

  if (error) throw error;
  return data;
};

export const updateApplicationStatus = async (applicationId, status, deliverableUrl = null) => {
  const updateData = { status };
  if (deliverableUrl) {
    updateData.deliverable_url = safeHref(deliverableUrl);
  }
  
  const { data, error } = await supabase
    .from('applications')
    .update(updateData)
    .eq('id', applicationId)
    .select();
    
  if (error) throw error;
  return data;
};

export const deleteApplication = async (applicationId) => {
  const { data, error } = await supabase
    .from('applications')
    .delete()
    .eq('id', applicationId)
    .select();
    
  if (error) throw error;
  return data;
};

export const getCreatorApplications = async (creatorId) => {
  const { data, error } = await supabase
    .from('applications')
    .select(`
      *,
      campaign:campaigns (
        *,
        brand:profiles!campaigns_brand_id_fkey(brand_name, avatar_url)
      )
    `)
    .eq('creator_id', creatorId);
    
  if (error) throw error;
  return data;
};

export const getBrandApplications = async (brandId) => {
  // Fetch campaigns for this brand, and the applications for those campaigns
  const { data, error } = await supabase
    .from('applications')
    .select(`
      *,
      creator:profiles!applications_creator_id_fkey (*),
      campaign:campaigns!inner (*)
    `)
    .eq('campaign.brand_id', brandId);
    
  if (error) throw error;
  return data;
};

// ------------------------------------------------------------------
// MESSAGES (CHAT)
// ------------------------------------------------------------------

export const getMessages = async (userId1, userId2) => {
  // Validate UUIDs to prevent PostgREST Filter Injection
  if (!isValidUUID(userId1) || !isValidUUID(userId2)) {
    console.warn('[getMessages] Blocked query due to invalid UUID:', { userId1, userId2 });
    return [];
  }

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .or(`and(sender_id.eq.${userId1},receiver_id.eq.${userId2}),and(sender_id.eq.${userId2},receiver_id.eq.${userId1})`)
    .order('created_at', { ascending: true });
    
  if (error) {
    console.error('[getMessages] Supabase error:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    throw error;
  }
  return data;
};

export const sendMessage = async (senderId, receiverId, text) => {
  if (!isValidUUID(senderId) || !isValidUUID(receiverId)) {
    throw new Error('Invalid sender or receiver UUID');
  }

  const sanitizedText = sanitizeText(text, 2000);
  if (!sanitizedText) {
    throw new Error('Message text cannot be empty');
  }

  const { data, error } = await supabase
    .from('messages')
    .insert([{ sender_id: senderId, receiver_id: receiverId, text: sanitizedText }])
    .select();
    
  if (error) {
    // Log full Supabase error for debugging
    console.error('[sendMessage] Supabase error:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    throw error;
  }
  return data;
};

export const subscribeToMessages = (userId, callback) => {
  // Use a unique channel name per user to avoid subscription collisions
  const channelName = `messages_user_${userId}_${Date.now()}`;
  const subscription = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${userId}`
      },
      (payload) => {
        callback(payload.new);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `sender_id=eq.${userId}`
      },
      (payload) => {
        callback(payload.new);
      }
    )
    .subscribe();
    
  return subscription;
};

// ------------------------------------------------------------------
// NOTIFICATIONS
// ------------------------------------------------------------------

export const getNotifications = async (userId) => {
  if (!isValidUUID(userId)) return [];

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  return data;
};

export const subscribeToNotifications = (userId, onNotification) => {
  const subscription = supabase
    .channel('public:notifications')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${userId}`
    }, payload => {
      onNotification(payload.new);
    })
    .subscribe();
    
  return subscription;
};

export const markNotificationRead = async (notificationId) => {
  const { data, error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId)
    .select();
    
  if (error) throw error;
  return data;
};

export const createNotification = async (userId, title, message) => {
  if (!isValidUUID(userId)) {
    throw new Error('Invalid user UUID for notification');
  }

  const sanitizedTitle = sanitizeForPayload(title, 100);
  const sanitizedMessage = sanitizeText(message, 500);

  const { data, error } = await supabase
    .from('notifications')
    .insert([{ user_id: userId, title: sanitizedTitle, message: sanitizedMessage }])
    .select();
    
  if (error) throw error;
  return data;
};

export const addReview = async (creatorId, rating, reviewText) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    if (!isValidUUID(creatorId)) throw new Error("Invalid creator UUID");

    const validation = validateReviewForm(rating, reviewText);
    if (!validation.isValid) throw new Error(validation.error);

    const { data, error } = await supabase
      .from('reviews')
      .insert({
        creator_id: creatorId,
        brand_id: user.id,
        rating: validation.rating,
        review_text: validation.reviewText
      });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error adding review:", error);
    throw error;
  }
};

// ------------------------------------------------------------------
// PAYOUT REQUESTS
// ------------------------------------------------------------------

export const createPayoutRequest = async ({ creatorId, amountDzd, ripNumber, payoutMethod = 'baridimob' }) => {
  const { data, error } = await supabase
    .from('payout_requests')
    .insert([
      {
        creator_id: creatorId,
        amount_dzd: amountDzd,
        rip_number: ripNumber,
        payout_method: payoutMethod,
        status: 'pending'
      }
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getPayoutRequests = async (creatorId) => {
  let query = supabase
    .from('payout_requests')
    .select('*')
    .order('created_at', { ascending: false });

  if (creatorId) {
    query = query.eq('creator_id', creatorId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

