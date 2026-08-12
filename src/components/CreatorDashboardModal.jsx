import React, { useState, useEffect } from 'react';
import { 
  X, LayoutDashboard, User, Briefcase, Wallet, 
  TrendingUp, DollarSign, Lock, Send, Calendar, Star, Sparkles, CheckCircle2, Play, Camera, Globe, MessageSquare, SendHorizontal
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { mockWallet, mockTransactions, mockPayoutRequests, getLocalizedItem } from '../data/mockData';
import { formatDZD, getPaymentStatusConfig } from '../services/chargilyService';

export default function CreatorDashboardModal({ isOpen, onClose, initialTab = 'overview', initialContactId = null }) {
  const { user, updateProfileData } = useAuth();
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState(initialTab);
  
  const [campaigns, setCampaigns] = useState([]);

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
  const [withdrawnAmount, setWithdrawnAmount] = useState(0);
  const [localTransactions, setLocalTransactions] = useState(mockTransactions);

  // Chat State
  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [selectedContactId, setSelectedContactId] = useState(initialContactId);
  const messagesEndRef = React.useRef(null);

  useEffect(() => {
    if (initialContactId) {
      setSelectedContactId(initialContactId);
    }
  }, [initialContactId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const [deliverableUrls, setDeliverableUrls] = useState({});

  const handleSubmitDeliverable = async (applicationId) => {
    const url = deliverableUrls[applicationId];
    if (!url) return;
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
    }
  };

  const [appliedCampaigns, setAppliedCampaigns] = useState([]);
  const [applications, setApplications] = useState([]);

  // Derive unique brand contacts from applications
  const contacts = Array.from(new Map(
    applications
      .filter(app => app.campaign?.brand_id)
      .map(app => [app.campaign.brand_id, { id: app.campaign.brand_id, ...app.campaign.brand }])
  ).values()).filter(c => c.id);

  useEffect(() => {
    if (!selectedContactId || !user?.id) return;
    
    let subscription = null;
    let isMounted = true;
    import('../services/dbService').then(({ getMessages, subscribeToMessages }) => {
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
          if (isMounted) setMessages(prev => [...prev, newMsg]);
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
    if (!chatMessage.trim() || !selectedContactId || !user?.id) return;
    
    const msgText = chatMessage;
    setChatMessage('');
    
    try {
      const { sendMessage } = await import('../services/dbService');
      await sendMessage(user.id, selectedContactId, msgText);
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);



  useEffect(() => {
    if (!isOpen || !user?.id) return;
    import('../services/dbService').then(({ getCampaigns, getCreatorApplications }) => {
      Promise.all([getCampaigns(), getCreatorApplications(user.id)])
        .then(([allCampaigns, apps]) => {
          setCampaigns(allCampaigns);
          if (apps && apps.length > 0) {
            setApplications(apps);
            setAppliedCampaigns(apps.map(app => app.campaign_id));
          }
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
    if (updateProfileData) {
      await updateProfileData({
        full_name: profileData.fullName,
        category: profileData.category,
        bio: profileData.bio,
        rate_per_post: profileData.ratePerPost,
        wilaya: profileData.wilaya,
        phone: profileData.phone,
        instagram_url: profileData.instagramUrl,
        tiktok_url: profileData.tiktokUrl,
        youtube_url: profileData.youtubeUrl,
        facebook_url: profileData.facebookUrl,
        rip_number: profileData.ripNumber
      });
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handlePayoutSubmit = (e) => {
    e.preventDefault();
    const amount = Number(payoutForm.amount);
    if (!amount || !payoutForm.ripNumber) return;
    
    // Validate against available balance (which is calculated in render, but we need it here)
    const currentAvailable = applications
      .filter(app => app.status === 'completed')
      .reduce((sum, app) => sum + (app.campaign?.budget || 0), 0) - withdrawnAmount;

    if (amount > currentAvailable) {
      alert("الرصيد غير كافٍ");
      return;
    }

    setWithdrawnAmount(prev => prev + amount);
    setLocalTransactions(prev => [{
      id: `TX-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      description: 'طلب سحب أرباح',
      amount: amount,
      status: 'pending'
    }, ...prev]);

    setPayoutSuccess(true);
    setTimeout(() => {
      setPayoutSuccess(false);
      setPayoutForm({ amount: '', ripNumber: '', method: 'baridimob' });
    }, 3000);
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
    <div className="fixed inset-0 z-50 bg-white/95 backdrop-blur-md overflow-y-auto" dir="rtl">
      {/* Header Bar */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-brand-border px-4 sm:px-8 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[16px] bg-brand-orange/10 text-brand-orange flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-brand-brown flex items-center gap-2">
              {t('creatorDashboard')}
              <span className="px-3 py-1 rounded-full bg-brand-orange/10 text-brand-orange text-xs font-bold">{t('roleCreator')}</span>
            </h1>
            <p className="text-xs font-medium text-brand-brownLight">{t('welcomeUser')}، {user?.user_metadata?.full_name || t('roleCreator')}</p>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="p-2 text-brand-brownLight hover:text-brand-brown rounded-full hover:bg-brand-cream transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-4 mb-8 border-b border-brand-border">
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
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-3 rounded-full font-bold text-sm flex items-center gap-2.5 transition-all whitespace-nowrap ${
                  isActive
                    ? 'btn-primary shadow-lg scale-105'
                    : 'bg-white border border-brand-border text-brand-brownLight hover:bg-brand-cream hover:text-brand-brown'
                }`}
              >
                <Icon className="w-4 h-4" />
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
                        <img src={app.campaign?.brand?.avatar_url || 'https://api.dicebear.com/7.x/shapes/svg?seed=b'} alt="Brand Avatar" className="w-12 h-12 rounded-[16px] border border-brand-border bg-white" />
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
          </div>
        )}

        {/* Tab 2: Opportunities */}
        {activeTab === 'opportunities' && (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-xl font-black text-brand-brown mb-2">فرص الرعاية المتاحة للتقديم</h3>
            <p className="text-brand-brownLight font-medium text-sm mb-6">{t('opportunitiesSub')}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {campaigns.map((campaign) => {
                const campaignTitle = getLocalizedItem(campaign, 'title', language);
                const campaignCategory = getLocalizedItem(campaign, 'category', language);
                const campaignDesc = getLocalizedItem(campaign, 'description', language);
                const campaignDeliverables = (campaign.deliverables && campaign.deliverables[language]) || campaign.deliverables?.ar || campaign.deliverables || [];

                return (
                  <div key={campaign.id} className="bg-white border border-brand-border rounded-[24px] shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <img src={campaign.brand?.avatar_url || campaign.brandLogo || 'https://api.dicebear.com/7.x/shapes/svg?seed=brand'} alt="Brand" className="w-12 h-12 rounded-[16px] bg-brand-cream border border-brand-border" />
                          <div>
                            <h4 className="font-bold text-brand-brown text-lg">{campaignTitle}</h4>
                            <span className="text-xs font-medium text-brand-brownLight">{campaignCategory}</span>
                          </div>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-black bg-brand-orange/10 text-brand-orange border border-brand-orange/20">
                          {formatDZD(campaign.budget)}
                        </span>
                      </div>

                      <p className="text-sm font-medium text-brand-brownLight mb-4 leading-relaxed">{campaignDesc}</p>

                      <div className="space-y-2 mb-6">
                        <span className="text-xs text-brand-brownLight font-bold block">{t('deliverablesRequired')}</span>
                        <div className="flex flex-wrap gap-2">
                          {Array.isArray(campaignDeliverables) && campaignDeliverables.map((item, idx) => (
                            <span key={idx} className="px-2.5 py-1 rounded-md bg-brand-cream text-brand-brownLight font-medium text-xs border border-brand-border">
                              {item}
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
                            <button disabled className="bg-brand-cream border border-brand-border text-brand-brownLight font-bold rounded-full w-full py-3 flex items-center justify-center gap-2 opacity-75 cursor-not-allowed">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>تم التقديم - قيد المراجعة</span>
                            </button>
                          );
                        } else if (app.status === 'approved') {
                          if (app.deliverable_url) {
                            return (
                              <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50 text-center text-sm text-emerald-600 font-bold flex items-center justify-center gap-2">
                                <CheckCircle2 className="w-5 h-5" />
                                <span>تم إرسال العمل بنجاح</span>
                              </div>
                            );
                          }
                          return (
                            <div className="space-y-3">
                              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 text-sm font-bold text-center mb-3">
                                🎉 تم قبولك! قدم عملك الآن.
                              </div>
                              <input 
                                type="url" 
                                placeholder="رابط العمل (Google Drive, Tiktok, etc)"
                                className="input-field w-full text-sm"
                                value={deliverableUrls[app.id] || ''}
                                onChange={e => setDeliverableUrls({ ...deliverableUrls, [app.id]: e.target.value })}
                              />
                              <button 
                                onClick={() => handleSubmitDeliverable(app.id)}
                                className="btn-primary w-full py-2.5 text-sm"
                              >
                                إرسال العمل
                              </button>
                            </div>
                          );
                        } else if (app.status === 'completed') {
                          return (
                            <div className="p-3 rounded-xl border border-purple-200 bg-purple-50 text-center text-sm text-purple-600 font-bold flex items-center justify-center gap-2">
                              <CheckCircle2 className="w-5 h-5" />
                              <span>مكتمل</span>
                            </div>
                          );
                        }
                      }
                      return (
                        <button 
                          onClick={() => handleApply(campaign.id)}
                          className="btn-primary w-full py-3 flex items-center justify-center gap-2"
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
            <div className="bg-white border border-brand-border rounded-[24px] flex flex-col h-full lg:col-span-1 shadow-sm">
              <div className="p-4 border-b border-brand-border font-black text-brand-brown flex items-center justify-between">
                <span>المحادثات</span>
              </div>
              <div className="flex-1 overflow-y-auto">
                {contacts.length === 0 ? (
                  <p className="text-brand-brownLight font-medium p-4 text-sm text-center">لا توجد محادثات بعد</p>
                ) : (
                  contacts.map(contact => (
                    <div 
                      key={contact.id}
                      onClick={() => setSelectedContactId(contact.id)}
                      className={`p-4 cursor-pointer flex items-center gap-3 transition-colors ${selectedContactId === contact.id ? 'bg-brand-cream border-r-4 border-r-brand-orange' : 'hover:bg-brand-cream'}`}
                    >
                      <img src={contact.avatar_url || 'https://api.dicebear.com/7.x/shapes/svg?seed=b'} alt="Brand Avatar" className="w-10 h-10 rounded-[12px] border border-brand-border bg-white" />
                      <div>
                        <h4 className="font-bold text-brand-brown text-sm">{contact.brand_name || 'Brand'}</h4>
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
                  <div className="p-4 border-b border-brand-border flex items-center gap-3 bg-white z-10">
                    <img src={contacts.find(c => c.id === selectedContactId)?.avatar_url || 'https://api.dicebear.com/7.x/shapes/svg?seed=b'} alt="Brand Avatar" className="w-10 h-10 rounded-[12px] border border-brand-border bg-brand-cream" />
                    <div>
                      <h3 className="font-bold text-brand-brown">{contacts.find(c => c.id === selectedContactId)?.brand_name || 'Brand'}</h3>
                      <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> متصل
                      </span>
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
                <div className="flex items-center justify-center h-full text-brand-brownLight font-medium">
                  اختر محادثة من القائمة
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
                  <img src={user?.user_metadata?.avatar_url || 'https://api.dicebear.com/7.x/shapes/svg?seed=creator'} alt="Profile" className="w-24 h-24 rounded-full border-4 border-brand-cream object-cover bg-white" />
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
                <form onSubmit={handlePayoutSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-brand-brown mb-2">المبلغ (د.ج)</label>
                    <input
                      type="number"
                      placeholder="20000"
                      max={availableBalance}
                      className="input-field w-full"
                      value={payoutForm.amount}
                      onChange={(e) => setPayoutForm({ ...payoutForm, amount: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-brand-brown mb-2">رقم الـ RIP (20 رقم)</label>
                    <input
                      type="text"
                      placeholder="00799999000000000000"
                      className="input-field w-full"
                      value={payoutForm.ripNumber}
                      onChange={(e) => setPayoutForm({ ...payoutForm, ripNumber: e.target.value })}
                      required
                    />
                  </div>

                  <div className="flex items-end">
                    <button type="submit" className="btn-primary w-full py-2.5 font-bold">
                      إرسال طلب السحب
                    </button>
                  </div>
                </form>

                {payoutSuccess && (
                  <div className="mt-4 p-3 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-xl text-sm font-bold text-center flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>تم إرسال طلب السحب بنجاح. سيتم تحويل المبلغ خلال 24 ساعة.</span>
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
                              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${statusCfg.badge}`}>
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
      </div>
    </div>
  );
}
