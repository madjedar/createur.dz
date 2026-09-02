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

export const getProfileById = async (userId) => {
  if (!isValidUUID(userId)) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) {
    console.error('[getProfileById] Supabase error:', error);
    return null;
  }
  return data;
};

// ------------------------------------------------------------------
// MESSAGES (CHAT)
// ------------------------------------------------------------------

// Local Dev Message Store for offline/localhost testing
const DEV_MESSAGES_STORAGE_KEY = 'createur_dev_messages';

const getLocalDevMessages = () => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(DEV_MESSAGES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

const saveLocalDevMessage = (msg) => {
  if (typeof window === 'undefined') return;
  try {
    const existing = getLocalDevMessages();
    const updated = [...existing, msg];
    localStorage.setItem(DEV_MESSAGES_STORAGE_KEY, JSON.stringify(updated));
    // Broadcast to other tabs/windows in real time
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel('createur_chat_channel');
      bc.postMessage({ type: 'NEW_MESSAGE', message: msg });
      bc.close();
    }
  } catch (e) {
    console.warn('[saveLocalDevMessage] Failed to save locally:', e);
  }
};

export const getUserConversations = async (userId) => {
  if (!isValidUUID(userId)) {
    console.warn('[getUserConversations] Blocked query due to invalid UUID:', userId);
    return [];
  }

  const { data, error } = await supabase
    .from('messages')
    .select(`
      id,
      sender_id,
      receiver_id,
      text,
      created_at,
      sender:profiles!sender_id(id, full_name, brand_name, avatar_url, role, category, wilaya, is_verified),
      receiver:profiles!receiver_id(id, full_name, brand_name, avatar_url, role, category, wilaya, is_verified)
    `)
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order('created_at', { ascending: false });

  // Merge any local dev messages
  const localMsgs = getLocalDevMessages().filter(m => m.sender_id === userId || m.receiver_id === userId);
  const allMessages = [...(localMsgs || []), ...(data || [])].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );

  if (error && (!data || data.length === 0) && localMsgs.length === 0) {
    console.error('[getUserConversations] Supabase error:', error);
    return [];
  }

  const conversationsMap = new Map();
  for (const msg of allMessages) {
    const isSender = msg.sender_id === userId;
    let otherUser = isSender ? msg.receiver : msg.sender;
    const otherUserId = isSender ? msg.receiver_id : msg.sender_id;

    if (!otherUserId) continue;

    if (!conversationsMap.has(otherUserId)) {
      if (!otherUser) {
        try {
          otherUser = await getProfileById(otherUserId);
        } catch (e) {}
      }

      conversationsMap.set(otherUserId, {
        id: otherUserId,
        full_name: otherUser?.full_name || otherUser?.brand_name || (otherUserId === '196f2255-a271-4ba3-9f8b-8c71a586acb4' ? 'متجر فيكتوريا' : 'مستخدم'),
        brand_name: otherUser?.brand_name || (otherUserId === '196f2255-a271-4ba3-9f8b-8c71a586acb4' ? 'فيكتوريا' : ''),
        avatar_url: otherUser?.avatar_url || '',
        role: otherUser?.role || (otherUserId === '196f2255-a271-4ba3-9f8b-8c71a586acb4' ? 'brand' : 'creator'),
        category: otherUser?.category || '',
        wilaya: otherUser?.wilaya || '',
        is_verified: Boolean(otherUser?.is_verified ?? true),
        lastMessage: msg.text,
        lastMessageAt: msg.created_at,
      });
    }
  }

  const resultConversations = Array.from(conversationsMap.values());
  const cacheKey = `createur_convs_cache_${userId}`;

  // Cache conversations in localStorage for offline resilience
  if (typeof localStorage !== 'undefined') {
    try {
      if (resultConversations.length > 0) {
        localStorage.setItem(cacheKey, JSON.stringify(resultConversations));
      } else if (error) {
        const cached = localStorage.getItem(cacheKey);
        if (cached) return JSON.parse(cached);
      }
    } catch (e) {}
  }

  return resultConversations;
};

