import { supabase } from '../lib/supabase';

// ------------------------------------------------------------------
// PROFILES (CREATORS & BRANDS)
// ------------------------------------------------------------------

export const getStoreProfiles = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .in('role', ['brand', 'admin']);
    
  if (error) throw error;
  
  return data.map(store => ({
    ...store,
    name: store.brand_name || store.full_name || 'Brand Name',
    logo: store.avatar_url || 'https://api.dicebear.com/7.x/shapes/svg?seed=brand',
    sector: store.category || 'عام',
    location: store.wilaya || 'الجزائر',
    activeCampaigns: 0,
    totalBudget: 0,
    verified: store.is_verified || false
  }));
};

export const getCreatorProfiles = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'creator');
    
  if (error) throw error;
  
  return data.map(creator => ({
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
};

export const updateProfile = async (userId, profileData) => {
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id: userId, ...profileData })
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

export const getCreators = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'creator');
    
  if (error) throw error;
  return data;
};

// ------------------------------------------------------------------
// CAMPAIGNS
// ------------------------------------------------------------------

export const getCampaigns = async () => {
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
  return data;
};

export const createCampaign = async (campaignData) => {
  const { data, error } = await supabase
    .from('campaigns')
    .insert([campaignData])
    .select();
    
  if (error) throw error;
  return data;
};

export const updateCampaign = async (campaignId, updates) => {
  const { data, error } = await supabase
    .from('campaigns')
    .update(updates)
    .eq('id', campaignId)
    .select();
    
  if (error) throw error;
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
  return data;
};

// ------------------------------------------------------------------
// APPLICATIONS & DEALS
// ------------------------------------------------------------------

export const applyToCampaign = async (campaignId, creatorId, pitchData = {}) => {
  const payload = {
    campaign_id: campaignId,
    creator_id: creatorId,
    status: 'pending',
    ...pitchData
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
  if (deliverableUrl) updateData.deliverable_url = deliverableUrl;
  
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
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .or(`and(sender_id.eq.${userId1},receiver_id.eq.${userId2}),and(sender_id.eq.${userId2},receiver_id.eq.${userId1})`)
    .order('created_at', { ascending: true });
    
  if (error) throw error;
  return data;
};

export const sendMessage = async (senderId, receiverId, text) => {
  const { data, error } = await supabase
    .from('messages')
    .insert([{ sender_id: senderId, receiver_id: receiverId, text }])
    .select();
    
  if (error) throw error;
  return data;
};

export const subscribeToMessages = (userId, callback) => {
  const subscription = supabase
    .channel('messages_channel')
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
  const { data, error } = await supabase
    .from('notifications')
    .insert([{ user_id: userId, title, message }])
    .select();
    
  if (error) throw error;
  return data;
};
export const addReview = async (creatorId, rating, reviewText) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from('reviews')
      .insert({
        creator_id: creatorId,
        brand_id: user.id,
        rating,
        review_text: reviewText
      });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error adding review:", error);
    throw error;
  }
};
