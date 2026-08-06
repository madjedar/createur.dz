import React, { useState, useEffect } from 'react';
import { 
  X, LayoutDashboard, User, Briefcase, Wallet, 
  TrendingUp, DollarSign, Lock, Send, Calendar, Star, Sparkles, CheckCircle2, Play, Camera, Globe, MessageSquare, SendHorizontal
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { mockCampaigns, mockWallet, mockTransactions, mockPayoutRequests, getLocalizedItem } from '../data/mockData';
import { formatDZD, getPaymentStatusConfig } from '../services/chargilyService';

export default function CreatorDashboardModal({ isOpen, onClose, initialTab = 'overview' }) {
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
  const [selectedContactId, setSelectedContactId] = useState(null);
  const messagesEndRef = React.useRef(null);

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
          setCampaigns(allCampaigns.length > 0 ? allCampaigns : mockCampaigns);
          if (apps && apps.length > 0) {
            setApplications(apps);
            setAppliedCampaigns(apps.map(app => app.campaign_id));
          }
        })
        .catch(err => {
          console.error("Error fetching creator data:", err);
          setCampaigns(mockCampaigns);
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
        const { applyToCampaign, createNotification } = await import('../services/dbService');
        const newAppArray = await applyToCampaign(campaignId, user.id);
        if (newAppArray && newAppArray.length > 0) {
          const newApp = newAppArray[0];
          setApplications([...applications, newApp]);
          
          const campaign = campaigns.find(c => c.id === campaignId);
          if (campaign && campaign.brand_id) {
             await createNotification(
               campaign.brand_id,
               'طلب تقديم جديد',
               `قام ${user?.user_metadata?.full_name || 'صانع محتوى'} بالتقديم على حملتك "${campaign.title}".`
             );
          }
        }
        setAppliedCampaigns([...appliedCampaigns, campaignId]);
      } catch (err) {
        console.error("Error applying to campaign:", err);
      }
    }
  };



  return (
    <div className="fixed inset-0 z-50 bg-slate-950/98 backdrop-blur-md overflow-y-auto" dir="rtl">
      {/* Header Bar */}
      <div className="sticky top-0 z-10 bg-slate-900/90 backdrop-blur-md border-b border-white/10 px-4 sm:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              {t('creatorDashboard')}
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold">{t('roleCreator')}</span>
            </h1>
            <p className="text-xs text-slate-400">{t('welcomeUser')}، {user?.user_metadata?.full_name || t('roleCreator')}</p>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-4 mb-8 border-b border-white/10">
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
                className={`px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2.5 transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-gradient-brand text-white shadow-lg shadow-emerald-500/20 scale-105'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
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
              <div className="glass-card p-6">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-slate-400 text-sm font-semibold">إجمالي الحملات</span>
                  <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg"><Briefcase className="w-5 h-5" /></div>
                </div>
                <div className="text-3xl font-bold text-white">12</div>
                <p className="text-xs text-emerald-400 mt-2">↑ 2 حملة جديدة هذا الشهر</p>
              </div>

              <div className="glass-card p-6">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-slate-400 text-sm font-semibold">الإيرادات المحققة</span>
                  <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg"><DollarSign className="w-5 h-5" /></div>
                </div>
                <div className="text-3xl font-bold gradient-text">{formatDZD(185000)}</div>
                <p className="text-xs text-slate-400 mt-2">محولة عبر الذهبية و CIB</p>
              </div>

              <div className="glass-card p-6">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-slate-400 text-sm font-semibold">نسبة التفاعل</span>
                  <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg"><TrendingUp className="w-5 h-5" /></div>
                </div>
                <div className="text-3xl font-bold text-purple-400">5.8%</div>
                <p className="text-xs text-purple-300 mt-2">أعلى من المتوسط بـ 1.2%</p>
              </div>

              <div className="glass-card p-6">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-slate-400 text-sm font-semibold">التقييم</span>
                  <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg"><Star className="w-5 h-5 fill-amber-400" /></div>
                </div>
                <div className="text-3xl font-bold text-amber-400">4.9 / 5.0</div>
                <p className="text-xs text-slate-400 mt-2">من 24 علامة تجارية</p>
              </div>
            </div>

            {/* Applications List */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-bold text-white mb-4">طلبك الأخير للحملات</h3>
              <div className="space-y-4">
                {applications.length === 0 ? (
                  <div className="text-center text-slate-500 text-sm mt-4">لم تقدم على أي حملة بعد.</div>
                ) : (
                  applications.slice(0, 3).map((app) => (
                    <div key={app.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 rounded-xl bg-white/5 border border-white/5 gap-4">
                      <div className="flex items-center gap-3">
                        <img src={app.campaign?.brand?.avatar_url || 'https://api.dicebear.com/7.x/shapes/svg?seed=b'} alt="Brand Avatar" className="w-10 h-10 rounded-full" />
                        <div>
                          <h4 className="font-bold text-white">{app.campaign?.title}</h4>
                          <p className="text-xs text-slate-400">الميزانية: <span className="text-emerald-400 font-semibold">{formatDZD(app.campaign?.budget)}</span></p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                        app.status === 'approved' || app.status === 'completed'
                          ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
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
            <h3 className="text-xl font-bold text-white mb-2">فرص الرعاية المتاحة للتقديم</h3>
            <p className="text-slate-400 text-sm mb-6">{t('opportunitiesSub')}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {campaigns.map((campaign) => {
                const campaignTitle = getLocalizedItem(campaign, 'title', language);
                const campaignCategory = getLocalizedItem(campaign, 'category', language);
                const campaignDesc = getLocalizedItem(campaign, 'description', language);
                const campaignDeliverables = (campaign.deliverables && campaign.deliverables[language]) || campaign.deliverables?.ar || campaign.deliverables || [];

                return (
                  <div key={campaign.id} className="glass-card-hover p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{campaign.brandLogo}</span>
                          <div>
                            <h4 className="font-bold text-white text-lg">{campaignTitle}</h4>
                            <span className="text-xs text-slate-400">{campaignCategory}</span>
                          </div>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          {formatDZD(campaign.budget)}
                        </span>
                      </div>

                      <p className="text-sm text-slate-300 mb-4 leading-relaxed">{campaignDesc}</p>

                      <div className="space-y-2 mb-6">
                        <span className="text-xs text-slate-400 font-semibold block">{t('deliverablesRequired')}</span>
                        <div className="flex flex-wrap gap-2">
                          {Array.isArray(campaignDeliverables) && campaignDeliverables.map((item, idx) => (
                            <span key={idx} className="px-2.5 py-1 rounded-md bg-white/5 text-slate-300 text-xs border border-white/5">
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
                            <button disabled className="btn-secondary w-full py-3 flex items-center justify-center gap-2 opacity-50 cursor-not-allowed">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              <span className="text-emerald-400">تم التقديم - قيد المراجعة</span>
                            </button>
                          );
                        } else if (app.status === 'approved') {
                          if (app.deliverable_url) {
                            return (
                              <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-center text-sm text-emerald-400 font-bold flex items-center justify-center gap-2">
                                <CheckCircle2 className="w-5 h-5" />
                                <span>تم إرسال العمل بنجاح</span>
                              </div>
                            );
                          }
                          return (
                            <div className="space-y-3">
                              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 text-sm font-bold text-center mb-3">
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
                                className="btn-primary w-full py-2 text-sm"
                              >
                                إرسال العمل
                              </button>
                            </div>
                          );
                        } else if (app.status === 'completed') {
                          return (
                            <div className="p-3 rounded-lg border border-purple-500/30 bg-purple-500/10 text-center text-sm text-purple-400 font-bold flex items-center justify-center gap-2">
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
            <div className="glass-card flex flex-col h-full lg:col-span-1">
              <div className="p-4 border-b border-white/10 font-bold text-white flex items-center justify-between">
                <span>المحادثات</span>
              </div>
              <div className="flex-1 overflow-y-auto">
                {contacts.length === 0 ? (
                  <p className="text-slate-400 p-4 text-sm text-center">لا توجد محادثات بعد</p>
                ) : (
                  contacts.map(contact => (
                    <div 
                      key={contact.id}
                      onClick={() => setSelectedContactId(contact.id)}
                      className={`p-4 cursor-pointer flex items-center gap-3 ${selectedContactId === contact.id ? 'border-l-2 border-l-emerald-500 bg-white/5' : 'hover:bg-white/5 opacity-60'}`}
                    >
                      <img src={contact.avatar_url || 'https://api.dicebear.com/7.x/shapes/svg?seed=b'} alt="Brand Avatar" className="w-10 h-10 rounded-full" />
                      <div>
                        <h4 className="font-bold text-white text-sm">{contact.brand_name || 'Brand'}</h4>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Main Chat Area */}
            <div className="glass-card flex flex-col h-full lg:col-span-2">
              {selectedContactId ? (
                <>
                  <div className="p-4 border-b border-white/10 flex items-center gap-3">
                    <img src={contacts.find(c => c.id === selectedContactId)?.avatar_url || 'https://api.dicebear.com/7.x/shapes/svg?seed=b'} alt="Brand Avatar" className="w-10 h-10 rounded-full" />
                    <div>
                      <h3 className="font-bold text-white">{contacts.find(c => c.id === selectedContactId)?.brand_name || 'Brand'}</h3>
                      <span className="text-xs text-emerald-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> متصل
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900/30">
                    {messages.length === 0 ? (
                      <p className="text-slate-400 text-center text-sm">ابدأ المحادثة الآن!</p>
                    ) : (
                      messages.map((msg) => {
                        const isMe = msg.sender_id === user.id;
                        return (
                          <div key={msg.id} className={`flex flex-col max-w-[75%] ${isMe ? 'mr-auto items-end' : 'ml-auto items-start'}`}>
                            <div className={`p-3 rounded-2xl ${isMe ? 'bg-emerald-600 text-white rounded-br-none' : 'bg-white/10 text-slate-200 rounded-bl-none'}`}>
                              {msg.text}
                            </div>
                            <span className="text-[10px] text-slate-500 mt-1">
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="p-4 border-t border-white/10">
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="اكتب رسالتك هنا..."
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-emerald-500/50"
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                      />
                      <button type="submit" disabled={!chatMessage.trim()} className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white p-2.5 rounded-xl transition-colors">
                        <SendHorizontal className="w-5 h-5" />
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400">
                  اختر محادثة من القائمة
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Profile */}
        {activeTab === 'profile' && (
          <div className="max-w-3xl mx-auto glass-card p-6 sm:p-8 animate-fade-in">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">إعدادات ملف صانع المحتوى</h3>
                <p className="text-xs text-slate-400">حدث بياناتك ليتمكن أصحاب المتاجر والعلامات التجارية من العثور عليك وتوظيفك</p>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">اسم صانع المحتوى / الاسم الفني</label>
                  <input
                    type="text"
                    placeholder="مثال: ياسمين بيوتي"
                    className="input-field w-full"
                    value={profileData.fullName}
                    onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">تخصص / مجال المحتوى (Niche)</label>
                  <select
                    className="input-field w-full"
                    value={profileData.category}
                    onChange={(e) => setProfileData({ ...profileData, category: e.target.value })}
                  >
                    <option value="تكنولوجيا">تكنولوجيا ومرئيات</option>
                    <option value="موضة وأزياء">موضة وأزياء</option>
                    <option value="تجميل وعناية">تجميل وعناية بالبشرة</option>
                    <option value="طبخ وأكل">طبخ ومراجعة مطاعم</option>
                    <option value="سفر وسياحة">سفر وفلوغات سياحية</option>
                    <option value="رياضة ولياقة">رياضة ولياقة بدنية</option>
                    <option value="ألعاب وترفيه">ألعاب إلكترونية (Gaming)</option>
                    <option value="لايف ستايل">أسلوب حياة (Lifestyle)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">النبذة التعريفية (Bio)</label>
                <textarea
                  rows={4}
                  placeholder="اكتب نبذة مختصرة عن نفسك، جمهورك المستهدف، وأسلوب تقديمك للإعلانات..."
                  className="input-field w-full"
                  value={profileData.bio}
                  onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">سعر المنشور / الريلز (د.ج)</label>
                  <input
                    type="number"
                    placeholder="25000"
                    className="input-field w-full"
                    value={profileData.ratePerPost}
                    onChange={(e) => setProfileData({ ...profileData, ratePerPost: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">الولاية / مكان الإقامة</label>
                  <input
                    type="text"
                    placeholder="مثال: الجزائر العاصمة، وهران..."
                    className="input-field w-full"
                    value={profileData.wilaya}
                    onChange={(e) => setProfileData({ ...profileData, wilaya: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">رقم الواتساب / الهاتف للتواصل</label>
                  <input
                    type="tel"
                    placeholder="0655123456"
                    className="input-field w-full"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-4 pt-2 border-t border-white/10">
                <h4 className="font-bold text-white text-sm">روابط منصات التواصل الاجتماعي Social Links</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="relative">
                    <Camera className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-pink-500" />
                    <input
                      type="url"
                      placeholder="رابط حساب انستغرام (Instagram)"
                      className="input-field w-full pr-10"
                      value={profileData.instagramUrl}
                      onChange={(e) => setProfileData({ ...profileData, instagramUrl: e.target.value })}
                    />
                  </div>

                  <div className="relative">
                    <Play className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400" />
                    <input
                      type="url"
                      placeholder="رابط حساب تيك توك (TikTok)"
                      className="input-field w-full pr-10"
                      value={profileData.tiktokUrl}
                      onChange={(e) => setProfileData({ ...profileData, tiktokUrl: e.target.value })}
                    />
                  </div>

                  <div className="relative">
                    <Play className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />
                    <input
                      type="url"
                      placeholder="رابط قناة يوتيوب (YouTube)"
                      className="input-field w-full pr-10"
                      value={profileData.youtubeUrl}
                      onChange={(e) => setProfileData({ ...profileData, youtubeUrl: e.target.value })}
                    />
                  </div>

                  <div className="relative">
                    <Globe className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500" />
                    <input
                      type="url"
                      placeholder="صفحة فيسبوك أو موقع آخر"
                      className="input-field w-full pr-10"
                      value={profileData.facebookUrl}
                      onChange={(e) => setProfileData({ ...profileData, facebookUrl: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-white/10">
                <label className="block text-sm font-semibold text-slate-300 mb-2">رقم الـ RIP لحساب بريدي موب (استلام مستحقات السحب)</label>
                <input
                  type="text"
                  placeholder="00799999000000000000"
                  className="input-field w-full font-mono text-sm"
                  value={profileData.ripNumber}
                  onChange={(e) => setProfileData({ ...profileData, ripNumber: e.target.value })}
                />
              </div>

              {savedSuccess && (
                <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl text-sm font-semibold text-center flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>تم حفظ معلومات الملف الشخصي بنجاح!</span>
                </div>
              )}

              <button type="submit" className="btn-primary w-full py-3.5 font-bold text-base flex items-center justify-center gap-2">
                <span>حفظ بيانات صانع المحتوى</span>
              </button>
            </form>
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
          <div className="space-y-8 animate-fade-in">
            {/* Balance Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass-card p-6 border-r-4 border-r-emerald-500">
                <span className="text-slate-400 text-sm">الرصيد المتاح للسحب</span>
                <div className="text-3xl font-bold text-emerald-400 mt-2">{formatDZD(availableBalance)}</div>
                <p className="text-xs text-slate-500 mt-2">جاهز للتحويل عبر BaridiMob</p>
              </div>

              <div className="glass-card p-6 border-r-4 border-r-amber-500">
                <span className="text-slate-400 text-sm">رصيد الضمان (محجوز)</span>
                <div className="text-3xl font-bold text-amber-400 mt-2 flex items-center gap-2">
                  <Lock className="w-6 h-6" />
                  {formatDZD(pendingEscrow)}
                </div>
                <p className="text-xs text-slate-500 mt-2">يُحرّر فور الموافقة على التسليمات</p>
              </div>

              <div className="glass-card p-6 border-r-4 border-r-blue-500">
                <span className="text-slate-400 text-sm">إجمالي الأرباح التاريخية</span>
                <div className="text-3xl font-bold gradient-text mt-2">{formatDZD(totalEarned)}</div>
                <p className="text-xs text-slate-500 mt-2">أرباح الحملات المكتملة</p>
              </div>
            </div>

            {/* Payout Form */}
            <div className="glass-card p-6 sm:p-8">
              <h3 className="text-lg font-bold text-white mb-4">طلب سحب الأرباح إلى حسابك (BaridiMob / CCP)</h3>
              <form onSubmit={handlePayoutSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1 font-semibold">المبلغ (د.ج)</label>
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
                  <label className="block text-xs text-slate-400 mb-1 font-semibold">رقم الـ RIP (20 رقم)</label>
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
                  <button type="submit" className="btn-gold w-full py-3 font-bold">
                    إرسال طلب السحب
                  </button>
                </div>
              </form>

              {payoutSuccess && (
                <div className="mt-4 p-3 bg-emerald-500/20 text-emerald-400 rounded-xl text-sm font-semibold text-center flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>تم إرسال طلب السحب بنجاح. سيتم تحويل المبلغ خلال 24 ساعة.</span>
                </div>
              )}
            </div>

            {/* Transactions Table */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-bold text-white mb-4">سجل طلبات السحب (وهمي حالياً)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm text-slate-300">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400">
                      <th className="py-3 px-4">التاريخ</th>
                      <th className="py-3 px-4">الوصف</th>
                      <th className="py-3 px-4">المبلغ</th>
                      <th className="py-3 px-4">طريقة الدفع</th>
                      <th className="py-3 px-4">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {localTransactions.map((tx) => {
                      const statusCfg = getPaymentStatusConfig(tx.status);
                      return (
                        <tr key={tx.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="py-3 px-4 text-slate-400">{tx.date}</td>
                          <td className="py-3 px-4 font-semibold text-white">{tx.description}</td>
                          <td className="py-3 px-4 font-bold text-emerald-400">{formatDZD(tx.amount)}</td>
                          <td className="py-3 px-4">
                            <span className="badge-edahabia text-xs px-2.5 py-1 rounded-md">الذهبية</span>
                          </td>
                          <td className="py-3 px-4">
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
        )})()}
      </div>
    </div>
  );
}