export const getMessages = async (userId1, userId2) => {
  // Validate UUIDs to prevent PostgREST Filter Injection
  if (!isValidUUID(userId1) || !isValidUUID(userId2)) {
    console.warn('[getMessages] Blocked query due to invalid UUID:', { userId1, userId2 });
    return [];
  }

  const pairKey = [userId1, userId2].sort().join('_');
  const cacheKey = `createur_msgs_cache_${pairKey}`;

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .or(`and(sender_id.eq.${userId1},receiver_id.eq.${userId2}),and(sender_id.eq.${userId2},receiver_id.eq.${userId1})`)
    .order('created_at', { ascending: true });

  const localMsgs = getLocalDevMessages().filter(
    m => (m.sender_id === userId1 && m.receiver_id === userId2) ||
         (m.sender_id === userId2 && m.receiver_id === userId1)
  );

  const combined = [...(data || []), ...(localMsgs || [])].sort(
    (a, b) => new Date(a.created_at) - new Date(b.created_at)
  );

  // Cache messages for offline resilience
  if (typeof localStorage !== 'undefined') {
    try {
      if (combined.length > 0) {
        localStorage.setItem(cacheKey, JSON.stringify(combined));
      } else if (error) {
        const cached = localStorage.getItem(cacheKey);
        if (cached) return JSON.parse(cached);
      }
    } catch (e) {}
  }
    
  if (error && localMsgs.length === 0 && combined.length === 0) {
    console.error('[getMessages] Supabase error:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    throw error;
  }
  return combined;
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

    // In local dev testing, if Supabase RLS blocks unauthenticated insert (42501):
    const isLocalhost = typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    if (error.code === '42501' && isLocalhost) {
      console.warn('[sendMessage] RLS policy blocked insert in local test session. Storing in local dev sync.');
      let senderProfile = null;
      let receiverProfile = null;
      try {
        [senderProfile, receiverProfile] = await Promise.all([
          getProfileById(senderId),
          getProfileById(receiverId)
        ]);
      } catch (e) {}

      const localMsg = {
        id: `local_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        sender_id: senderId,
        receiver_id: receiverId,
        text: sanitizedText,
        created_at: new Date().toISOString(),
        sender: senderProfile || (senderId === '196f2255-a271-4ba3-9f8b-8c71a586acb4' ? { full_name: 'متجر فيكتوريا', brand_name: 'فيكتوريا', role: 'brand' } : null),
        receiver: receiverProfile || (receiverId === 'e695998d-036b-4e6d-8f9d-253977932dd2' ? { full_name: 'madjed AR', role: 'creator' } : null)
      };
      saveLocalDevMessage(localMsg);
      try {
        createNotification(
          receiverId,
          'رسالة جديدة 💬',
          `وصلتك رسالة جديدة: "${sanitizedText.slice(0, 50)}${sanitizedText.length > 50 ? '...' : ''}"`
        ).catch(() => {});
      } catch (e) {}
      return [localMsg];
    }

    throw error;
  }

  // Asynchronously notify receiver without blocking message return
  try {
    createNotification(
      receiverId,
      'رسالة جديدة 💬',
      `وصلتك رسالة جديدة: "${sanitizedText.slice(0, 50)}${sanitizedText.length > 50 ? '...' : ''}"`
    ).catch(err => console.warn('[sendMessage] Notification async error:', err));
  } catch (notifErr) {
    console.warn('[sendMessage] Notification dispatch failed:', notifErr);
  }

  // Update offline message cache immediately
  if (data && data[0] && typeof localStorage !== 'undefined') {
    try {
      const pairKey = [senderId, receiverId].sort().join('_');
      const cacheKey = `createur_msgs_cache_${pairKey}`;
      const raw = localStorage.getItem(cacheKey);
      const existing = raw ? JSON.parse(raw) : [];
      if (!existing.some(m => m.id === data[0].id)) {
        localStorage.setItem(cacheKey, JSON.stringify([...existing, data[0]]));
      }
    } catch (e) {}
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

  // Also listen to local dev BroadcastChannel on localhost
  let localBc = null;
  if (typeof BroadcastChannel !== 'undefined') {
    localBc = new BroadcastChannel('createur_chat_channel');
    localBc.onmessage = (event) => {
      if (event.data?.type === 'NEW_MESSAGE' && event.data?.message) {
        const msg = event.data.message;
        if (msg.sender_id === userId || msg.receiver_id === userId) {
          callback(msg);
        }
      }
    };
  }

  return {
    unsubscribe: () => {
      if (subscription) subscription.unsubscribe();
      if (localBc) localBc.close();
    }
  };
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

