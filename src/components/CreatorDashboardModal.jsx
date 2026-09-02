import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  X, LayoutDashboard, User, Briefcase, Wallet, 
  TrendingUp, DollarSign, Lock, Send, Calendar, Star, Sparkles, CheckCircle2, Play, Camera, Globe, MessageSquare, SendHorizontal, Upload, Clock, CreditCard, BadgeCheck
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { getLocalizedItem } from '../utils/localized';
import { formatDZD, getPaymentStatusConfig } from '../services/chargilyService';
import CampaignApplyModal from './CampaignApplyModal';
import OptimizedImage from './OptimizedImage';
import { 
  validatePayoutForm, 
  validateAlgerianRIP, 
  validateUrl, 
  validateChatMessage, 
  sanitizeText, 
  validateAmount, 
  validateAlgerianPhone,
  validateSocialUrl
} from '../utils/validators';

export default function CreatorDashboardModal({ isOpen, onClose, initialTab = 'overview', initialContactId = null }) {
  const { user, updateProfileData } = useAuth();
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState(initialTab);
  
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaignToApply, setSelectedCampaignToApply] = useState(null);
  const [opportunitySearch, setOpportunitySearch] = useState('');
  const [opportunityCategory, setOpportunityCategory] = useState('الكل');

  // Profile State
  const [profileData, setProfileData] = useState({
    fullName: user?.profile?.full_name || user?.user_metadata?.full_name || '',
    category: user?.profile?.category || 'تكنولوجيا',
    bio: user?.profile?.bio || user?.user_metadata?.bio || 'صانع محتوى جزائري مهتم بالتقنية وأسلوب الحياة.',
    ratePerPost: user?.profile?.rate_per_post || '25000',
    wilaya: user?.profile?.wilaya || 'الجزائر',
    phone: user?.profile?.phone || '',
    instagramUrl: user?.profile?.instagram_url || 'https://instagram.com/creator_dz',
    tiktokUrl: user?.profile?.tiktok_url || 'https://tiktok.com/@creator_dz',
    youtubeUrl: user?.profile?.youtube_url || 'https://youtube.com/@creator_dz',
    facebookUrl: user?.profile?.facebook_url || '',
    ripNumber: user?.profile?.rip_number || ''
  });
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Payout Form State
  const [payoutForm, setPayoutForm] = useState({ amount: '', ripNumber: '', method: 'baridimob' });
  const [payoutSuccess, setPayoutSuccess] = useState(false);
  const [payoutError, setPayoutError] = useState('');
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [withdrawnAmount, setWithdrawnAmount] = useState(0);
  const [localTransactions, setLocalTransactions] = useState([]);

  // Chat State
  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [availableStores, setAvailableStores] = useState([]);
  const [activeContactProfile, setActiveContactProfile] = useState(null);
  const [selectedContactId, setSelectedContactId] = useState(initialContactId);
  const [chatError, setChatError] = useState('');
  const messagesEndRef = useRef(null);

  // Load stores so the creator can always message partner stores even before any initial reply
  useEffect(() => {
    import('../services/dbService').then(({ getStoreProfiles }) => {
      getStoreProfiles().then(stores => {
        if (stores && Array.isArray(stores)) {
          setAvailableStores(stores);
        }
      }).catch(err => console.warn('Could not load stores for creator chat:', err));
    });
  }, []);

  useEffect(() => {
    if (initialContactId) {
      setSelectedContactId(initialContactId);
      setActiveTab('messages');
      import('../services/dbService').then(({ getProfileById }) => {
        getProfileById(initialContactId).then(prof => {
          if (prof) setActiveContactProfile(prof);
        }).catch(err => console.warn('Could not fetch active contact profile:', err));
      });
    }
  }, [initialContactId]);

  // Handle Escape key to close dashboard
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const [deliverableUrls, setDeliverableUrls] = useState({});

  const handleSubmitDeliverable = async (applicationId) => {
    const rawUrl = deliverableUrls[applicationId];
    if (!rawUrl || !rawUrl.trim()) {
      alert('يرجى إدخال رابط العمل المسلّم');
      return;
    }
    const urlCheck = validateUrl(rawUrl);
    if (!urlCheck.isValid) {
      alert(urlCheck.error || 'يرجى إدخال رابط صالح (مثل: رابط Google Drive أو Instagram Reel)');
      return;
    }
    const url = urlCheck.normalized;
    try {
      const { updateApplicationStatus, createNotification } = await import('../services/dbService');
      await updateApplicationStatus(applicationId, 'approved', url); // status is still approved, but URL added
      
      const app = applications.find(a => a.id === applicationId);
      if (app && app.campaign?.brand_id) {
        await createNotification(
          app.campaign.brand_id,
          'تم استلام العمل',
          `قام ${user?.user_metadata?.full_name || 'صانع المحتوى'} بتسليم العمل لحملة "${app.campaign.title}". يرجى المراجعة.`
        );
      }

      setApplications(applications.map(a => 
        a.id === applicationId ? { ...a, deliverable_url: url } : a
      ));
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error("Error submitting deliverable:", err);
      alert('حدث خطأ أثناء تسليم العمل. يرجى المحاولة مرة أخرى.');
    }
  };

  const [appliedCampaigns, setAppliedCampaigns] = useState([]);
  const [applications, setApplications] = useState([]);

  // Derive unique contacts from DB conversations, applications, and any active selection
  const contacts = useMemo(() => {
    const contactsMap = new Map();

    // 1. Existing conversations from DB
    for (const conv of conversations) {
      if (conv?.id) {
        contactsMap.set(conv.id, {
          id: conv.id,
          brand_name: conv.brand_name || conv.full_name || 'متجر',
          full_name: conv.full_name || conv.brand_name || 'متجر',
          avatar_url: conv.avatar_url || '',
          category: conv.category || '',
          wilaya: conv.wilaya || '',
          is_verified: Boolean(conv.is_verified),
          lastMessage: conv.lastMessage || '',
          lastMessageAt: conv.lastMessageAt || null
        });
      }
    }

    // 2. Brands from campaign applications
    for (const app of applications) {
      if (app?.campaign?.brand_id) {
        const brandId = app.campaign.brand_id;
        if (!contactsMap.has(brandId)) {
          contactsMap.set(brandId, {
            id: brandId,
            brand_name: app.campaign.brand?.brand_name || app.campaign.brand?.full_name || 'متجر',
            full_name: app.campaign.brand?.full_name || app.campaign.brand?.brand_name || 'متجر',
            avatar_url: app.campaign.brand?.avatar_url || '',
            category: app.campaign.brand?.category || '',
            wilaya: app.campaign.brand?.wilaya || '',
            is_verified: Boolean(app.campaign.brand?.is_verified),
            lastMessage: `حملة: ${app.campaign.title || ''}`,
            lastMessageAt: app.created_at
          });
        }
      }
    }

    // 3. Active selected contact if not already in list
    const targetContactId = selectedContactId || initialContactId;
    if (targetContactId && !contactsMap.has(targetContactId)) {
      if (activeContactProfile && activeContactProfile.id === targetContactId) {
        contactsMap.set(targetContactId, {
          id: targetContactId,
          brand_name: activeContactProfile.brand_name || activeContactProfile.full_name || 'متجر',
          full_name: activeContactProfile.full_name || activeContactProfile.brand_name || 'متجر',
          avatar_url: activeContactProfile.avatar_url || '',
          category: activeContactProfile.category || '',
          wilaya: activeContactProfile.wilaya || '',
          is_verified: Boolean(activeContactProfile.is_verified),
          lastMessage: 'محادثة مباشرة مع المتجر',
          lastMessageAt: new Date().toISOString()
        });
      }
    }

    // 4. Available partner stores on the platform (so creators can chat anytime)
    for (const store of availableStores) {
      if (store?.id && !contactsMap.has(store.id) && store.id !== user?.id) {
        contactsMap.set(store.id, {
          id: store.id,
          brand_name: store.brand_name || store.name || store.full_name || 'متجر',
          full_name: store.full_name || store.brand_name || store.name || 'متجر',
          avatar_url: store.avatar_url || store.logo || '',
          category: store.category || store.sector || 'متجر معتمد',
          wilaya: store.wilaya || store.location || '',
          is_verified: Boolean(store.is_verified ?? true),
          lastMessage: 'متجر معتمد متاح للرعاية والتعاون 🛍️',
          lastMessageAt: null
        });
      }
    }

    return Array.from(contactsMap.values());
  }, [conversations, applications, selectedContactId, initialContactId, activeContactProfile, availableStores, user?.id]);

  // Auto-select first contact if none selected when in messages tab or on data load
  useEffect(() => {
    if (!selectedContactId && contacts.length > 0) {
      setSelectedContactId(contacts[0].id);
    }
  }, [selectedContactId, contacts]);

  useEffect(() => {
    if (!selectedContactId || !user?.id) return;
    
    let subscription = null;
    let isMounted = true;
    import('../services/dbService').then(({ getMessages, subscribeToMessages, getUserConversations }) => {
      if (!isMounted) return;
      getMessages(user.id, selectedContactId).then(fetchedMessages => {
        if (isMounted) setMessages(fetchedMessages || []);
      });
      
      subscription = subscribeToMessages(user.id, (newMsg) => {
        // Only append if it belongs to the current conversation
        if (
          (newMsg.sender_id === user.id && newMsg.receiver_id === selectedContactId) ||
          (newMsg.sender_id === selectedContactId && newMsg.receiver_id === user.id)
        ) {
          if (isMounted) {
            setMessages(prev => {
              const isDuplicate = prev.some(m => m.id === newMsg.id);
              if (isDuplicate) return prev;
              // Replace optimistic message with real one from DB
              const hasOptimistic = prev.some(
                m => m.id?.startsWith('optimistic_') && m.sender_id === newMsg.sender_id && m.text === newMsg.text
              );
              if (hasOptimistic) {
                return prev.map(m =>
                  m.id?.startsWith('optimistic_') && m.sender_id === newMsg.sender_id && m.text === newMsg.text
                    ? newMsg : m
                );
              }
              return [...prev, newMsg];
            });
          }
        }

        // Always update conversation preview or refresh conversations
        const partnerId = newMsg.sender_id === user.id ? newMsg.receiver_id : newMsg.sender_id;
        if (isMounted && partnerId) {
          setConversations(prev => {
            const existingIdx = prev.findIndex(c => c.id === partnerId);
            if (existingIdx !== -1) {
              const updated = [...prev];
              updated[existingIdx] = {
                ...updated[existingIdx],
                lastMessage: newMsg.text,
                lastMessageAt: newMsg.created_at
              };
              return updated;
            } else {
              getUserConversations(user.id).then(fresh => {
                if (isMounted) setConversations(fresh || []);
              });
              return prev;
            }
          });
        }
      });
    });

    return () => {
      isMounted = false;
      if (subscription) subscription.unsubscribe();
    };
  }, [selectedContactId, user]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!selectedContactId || !user?.id) return;
    
    const msgCheck = validateChatMessage(chatMessage);
    if (!msgCheck.isValid) {
      setChatError(msgCheck.error || 'الرسالة غير صالحة');
      return;
    }
    
    const msgText = msgCheck.sanitized;
    setChatMessage('');
    setChatError('');

    // Optimistic update — show message immediately in UI
    const optimisticMsg = {
      id: `optimistic_${Date.now()}`,
      sender_id: user.id,
      receiver_id: selectedContactId,
      text: msgText,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimisticMsg]);
    
    try {
      const { sendMessage } = await import('../services/dbService');
      const saved = await sendMessage(user.id, selectedContactId, msgText);
      // Replace optimistic message with real one from DB
      if (saved?.[0]) {
        setMessages(prev => prev.map(m => m.id === optimisticMsg.id ? saved[0] : m));
      }
      // Immediately reflect in conversations list
      setConversations(prev => {
        const existingIdx = prev.findIndex(c => c.id === selectedContactId);
        const contactData = contacts.find(c => c.id === selectedContactId);
        if (existingIdx !== -1) {
          const updated = [...prev];
          updated[existingIdx] = {
            ...updated[existingIdx],
            lastMessage: msgText,
            lastMessageAt: new Date().toISOString()
          };
          return updated;
        } else if (contactData) {
          return [{
            ...contactData,
            lastMessage: msgText,
            lastMessageAt: new Date().toISOString()
          }, ...prev];
        }
        return prev;
      });
    } catch (err) {
      console.error("Error sending message:", err);
      // Remove optimistic message and show error in UI
      setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
      setChatMessage(msgText);
      setChatError(`خطأ: ${err?.message || err?.code || 'فشل إرسال الرسالة'} — Code: ${err?.code || 'unknown'}`);
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (initialTab) {
        setActiveTab(initialTab);
      }
      if (initialContactId) {
        setSelectedContactId(initialContactId);
      }
    }
  }, [isOpen, initialTab, initialContactId]);

  useEffect(() => {
    if (!isOpen || !user?.id) return;
    import('../services/dbService').then(({ getCampaigns, getCreatorApplications, getUserConversations }) => {
      Promise.all([
        getCampaigns().catch(() => []),
        getCreatorApplications(user.id).catch(() => []),
        getUserConversations(user.id).catch(() => [])
      ])
        .then(([allCampaigns, apps, convos]) => {
          setCampaigns(allCampaigns || []);
          if (apps && apps.length > 0) {
            setApplications(apps);
            setAppliedCampaigns(apps.map(app => app.campaign_id));
          }
          setConversations(convos || []);
        })
        .catch(err => {
          console.error("Error fetching creator data:", err);
        });
    });
  }, [isOpen, user]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSaveProfile = async (e) => {
    e.preventDefault();

    let sanitizedPhone = profileData.phone?.trim() || '';
    if (sanitizedPhone) {
      const phoneCheck = validateAlgerianPhone(sanitizedPhone);
      if (!phoneCheck.isValid) {
        alert(phoneCheck.error);
        return;
      }
      sanitizedPhone = phoneCheck.formatted;
    }

    let sanitizedRate = profileData.ratePerPost;
    if (sanitizedRate) {
      const rateCheck = validateAmount(sanitizedRate, { min: 500, max: 2000000, fieldName: 'سعر المنشور' });
      if (!rateCheck.isValid) {
        alert(rateCheck.error);
        return;
      }
      sanitizedRate = rateCheck.value;
    }

    const instagramCheck = validateSocialUrl('instagram', profileData.instagramUrl);
    const tiktokCheck = validateSocialUrl('tiktok', profileData.tiktokUrl);
    const youtubeCheck = validateSocialUrl('youtube', profileData.youtubeUrl);
    const facebookCheck = validateSocialUrl('facebook', profileData.facebookUrl);

    if (updateProfileData) {
      await updateProfileData({
        full_name: sanitizeText(profileData.fullName, 70),
        category: profileData.category,
        bio: sanitizeText(profileData.bio, 500),
        rate_per_post: sanitizedRate,
        wilaya: profileData.wilaya,
        phone: sanitizedPhone,
        instagram_url: instagramCheck.normalized,
        tiktok_url: tiktokCheck.normalized,
        youtube_url: youtubeCheck.normalized,
        facebook_url: facebookCheck.normalized,
        rip_number: profileData.ripNumber?.trim() || null
      });
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handlePayoutSubmit = async (e) => {
    e.preventDefault();
    setPayoutError('');

    // Calculate current real available balance
    const currentAvailable = applications
      .filter(app => app.status === 'completed')
      .reduce((sum, app) => sum + (app.campaign?.budget || 0), 0) - withdrawnAmount;

    // Validate using central validator
    const validation = validatePayoutForm(payoutForm, currentAvailable);
    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0];
      setPayoutError(firstError);
      return;
    }

    const amount = Number(payoutForm.amount);
    const cleanedRip = payoutForm.ripNumber.trim().replace(/\D/g, '');

    setPayoutLoading(true);

    try {
      const { createPayoutRequest, createNotification } = await import('../services/dbService');
      
      if (user?.id) {
        await createPayoutRequest({
          creatorId: user.id,
          amountDzd: amount,
          ripNumber: cleanedRip,
          payoutMethod: payoutForm.method || 'baridimob'
        });

        // Notify creator
        await createNotification(
          user.id,
          'تم استلام طلب السحب بنجاح 💸',
          `طلب سحب مبلغ ${amount.toLocaleString('ar-DZ')} د.ج إلى الحساب (${cleanedRip.slice(-4)}) قيد المعالجة.`
        );
      }

      setWithdrawnAmount(prev => prev + amount);
      setLocalTransactions(prev => [{
        id: `TX-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        description: `طلب سحب أرباح (${payoutForm.method === 'baridimob' ? 'BaridiMob' : 'CCP'})`,
        amount: amount,
        status: 'pending'
      }, ...prev]);

      setPayoutSuccess(true);
      setPayoutForm({ amount: '', ripNumber: '', method: 'baridimob' });
      setTimeout(() => {
        setPayoutSuccess(false);
      }, 4000);
    } catch (err) {
      console.error('Error submitting payout request:', err);
      setPayoutError('حدث خطأ أثناء معالجة طلب السحب. يرجى المحاولة لاحقاً.');
    } finally {
      setPayoutLoading(false);
    }
  };

  const handleApply = async (campaignId) => {
    if (!appliedCampaigns.includes(campaignId) && user?.id) {
      try {
        const { applyToCampaign, createNotification, getCreatorApplications } = await import('../services/dbService');
        await applyToCampaign(campaignId, user.id);
        
        // Bug #10 fix: Re-fetch full applications with campaign join
        const freshApps = await getCreatorApplications(user.id);
        if (freshApps) {
          setApplications(freshApps);
          setAppliedCampaigns(freshApps.map(app => app.campaign_id));
        }
        
        const campaign = campaigns.find(c => c.id === campaignId);
        if (campaign && campaign.brand_id) {
           await createNotification(
             campaign.brand_id,
             'طلب تقديم جديد',
             `قام ${user?.user_metadata?.full_name || 'صانع محتوى'} بالتقديم على حملتك "${campaign.title}".`
           );
        }
      } catch (err) {
        console.error("Error applying to campaign:", err);
      }
    }
  };



  return (
    <div 
      className="fixed inset-0 z-50 bg-white/95 backdrop-blur-md overflow-y-auto" 
      role="dialog"
      aria-modal="true"
      aria-labelledby="creator-dashboard-title"
      dir="rtl"
    >
      {/* Header Bar */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-brand-border px-4 sm:px-8 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[16px] bg-brand-orange/10 text-brand-orange flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 id="creator-dashboard-title" className="text-xl font-black text-brand-brown flex items-center gap-2">
              {t('creatorDashboard')}
              <span className="px-3 py-1 rounded-full bg-brand-orange/10 text-brand-orange text-xs font-bold">{t('roleCreator')}</span>
            </h2>
            <p className="text-xs font-medium text-brand-brownLight">{t('welcomeUser')}، {user?.user_metadata?.full_name || t('roleCreator')}</p>
          </div>
        </div>

        <button 
          type="button"
          onClick={onClose}
          aria-label="إغلاق لوحة تحكم صانع المحتوى"
          className="p-2 text-brand-brownLight hover:text-brand-brown rounded-full hover:bg-brand-cream transition-colors"
        >
          <X className="w-6 h-6" aria-hidden="true" />
        </button>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
        {/* Navigation Tabs */}
        <div role="tablist" aria-label="أقسام لوحة التحكم" className="flex gap-2 overflow-x-auto no-scrollbar pb-4 mb-8 border-b border-brand-border">
          {[
            { id: 'overview', label: t('dashOverview'), icon: LayoutDashboard },
            { id: 'opportunities', label: t('dashOpportunities'), icon: Briefcase },
            { id: 'messages', label: 'الرسائل والمحادثات', icon: MessageSquare },
            { id: 'profile', label: t('dashProfile'), icon: User },
            { id: 'wallet', label: `${t('dashWallet')} 💰`, icon: Wallet },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-3 rounded-full font-bold text-sm flex items-center gap-2.5 transition-all whitespace-nowrap ${
                  isActive
                    ? 'btn-primary shadow-lg scale-105'
                    : 'bg-white border border-brand-border text-brand-brownLight hover:bg-brand-cream hover:text-brand-brown'
                }`}
              >
                <Icon className="w-4 h-4" aria-hidden="true" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fade-in">
            {/* Stats Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white border border-brand-border rounded-[24px] p-6 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-brand-brownLight text-sm font-bold">إجمالي الحملات</span>
                  <div className="p-2 bg-brand-cream text-brand-orange rounded-xl"><Briefcase className="w-5 h-5" /></div>
                </div>
                <div className="text-3xl font-black text-brand-brown">12</div>
                <p className="text-xs font-bold text-emerald-500 mt-2">↑ 2 حملة جديدة هذا الشهر</p>
              </div>

              <div className="bg-white border border-brand-border rounded-[24px] p-6 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-brand-brownLight text-sm font-bold">الإيرادات المحققة</span>
                  <div className="p-2 bg-emerald-50 text-emerald-500 rounded-xl"><DollarSign className="w-5 h-5" /></div>
                </div>
                <div className="text-3xl font-black text-brand-orange">{formatDZD(185000)}</div>
                <p className="text-xs font-medium text-brand-brownLight mt-2">محولة عبر الذهبية و CIB</p>
              </div>

              <div className="bg-white border border-brand-border rounded-[24px] p-6 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-brand-brownLight text-sm font-bold">نسبة التفاعل</span>
                  <div className="p-2 bg-purple-50 text-purple-500 rounded-xl"><TrendingUp className="w-5 h-5" /></div>
                </div>
                <div className="text-3xl font-black text-purple-600">5.8%</div>
                <p className="text-xs font-bold text-purple-500 mt-2">أعلى من المتوسط بـ 1.2%</p>
              </div>

              <div className="bg-white border border-brand-border rounded-[24px] p-6 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-brand-brownLight text-sm font-bold">التقييم</span>
                  <div className="p-2 bg-amber-50 text-amber-500 rounded-xl"><Star className="w-5 h-5 fill-amber-500" /></div>
                </div>
                <div className="text-3xl font-black text-amber-600">4.9 / 5.0</div>
                <p className="text-xs font-medium text-brand-brownLight mt-2">من 24 علامة تجارية</p>
              </div>
            </div>

            {/* Applications List */}
            <div className="bg-white border border-brand-border rounded-[24px] p-6 shadow-sm">
              <h3 className="text-lg font-black text-brand-brown mb-4">طلبك الأخير للحملات</h3>
              <div className="space-y-4">
                {applications.length === 0 ? (
                  <div className="text-center font-medium text-brand-brownLight text-sm mt-4">لم تقدم على أي حملة بعد.</div>
                ) : (
                  applications.slice(0, 3).map((app) => (
                    <div key={app.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 rounded-[16px] bg-brand-cream border border-brand-border gap-4">
                      <div className="flex items-center gap-3">
                        <OptimizedImage 
                          src={app.campaign?.brand?.avatar_url} 
                          fallbackType="brand"
                          seed={app.campaign?.title}
                          alt="Brand Avatar" 
                          width="48"
                          height="48"
                          className="w-12 h-12 rounded-[16px] border border-brand-border bg-white" 
                        />
                        <div>
                          <h4 className="font-bold text-brand-brown">{app.campaign?.title}</h4>
                          <p className="text-xs font-medium text-brand-brownLight mt-0.5">الميزانية: <span className="text-brand-orange font-bold">{formatDZD(app.campaign?.budget)}</span></p>
                        </div>
                      </div>
                      <span className={`px-4 py-1.5 rounded-full text-xs font-black border ${
                        app.status === 'approved' || app.status === 'completed'
                          ? 'bg-blue-50 text-blue-600 border-blue-200'
                          : 'bg-amber-50 text-amber-600 border-amber-200'
                      }`}>
                        {app.status === 'approved' ? 'مقبول' : app.status === 'completed' ? 'منتهي' : 'قيد المراجعة'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Direct Messages & Conversations Widget */}
            <div className="bg-white border border-brand-border rounded-[24px] p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black text-brand-brown flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-brand-orange" />
                  <span>رسائل ومحادثات المتاجر</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveTab('messages')}
                  className="text-xs font-bold text-brand-orange hover:underline flex items-center gap-1"
                >
                  عرض كافة المحادثات ({contacts.length}) ←
                </button>
              </div>

              <div className="space-y-3">
                {contacts.length === 0 ? (
                  <div className="p-6 text-center text-brand-brownLight bg-brand-cream/40 rounded-2xl border border-brand-border/60">
                    <p className="font-bold text-sm text-brand-brown mb-1">لا توجد رسائل جديدة حالياً</p>
                    <p className="text-xs text-brand-brownLight">عندما يتواصل معك أي متجر لبدء حملة، ستظهر رسالته هنا مباشرة.</p>
                  </div>
                ) : (
                  contacts.slice(0, 3).map((contact) => (
                    <div 
                      key={contact.id} 
                      className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 rounded-[16px] bg-brand-cream border border-brand-border gap-4 hover:border-brand-orange/40 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <OptimizedImage 
                          src={contact.avatar_url} 
                          fallbackType="brand"
                          seed={contact.brand_name || 'Brand'}
                          alt="Brand Avatar" 
                          width="48"
                          height="48"
                          className="w-12 h-12 rounded-[16px] border border-brand-border bg-white object-cover shrink-0" 
                        />
                        <div className="min-w-0">
                          <h4 className="font-bold text-brand-brown text-sm flex items-center gap-1.5 truncate">
                            <span>{contact.brand_name || contact.full_name || 'متجر'}</span>
                            {contact.is_verified && <BadgeCheck className="w-4 h-4 text-brand-orange shrink-0" />}
                          </h4>
                          <p className="text-xs font-medium text-brand-brownLight mt-0.5 truncate max-w-md">
                            {contact.lastMessage || 'محادثة مباشرة مع المتجر'}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedContactId(contact.id);
                          setActiveTab('messages');
                        }}
                        className="btn-primary text-xs !py-2 !px-4 flex items-center gap-1.5 shrink-0"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>فتح المحادثة والرد</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Opportunities */}
        {activeTab === 'opportunities' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-xl font-black text-brand-brown mb-1">فرص الرعاية المتاحة للتقديم</h3>
                <p className="text-brand-brownLight font-medium text-xs">{t('opportunitiesSub')}</p>
              </div>
            </div>

            {/* Opportunities Search & Category Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="ابحث في الحملات بالاسم أو المجال..."
                className="input-field text-xs flex-1 py-2.5 bg-white"
                value={opportunitySearch}
                onChange={(e) => setOpportunitySearch(e.target.value)}
              />
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {['الكل', 'تكنولوجيا', 'موضة وأزياء', 'تجميل وعناية', 'طبخ وأكل', 'سفر وسياحة'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setOpportunityCategory(cat)}
                    className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                      opportunityCategory === cat
                        ? 'bg-brand-orange text-white border-brand-orange shadow-sm'
                        : 'bg-white text-brand-brownLight border-brand-border hover:border-brand-orange/30'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {campaigns
                .filter(c => {
                  const matchCat = opportunityCategory === 'الكل' || c.category === opportunityCategory;
                  const title = (c.title || '').toLowerCase();
                  const desc = (c.description || '').toLowerCase();
                  const matchSearch = opportunitySearch === '' || 
                    title.includes(opportunitySearch.toLowerCase()) || 
                    desc.includes(opportunitySearch.toLowerCase());
                  return matchCat && matchSearch;
                })
                .map((campaign) => {
                const campaignTitle = getLocalizedItem(campaign, 'title', language) || campaign.title;
                const campaignCategory = getLocalizedItem(campaign, 'category', language) || campaign.category;
                const campaignDesc = getLocalizedItem(campaign, 'description', language) || campaign.description;
                const campaignDeliverables = (campaign.deliverables && campaign.deliverables[language]) || campaign.deliverables?.ar || campaign.deliverables || [];

                return (
                  <div key={campaign.id} className="bg-white border border-brand-border rounded-[24px] shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <OptimizedImage 
                            src={campaign.brand?.avatar_url || campaign.brandLogo} 
                            fallbackType="brand"
                            seed={campaignTitle}
                            alt="Brand" 
                            width="48"
                            height="48"
                            className="w-12 h-12 rounded-[16px] bg-brand-cream border border-brand-border object-cover" 
                          />
                          <div>
                            <h4 className="font-bold text-brand-brown text-base">{campaignTitle}</h4>
                            <span className="text-xs font-medium text-brand-brownLight">{campaignCategory}</span>
                          </div>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-black bg-brand-orange/10 text-brand-orange border border-brand-orange/20 font-mono">
                          {formatDZD(campaign.budget, language)}
                        </span>
                      </div>

                      <p className="text-xs font-medium text-brand-brownLight mb-4 leading-relaxed line-clamp-3">{campaignDesc}</p>

                      <div className="space-y-2 mb-6">
                        <span className="text-xs text-brand-brownLight font-bold block">{t('deliverablesRequired')}</span>
                        <div className="flex flex-wrap gap-1.5">
                          {(Array.isArray(campaignDeliverables) ? campaignDeliverables : [campaignDeliverables]).map((item, idx) => (
                            <span key={idx} className="px-2.5 py-1 rounded-md bg-brand-cream text-brand-brown font-medium text-[11px] border border-brand-border">
                              ✓ {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {(() => {
                      const app = applications.find(a => a.campaign_id === campaign.id);
                      if (app) {
                        if (app.status === 'pending') {
                          return (
                            <button disabled className="bg-brand-cream border border-brand-border text-brand-brownLight font-bold rounded-full w-full py-3 flex items-center justify-center gap-2 opacity-75 cursor-not-allowed text-xs">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>تم التقديم - قيد مراجعة المتجر ⏳</span>
                            </button>
                          );
                        } else if (app.status === 'approved') {
                          if (app.deliverable_url) {
                            return (
                              <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50 text-center text-xs text-emerald-700 font-bold flex items-center justify-center gap-2">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>تم إرسال العمل وبانتظار المراجعة والتحرير 📦</span>
                              </div>
                            );
                          }
                          return (
                            <div className="space-y-2.5">
                              <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold text-center">
                                🎉 تم قبولك! المبلغ محفوظ في الضمان. أرسل رابط العمل الآن:
                              </div>
                              <input 
                                type="url" 
                                placeholder="رابط العمل (Google Drive, Instagram Reel, Tiktok...)"
                                className="input-field w-full text-xs font-mono"
                                value={deliverableUrls[app.id] || ''}
                                onChange={e => setDeliverableUrls({ ...deliverableUrls, [app.id]: e.target.value })}
                              />
                              <button 
                                onClick={() => handleSubmitDeliverable(app.id)}
                                className="btn-primary w-full py-2.5 text-xs font-bold"
                              >
                                تسليم رابط العمل
                              </button>
                            </div>
                          );
                        } else if (app.status === 'completed') {
                          return (
                            <div className="p-3 rounded-xl border border-purple-200 bg-purple-50 text-center text-xs text-purple-700 font-bold flex items-center justify-center gap-2">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>الصفقة مكتملة وتم تحرير الأرباح لمحفظتك ✅</span>
                            </div>
                          );
                        } else if (app.status === 'rejected') {
                          return (
                            <div className="p-3 rounded-xl border border-gray-200 bg-gray-50 text-center text-xs text-gray-500 font-bold">
                              لم يتم اختيار طلبك لهذه الحملة
                            </div>
                          );
                        }
                      }
                      return (
                        <button 
                          onClick={() => setSelectedCampaignToApply(campaign)}
                          className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-xs font-bold shadow-sm"
                        >
                          <Send className="w-4 h-4" />
                          <span>{t('applyNow')}</span>
                        </button>
                      );
                    })()}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2.5: Messages (Chat) */}
        {activeTab === 'messages' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px] animate-fade-in">
            {/* Sidebar - Contacts */}
            <div className="bg-white border border-brand-border rounded-[24px] flex flex-col h-full lg:col-span-1 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-brand-border font-black text-brand-brown flex items-center justify-between bg-brand-cream/50">
                <span className="text-sm">المحادثات المباشرة</span>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-brand-border/40">
                {contacts.length === 0 ? (
                  <div className="p-6 text-brand-brownLight font-medium text-xs text-center space-y-2">
                    <MessageSquare className="w-8 h-8 mx-auto text-brand-orange/40" />
                    <p>لا توجد محادثات بعد.</p>
                    <p className="text-[11px] text-brand-brownLight/70">عندما يتواصل معك أحد المتاجر أو عند التقديم على الحملات، ستظهر الرسائل هنا.</p>
                  </div>
                ) : (
                  contacts.map(contact => (
                    <div 
                      key={contact.id} 
                      onClick={() => setSelectedContactId(contact.id)}
                      className={`p-3.5 cursor-pointer flex items-center gap-3 transition-colors border-r-4 ${
                        selectedContactId === contact.id 
                          ? 'bg-brand-cream border-r-brand-orange shadow-inner' 
                          : 'hover:bg-brand-cream/40 border-r-transparent'
                      }`}
                    >
                      <OptimizedImage 
                        src={contact.avatar_url} 
                        fallbackType="brand"
                        seed={contact.brand_name || 'Brand'}
                        alt="Brand Avatar" 
                        width="44"
                        height="44"
                        className="w-11 h-11 rounded-[14px] border border-brand-border bg-white object-cover shrink-0" 
                      />
                      <div className="overflow-hidden flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="font-bold text-brand-brown text-xs truncate flex items-center gap-1">
                            <span>{contact.brand_name || contact.full_name || 'متجر'}</span>
                            {contact.is_verified && <BadgeCheck className="w-3.5 h-3.5 text-brand-orange shrink-0" />}
                          </h4>
                          {contact.lastMessageAt && (
                            <span className="text-[9px] text-brand-brownLight/70 shrink-0">
                              {new Date(contact.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] font-medium text-brand-brownLight truncate mt-0.5">
                          {contact.lastMessage || contact.category || 'متجر'}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Main Chat Area */}
            <div className="bg-white border border-brand-border rounded-[24px] flex flex-col h-full lg:col-span-2 shadow-sm overflow-hidden">
              {selectedContactId ? (
                <>
                  <div className="p-4 border-b border-brand-border flex items-center gap-3 bg-brand-cream/40 z-10">
                    <OptimizedImage 
                      src={contacts.find(c => c.id === selectedContactId)?.avatar_url} 
                      fallbackType="brand"
                      seed={contacts.find(c => c.id === selectedContactId)?.brand_name || 'Brand'}
                      alt="Brand Avatar" 
                      width="40"
                      height="40"
                      className="w-10 h-10 rounded-[12px] border border-brand-border bg-brand-cream object-cover" 
                    />
                    <div>
                      <h3 className="font-bold text-brand-brown text-sm flex items-center gap-1.5">
                        <span>{contacts.find(c => c.id === selectedContactId)?.brand_name || contacts.find(c => c.id === selectedContactId)?.full_name || 'متجر'}</span>
                        {contacts.find(c => c.id === selectedContactId)?.is_verified && <BadgeCheck className="w-4 h-4 text-brand-orange" />}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] font-medium text-emerald-600 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> متصل
                        </span>
                        {contacts.find(c => c.id === selectedContactId)?.category && (
                          <>
                            <span className="text-gray-300">•</span>
                            <span className="text-[10px] text-brand-brownLight font-medium">
                              {contacts.find(c => c.id === selectedContactId)?.category}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-brand-cream/30">
                    {messages.length === 0 ? (
                      <p className="text-brand-brownLight font-medium text-center text-sm">ابدأ المحادثة الآن!</p>
                    ) : (
                      messages.map((msg) => {
                        const isMe = msg.sender_id === user.id;
                        return (
                          <div key={msg.id} className={`flex flex-col max-w-[75%] ${isMe ? 'mr-auto items-end' : 'ml-auto items-start'}`}>
                            <div className={`p-3 rounded-[20px] shadow-sm ${isMe ? 'bg-brand-orange text-white rounded-br-sm' : 'bg-white border border-brand-border text-brand-brown rounded-bl-sm'}`}>
                              {msg.text}
                            </div>
                            <span className="text-[10px] font-medium text-brand-brownLight mt-1">
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="p-4 border-t border-brand-border bg-white z-10">
                    {chatError && (
                      <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded-xl text-red-700 text-[10px] font-medium break-all">
                        ⚠️ {chatError}
                      </div>
                    )}
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="اكتب رسالتك هنا..."
                        className="flex-1 bg-brand-cream border border-brand-border rounded-full px-5 py-2 text-brand-brown text-sm focus:outline-none focus:border-brand-orange transition-colors"
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                      />
                      <button type="submit" disabled={!chatMessage.trim()} className="btn-primary w-11 h-11 !p-0 rounded-full flex items-center justify-center flex-shrink-0 transition-colors disabled:opacity-50">
                        <SendHorizontal className="w-5 h-5 ml-1" />
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-brand-cream/20 h-full">
                  <div className="w-16 h-16 rounded-full bg-brand-orange/10 flex items-center justify-center mb-3">
                    <MessageSquare className="w-8 h-8 text-brand-orange" />
                  </div>
                  <h4 className="font-bold text-brand-brown text-base mb-1">نافذة المحادثة والرسائل المباشرة</h4>
                  <p className="text-xs text-brand-brownLight max-w-xs mb-4">
                    اختر أي متجر من القائمة الجانبية لبدء المحادثة ومناقشة تفاصيل التعاون والرعاية.
                  </p>
                  {contacts.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedContactId(contacts[0].id)}
                      className="btn-primary text-xs !py-2 !px-5 flex items-center gap-1.5"
                    >
                      <span>بدء المحادثة مع {contacts[0].brand_name || contacts[0].full_name || 'المتجر'}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Profile */}
        {activeTab === 'profile' && (
          <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
            <h3 className="text-xl font-black text-brand-brown mb-6">الملف الشخصي</h3>
            
            <div className="bg-white border border-brand-border rounded-[24px] p-6 shadow-sm">
              <div className="flex items-center gap-6 mb-8">
                <div className="relative">
                  <OptimizedImage 
                    src={user?.user_metadata?.avatar_url} 
                    fallbackType="creator"
                    seed={user?.user_metadata?.full_name || 'Creator'}
                    alt="Profile" 
                    width="96"
                    height="96"
                    className="w-24 h-24 rounded-full border-4 border-brand-cream object-cover bg-white" 
                  />
                  <button className="absolute bottom-0 right-0 bg-white border border-brand-border p-2 rounded-full text-brand-brown hover:bg-brand-cream transition-colors shadow-sm">
                    <Upload className="w-4 h-4" />
                  </button>
                </div>
                <div>
                  <h4 className="text-2xl font-black text-brand-brown">{user?.user_metadata?.full_name || 'Creator Name'}</h4>
                  <p className="text-brand-brownLight font-medium mt-1">{user?.email}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-brand-brown mb-2">التخصص</label>
                  <select className="input-field w-full">
                    <option value="fashion">أزياء وموضة (Fashion)</option>
                    <option value="tech">تقنية (Tech)</option>
                    <option value="food">طعام (Food)</option>
                    <option value="lifestyle">أسلوب حياة (Lifestyle)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-brand-brown mb-2">نبذة عنك</label>
                  <textarea 
                    className="input-field w-full h-32 resize-none" 
                    placeholder="اكتب نبذة مختصرة عنك وعن المحتوى الذي تقدمه..."
                    defaultValue={user?.user_metadata?.bio || ''}
                  ></textarea>
                </div>

                <div className="pt-4 border-t border-brand-border flex justify-end gap-3">
                  <button className="btn-secondary px-6 py-2">
                    إلغاء
                  </button>
                  <button className="btn-primary px-6 py-2">
                    حفظ التغييرات
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Wallet */}
        {activeTab === 'wallet' && (() => {
          const pendingEscrow = applications
            .filter(app => app.status === 'approved')
            .reduce((sum, app) => sum + (app.campaign?.budget || 0), 0);
            
          const totalEarned = applications
            .filter(app => app.status === 'completed')
            .reduce((sum, app) => sum + (app.campaign?.budget || 0), 0);
            
          const availableBalance = totalEarned - withdrawnAmount;
          
          return (
            <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
              <h3 className="text-xl font-black text-brand-brown mb-6">المحفظة والأرباح</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-br from-brand-orange to-brand-orange/80 p-6 rounded-[24px] border border-brand-orange/20 shadow-sm text-white">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-white/20 rounded-[12px]">
                      <CreditCard className="w-6 h-6 text-white" />
                    </div>
                    <span className="font-bold">الرصيد المتاح</span>
                  </div>
                  <h4 className="text-3xl font-black">{formatDZD(availableBalance)}</h4>
                  <p className="text-sm text-white/80 mt-2">جاهز للسحب</p>
                  <button className="mt-4 w-full bg-white text-brand-orange font-bold py-2 rounded-full hover:bg-brand-cream transition-colors">
                    سحب الأموال
                  </button>
                </div>

                <div className="bg-white border border-brand-border p-6 rounded-[24px] shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-brand-cream rounded-[12px]">
                      <Clock className="w-6 h-6 text-brand-brown" />
                    </div>
                    <span className="font-bold text-brand-brownLight">أرباح قيد المراجعة</span>
                  </div>
                  <h4 className="text-3xl font-black text-brand-brown">{formatDZD(pendingEscrow)}</h4>
                  <p className="text-sm font-medium text-brand-brownLight mt-2">يُحرّر فور الموافقة</p>
                </div>

                <div className="bg-white border border-brand-border p-6 rounded-[24px] shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-emerald-50 rounded-[12px] border border-emerald-100">
                      <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    </div>
                    <span className="font-bold text-brand-brownLight">إجمالي الأرباح السابقة</span>
                  </div>
                  <h4 className="text-3xl font-black text-brand-brown">{formatDZD(totalEarned)}</h4>
                  <p className="text-sm font-medium text-brand-brownLight mt-2">منذ انضمامك</p>
                </div>
              </div>

              <div className="bg-white border border-brand-border rounded-[24px] p-6 sm:p-8 shadow-sm mb-6">
                <h3 className="font-black text-brand-brown mb-4">طلب سحب الأرباح إلى حسابك (BaridiMob / CCP)</h3>
                
                {payoutError && (
                  <div className="mb-4 p-3.5 bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2">
                    <span>⚠️</span>
                    <span>{payoutError}</span>
                  </div>
                )}

                <form onSubmit={handlePayoutSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-brand-brown mb-2">المبلغ (د.ج)</label>
                    <input
                      type="number"
                      placeholder="20000"
                      min="1000"
                      max={availableBalance}
                      className="input-field w-full"
                      value={payoutForm.amount}
                      onChange={(e) => {
                        setPayoutError('');
                        setPayoutForm({ ...payoutForm, amount: e.target.value });
                      }}
                      required
                    />
                    <span className="text-[11px] text-brand-brownLight mt-1 block">الحد الأدنى للسحب: 1,000 د.ج</span>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-brand-brown mb-2">رقم الـ RIP (20 رقماً)</label>
                    <input
                      type="text"
                      placeholder="00799999000000000000"
                      maxLength={24}
                      className="input-field w-full font-mono text-sm tracking-wider"
                      value={payoutForm.ripNumber}
                      onChange={(e) => {
                        setPayoutError('');
                        // Only allow digits
                        const cleaned = e.target.value.replace(/\D/g, '').slice(0, 20);
                        setPayoutForm({ ...payoutForm, ripNumber: cleaned });
                      }}
                      required
                    />
                    <span className="text-[11px] text-brand-brownLight mt-1 block">
                      {payoutForm.ripNumber ? `${payoutForm.ripNumber.length} / 20 رقم` : 'رقم الحساب البريدي المكون من 20 رقم'}
                    </span>
                  </div>

                  <div className="flex items-end">
                    <button 
                      type="submit" 
                      disabled={payoutLoading || availableBalance < 1000} 
                      className="btn-primary w-full py-2.5 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {payoutLoading ? 'جاري الإرسال...' : 'إرسال طلب السحب'}
                    </button>
                  </div>
                </form>

                {payoutSuccess && (
                  <div className="mt-4 p-3 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-xl text-sm font-bold text-center flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>تم إرسال طلب السحب بنجاح. سيتم تحويل المبلغ إلى حسابك خلال 24 ساعة.</span>
                  </div>
                )}
              </div>

              <div className="bg-white border border-brand-border rounded-[24px] p-6 shadow-sm">
                <h4 className="font-black text-brand-brown mb-4">سجل المعاملات</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-right">
                    <thead className="text-xs text-brand-brownLight uppercase bg-brand-cream border-b border-brand-border font-bold">
                      <tr>
                        <th className="px-4 py-3 rounded-tr-[12px]">التاريخ</th>
                        <th className="px-4 py-3">الوصف</th>
                        <th className="px-4 py-3">المبلغ</th>
                        <th className="px-4 py-3">طريقة الدفع</th>
                        <th className="px-4 py-3 rounded-tl-[12px]">الحالة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {localTransactions.map((tx) => {
                        const statusCfg = getPaymentStatusConfig(tx.status);
                        return (
                          <tr key={tx.id} className="border-b border-brand-border hover:bg-brand-cream/50 transition-colors font-medium">
                            <td className="px-4 py-4 text-brand-brown">{tx.date}</td>
                            <td className="px-4 py-4 text-brand-brown">{tx.description}</td>
                            <td className="px-4 py-4 font-bold text-brand-orange font-mono">{formatDZD(tx.amount)}</td>
                            <td className="px-4 py-4">
                              <span className="px-2.5 py-1 rounded-md bg-brand-cream border border-brand-border text-brand-brownLight text-xs font-bold">الذهبية</span>
                            </td>
                            <td className="px-4 py-4">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border} border`}>
                                {statusCfg.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Campaign Application Pitch Modal */}
        <CampaignApplyModal
          isOpen={!!selectedCampaignToApply}
          onClose={() => setSelectedCampaignToApply(null)}
          campaign={selectedCampaignToApply}
          onSuccess={async () => {
            if (!user?.id) return;
            try {
              const { getCreatorApplications } = await import('../services/dbService');
              const freshApps = await getCreatorApplications(user.id);
              if (freshApps) {
                setApplications(freshApps);
                setAppliedCampaigns(freshApps.map(app => app.campaign_id));
              }
            } catch (err) {
              console.error('Error refreshing applications:', err);
            }
          }}
        />
      </div>
    </div>
  );
}
