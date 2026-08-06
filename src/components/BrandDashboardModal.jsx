import React, { useState, useEffect } from 'react';
import { 
  X, LayoutDashboard, PlusCircle, Users, CreditCard, 
  Building2, TrendingUp, DollarSign, Lock, ShieldCheck, CheckCircle2, Search, Filter, Star, BadgeCheck, User, Globe, Phone, MapPin, MessageSquare, SendHorizontal
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { mockCreators, mockCampaigns, getLocalizedItem } from '../data/mockData';
import { formatDZD, calculateFees } from '../services/chargilyService';

export default function BrandDashboardModal({ isOpen, onClose, onHireCreator, initialTab = 'overview' }) {
  const { user, updateProfileData } = useAuth();
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [applications, setApplications] = useState([]);
  const [activeCampaignId, setActiveCampaignId] = useState(null);
  const messagesEndRef = React.useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (user?.id) {
      import('../services/dbService').then(({ getBrandApplications }) => {
        getBrandApplications(user.id).then(setApplications).catch(console.error);
      });
    }
  }, [user?.id]);

  // Brand / Business Profile State
  const [profileData, setProfileData] = useState({
    brandName: user?.profile?.full_name || user?.profile?.brand_name || user?.user_metadata?.full_name || '',
    sector: user?.profile?.sector || 'تجارة إلكترونية وموضة',
    bio: user?.profile?.bio || 'متجر جزائري يوفر أحدث المنتجات عالية الجودة.',
    websiteUrl: user?.profile?.website_url || '',
    phone: user?.profile?.phone || '',
    wilaya: user?.profile?.wilaya || 'الجزائر',
    rcNumber: user?.profile?.rc_number || ''
  });
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Campaign Form State
  const [newCampaign, setNewCampaign] = useState({
    title: '',
    category: 'تكنولوجيا',
    budget: '',
    description: '',
    deliverables: 'منشور إنستغرام, قصة (Story), فيديو ريلز',
    deadline: '2026-08-31'
  });
  const [campaignSuccess, setCampaignSuccess] = useState(false);

  // Search & Filters for Creators
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');

  // Active Deals Mock State
  const [deals, setDeals] = useState([
    { id: 1, creatorName: 'ياسين براهيمي', campaignTitle: 'حملة إطلاق متجر الملابس', budget: 45000, status: 'funded', deliverableUrl: 'https://instagram.com/p/mock123' },
    { id: 2, creatorName: 'أمينة بن علي', campaignTitle: 'ترويج منتجات العناية بالبشرة', budget: 25000, status: 'review_pending', deliverableUrl: 'https://tiktok.com/@mock/video/456' },
  ]);

  // Chat State
  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [selectedContactId, setSelectedContactId] = useState(null);

  // Derive unique creator contacts from applications
  const contacts = Array.from(new Map(
    applications.map(app => [app.creator_id, app.creator])
  ).values()).filter(Boolean);

  useEffect(() => {
    let subscription;
    let isMounted = true;
    if (activeTab === 'messages' && selectedContactId && user?.id) {
      import('../services/dbService').then(({ getMessages, subscribeToMessages }) => {
        if (!isMounted) return;
        getMessages(user.id, selectedContactId).then(fetchedMessages => {
          if (isMounted) setMessages(fetchedMessages || []);
        });
        subscription = subscribeToMessages(user.id, (newMsg) => {
          if (
            (newMsg.sender_id === user.id && newMsg.receiver_id === selectedContactId) ||
            (newMsg.sender_id === selectedContactId && newMsg.receiver_id === user.id)
          ) {
            if (isMounted) setMessages(prev => [...prev, newMsg]);
          }
        });
      });
    }
    return () => {
      isMounted = false;
      if (subscription) subscription.unsubscribe();
    };
  }, [activeTab, selectedContactId, user]);

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
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    if (!newCampaign.title || !newCampaign.budget) return;
    try {
      const { createCampaign } = await import('../services/dbService');
      await createCampaign({ ...newCampaign, brand_id: user.id });
      setCampaignSuccess(true);
      setTimeout(() => {
        setCampaignSuccess(false);
        setNewCampaign({
          title: '',
          category: 'تكنولوجيا',
          budget: '',
          description: '',
          deliverables: 'منشور إنستغرام, قصة (Story), فيديو ريلز',
          deadline: '2026-08-31'
        });
        setActiveTab('overview');
      }, 2000);
    } catch (err) {
      console.error('Error creating campaign:', err);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (updateProfileData) {
      await updateProfileData({
        full_name: profileData.brandName,
        brand_name: profileData.brandName,
        sector: profileData.sector,
        bio: profileData.bio,
        website_url: profileData.websiteUrl,
        phone: profileData.phone,
        wilaya: profileData.wilaya,
        rc_number: profileData.rcNumber
      });
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleApproveDeal = async (applicationId) => {
    try {
      const { updateApplicationStatus } = await import('../services/dbService');
      await updateApplicationStatus(applicationId, 'completed');
      setApplications(prev => prev.map(app => 
        app.id === applicationId ? { ...app, status: 'completed' } : app
      ));
    } catch (err) {
      console.error('Error approving deal:', err);
    }
  };

  const baseCreatorsList = activeCampaignId 
    ? applications.filter(app => app.campaign_id === activeCampaignId).map(app => ({
        id: app.creator_id,
        name: app.creator?.full_name || 'بدون اسم',
        category: app.creator?.category || 'صانع محتوى',
        bio: app.creator?.bio || 'صانع محتوى على المنصة',
        avatarUrl: app.creator?.avatar_url,
        ratePerPost: app.creator?.rate_per_post || 0,
        followers: '...',
        engagementRate: '...',
        platform: 'instagram'
      }))
    : mockCreators;

  const filteredCreators = baseCreatorsList.filter(c => {
    const matchCat = selectedCategory === 'الكل' || c.category === selectedCategory;
    const matchSearch = searchQuery === '' || c.name.includes(searchQuery) || (c.bio && c.bio.includes(searchQuery));
    return matchCat && matchSearch;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/98 backdrop-blur-md overflow-y-auto" dir="rtl">
      {/* Header Bar */}
      <div className="sticky top-0 z-10 bg-slate-900/90 backdrop-blur-md border-b border-white/10 px-4 sm:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-wide">{t('brandDashboard')}</h2>
            <p className="text-xs text-slate-400">{t('welcomeUser')}، {user?.user_metadata?.full_name || t('roleBrand')}</p>
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
            { id: 'create', label: t('addCampaign'), icon: PlusCircle },
            { id: 'creators', label: t('creatorDirectory'), icon: Users },
            { id: 'messages', label: 'الرسائل والمحادثات', icon: MessageSquare },
            { id: 'escrow', label: t('escrowDeals'), icon: Lock },
            { id: 'profile', label: t('storeProfile'), icon: User },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2.5 transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-emerald-500 text-white shadow-lg shadow-blue-500/20 scale-105'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Store Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fade-in">
            {/* Business Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="glass-card p-6">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-slate-400 text-sm font-semibold">إجمالي الميزانية المستثمرة</span>
                  <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg"><DollarSign className="w-5 h-5" /></div>
                </div>
                <div className="text-3xl font-bold gradient-text">{formatDZD(320000)}</div>
                <p className="text-xs text-slate-400 mt-2">مدفوعة عبر ChargilyPay</p>
              </div>

              <div className="glass-card p-6">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-slate-400 text-sm font-semibold">الحملات النشطة</span>
                  <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg"><PlusCircle className="w-5 h-5" /></div>
                </div>
                <div className="text-3xl font-bold text-white">4 حملات</div>
                <p className="text-xs text-emerald-400 mt-2">تستقبل طلبات المبدعين الان</p>
              </div>

              <div className="glass-card p-6">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-slate-400 text-sm font-semibold">صنّاع المحتوى الموظفون</span>
                  <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg"><Users className="w-5 h-5" /></div>
                </div>
                <div className="text-3xl font-bold text-purple-400">8 مبدعين</div>
                <p className="text-xs text-slate-400 mt-2">عبر إنستغرام وتيك توك ويوتيوب</p>
              </div>

              <div className="glass-card p-6">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-slate-400 text-sm font-semibold">الوصول الإجمالي المقدر</span>
                  <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg"><TrendingUp className="w-5 h-5" /></div>
                </div>
                <div className="text-3xl font-bold text-amber-400">1.4M+</div>
                <p className="text-xs text-slate-400 mt-2">مشاهدة وتفاعل كلي</p>
              </div>
            </div>

            {/* Quick Actions & Recent Campaigns */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 glass-card p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-white mb-6 tracking-wide">{t('dashWallet')}</h3>
                  <button 
                    onClick={() => setActiveTab('create')}
                    className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5"
                  >
                    <PlusCircle className="w-5 h-5" />
                    <span>{t('addCampaign')}</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {mockCampaigns.map((camp) => (
                    <div key={camp.id} className="p-4 rounded-xl bg-white/5 border border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h4 className="font-bold text-white">{camp.title}</h4>
                        <p className="text-xs text-slate-400 mt-1">الميزانية: <span className="text-emerald-400 font-bold">{formatDZD(camp.budget)}</span> | المتقدمون: <span className="text-white font-bold">{camp.applicantsCount} مبدع</span></p>
                      </div>
                      <button 
                        onClick={() => {
                          setActiveCampaignId(camp.id);
                          setActiveTab('creators');
                        }}
                        className="btn-secondary text-xs px-4 py-2 whitespace-nowrap"
                      >
                        استعراض المتقدمين
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Escrow Status Summary Card */}
              <div className="glass-card p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-emerald-400 mb-4 font-bold text-lg">
                    <ShieldCheck className="w-6 h-6" />
                    <span>حالة الضمان المالي</span>
                  </div>
                  <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                    جميع أموال الرعاية تبقى محفوطة بحساب الضمان الشفاف ولا يتم تحويلها لصانع المحتوى حتى تراجع العمل وتوافق عليه.
                  </p>

                  <div className="p-4 rounded-xl bg-white/5 space-y-3 mb-6">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>الأموال المحجوزة حالياً:</span>
                      <span className="font-bold text-amber-400">{formatDZD(70000)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>الأموال المحررة:</span>
                      <span className="font-bold text-emerald-400">{formatDZD(250000)}</span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setActiveTab('escrow')}
                  className="btn-gold w-full py-3 text-sm font-bold flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>إدارة صفقات الضمان النشطة</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Create Campaign Brief */}
        {activeTab === 'create' && (
          <div className="max-w-2xl mx-auto glass-card p-6 sm:p-8 animate-fade-in">
            <h3 className="text-2xl font-bold text-white mb-6 tracking-wide">{t('dashOverview')}</h3>
            <p className="text-slate-400 text-sm mb-6">انشر تفاصيل حملتك وميزانيتك ليصلك التقديم من أفضل صنّاع المحتوى في الجزائر</p>

            <form onSubmit={handleCreateCampaign} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">عنوان الحملة الإعلانية</label>
                <input
                  type="text"
                  placeholder="مثال: ترويج تشكيلة الملابس الصيفية الجديدة"
                  className="input-field w-full"
                  value={newCampaign.title}
                  onChange={(e) => setNewCampaign({ ...newCampaign, title: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">المجال / الفئة</label>
                  <select
                    className="input-field w-full"
                    value={newCampaign.category}
                    onChange={(e) => setNewCampaign({ ...newCampaign, category: e.target.value })}
                  >
                    <option value="تكنولوجيا">تكنولوجيا وشهادة</option>
                    <option value="موضة وأزياء">موضة وأزياء</option>
                    <option value="تجميل وعناية">تجميل وعناية</option>
                    <option value="طبخ وأكل">طبخ وأكل</option>
                    <option value="سفر وسياحة">سفر وسياحة</option>
                    <option value="رياضة ولياقة">رياضة ولياقة</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">الميزانية المقترحة (د.ج)</label>
                  <input
                    type="number"
                    placeholder="35000"
                    className="input-field w-full"
                    value={newCampaign.budget}
                    onChange={(e) => setNewCampaign({ ...newCampaign, budget: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">التسليمات المطلوبة (مفصولة بفواصل)</label>
                <input
                  type="text"
                  placeholder="منشور إنستغرام, 2 ستوري, فيديو ريلز 60 ثانية"
                  className="input-field w-full"
                  value={newCampaign.deliverables}
                  onChange={(e) => setNewCampaign({ ...newCampaign, deliverables: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">وصف الحملة وشروط صانع المحتوى</label>
                <textarea
                  rows={4}
                  placeholder="اشرح طبيعة المنتج، الجمهور المستهدف، والشروط الخاصة..."
                  className="input-field w-full"
                  value={newCampaign.description}
                  onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
                  required
                />
              </div>

              {newCampaign.budget && (
                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-slate-300 space-y-1">
                  <div className="flex justify-between">
                    <span>ميزانية الحملة الأساسية:</span>
                    <span className="font-bold text-white">{formatDZD(Number(newCampaign.budget))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>رسوم الضمان والمنصة (10%):</span>
                    <span className="font-bold text-emerald-400">{formatDZD(calculateFees(Number(newCampaign.budget)).platformFee)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-white/10 text-sm font-bold text-white">
                    <span>المجموع الإجمالي لتأمين الصفقة:</span>
                    <span className="gradient-text">{formatDZD(calculateFees(Number(newCampaign.budget)).total)}</span>
                  </div>
                </div>
              )}

              {campaignSuccess && (
                <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl text-sm font-semibold text-center flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>تم نشر الحملة بنجاح! يمكن للصنّاع التقديم الآن.</span>
                </div>
              )}

              <button type="submit" className="btn-primary w-full py-4 font-bold text-lg flex items-center justify-center gap-2">
                <LayoutDashboard className="w-5 h-5" /> {t('dashOverview')} <span>نشر الحملة في السوق</span>
              </button>
            </form>
          </div>
        )}

        {/* Tab 3: Creator Directory */}
        {activeTab === 'creators' && (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-xl font-bold text-white">دليل وتوظيف صنّاع المحتوى</h3>
            <p className="text-slate-400 text-sm">ابحث عن أفضل المبدعين حسب المجال والتفاعل وظفهم مباشرة مع دفع آمن عبر ChargilyPay</p>
            {activeCampaignId && (
               <button onClick={() => setActiveCampaignId(null)} className="text-sm text-blue-400 mb-2 hover:underline">عرض جميع صنّاع المحتوى</button>
            )}

            {/* Search Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  placeholder="ابحث باسم صانع المحتوى..."
                  className="input-field w-full pr-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {['الكل', 'تكنولوجيا', 'موضة وأزياء', 'تجميل وعناية', 'طبخ وأكل'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      selectedCategory === cat
                        ? 'bg-blue-600 text-white'
                        : 'bg-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Creators Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCreators.map((creator) => (
                <div key={creator.id} className="glass-card p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <img src={creator.avatar} alt={getLocalizedItem(creator, 'name', language)} className="w-14 h-14 rounded-full bg-white/10" />
                      <div>
                        <h4 className="font-bold text-white flex items-center gap-1.5">
                          {getLocalizedItem(creator, 'name', language)}
                          {creator.verified && <BadgeCheck className="w-4 h-4 text-emerald-400" />}
                        </h4>
                        <span className="text-xs text-slate-400">{getLocalizedItem(creator, 'category', language)}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 line-clamp-2 mb-4">{getLocalizedItem(creator, 'bio', language)}</p>

                    <div className="grid grid-cols-2 gap-2 mb-6 text-center">
                      <div className="p-2 rounded-lg bg-white/5">
                        <span className="text-xs text-slate-400 block">{t('creatorEngagement')}</span>
                        <span className="font-bold text-emerald-400 text-sm">{creator.engagement}%</span>
                      </div>
                      <div className="p-2 rounded-lg bg-white/5">
                        <span className="text-xs text-slate-400 block">{t('creatorRate')}</span>
                        <span className="font-bold text-white text-sm">{formatDZD(creator.ratePerPost, language)}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onClose();
                      onHireCreator(creator);
                    }}
                    className="btn-gold w-full py-3 text-sm font-bold flex items-center justify-center gap-2"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>توظيف وإيداع بالضمان</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3.5: Messages (Chat) */}
        {activeTab === 'messages' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px] animate-fade-in">
            {/* Sidebar - Contacts */}
            <div className="glass-card flex flex-col h-full lg:col-span-1">
              <div className="p-4 border-b border-white/10 font-bold text-white flex items-center justify-between">
                <span>المحادثات</span>
              </div>
              <div className="flex-1 overflow-y-auto">
                {contacts.length === 0 ? (
                  <div className="p-4 text-slate-400 text-sm text-center">لا توجد محادثات بعد. سيظهر المبدعون هنا بمجرد التقديم.</div>
                ) : (
                  contacts.map(contact => (
                    <div 
                      key={contact.id}
                      onClick={() => setSelectedContactId(contact.id)}
                      className={`p-4 cursor-pointer flex items-center gap-3 ${selectedContactId === contact.id ? 'border-l-2 border-l-blue-500 bg-white/5' : 'hover:bg-white/5 opacity-60'}`}
                    >
                      <img src={contact.avatar_url || 'https://api.dicebear.com/7.x/shapes/svg?seed=c'} alt="Creator Avatar" className="w-10 h-10 rounded-full" />
                      <div>
                        <h4 className="font-bold text-white text-sm">{contact.full_name || 'بدون اسم'}</h4>
                        <p className="text-xs text-slate-400 truncate w-40">{contact.category || 'صانع محتوى'}</p>
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
                    <img src={contacts.find(c => c.id === selectedContactId)?.avatar_url || 'https://api.dicebear.com/7.x/shapes/svg?seed=c'} alt="Creator Avatar" className="w-10 h-10 rounded-full" />
                    <div>
                      <h3 className="font-bold text-white">{contacts.find(c => c.id === selectedContactId)?.full_name || 'صانع محتوى'}</h3>
                      <span className="text-xs text-blue-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span> متصل الآن
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900/30">
                    {messages.length === 0 ? (
                      <div className="text-center text-slate-500 text-sm mt-10">ابدأ المحادثة الآن...</div>
                    ) : (
                      messages.map((msg) => (
                        <div key={msg.id} className={`flex flex-col max-w-[75%] ${msg.sender_id === user?.id ? 'mr-auto items-end' : 'ml-auto items-start'}`}>
                          <div className={`p-3 rounded-2xl ${msg.sender_id === user?.id ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white/10 text-slate-200 rounded-bl-none'}`}>
                            {msg.text}
                          </div>
                          <span className="text-[10px] text-slate-500 mt-1">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="p-4 border-t border-white/10">
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="اكتب رسالتك هنا..."
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-blue-500/50"
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                      />
                      <button type="submit" disabled={!chatMessage.trim()} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white p-2.5 rounded-xl transition-colors">
                        <SendHorizontal className="w-5 h-5" />
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 opacity-50">
                  <MessageSquare className="w-16 h-16 mb-4" />
                  <p>اختر محادثة للبدء</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Escrow Deals Management */}
        {activeTab === 'escrow' && (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-xl font-bold text-white mb-2">إدارة صفقات الضمان وتحرير الأموال</h3>
            <p className="text-slate-400 text-sm mb-6">مراجعة أعمال المبدعين المستلمة والموافقة على تحرير الأموال من الضمان إلى محفظة صانع المحتوى</p>

            <div className="space-y-4">
              {applications.filter(app => app.status === 'approved' || app.status === 'completed').length === 0 ? (
                <div className="text-center text-slate-400 text-sm mt-10">لا توجد صفقات في الضمان حالياً.</div>
              ) : (
                applications.filter(app => app.status === 'approved' || app.status === 'completed').map((app) => (
                  <div key={app.id} className="glass-card p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-lg">{app.campaign?.title}</span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          {app.status === 'completed' ? 'تم تحرير الأموال ✅' : 'في حساب الضمان 🔒'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">المبدع المكلف: <span className="text-white font-semibold">{app.creator?.full_name || app.creator?.brand_name || 'بدون اسم'}</span> | المبلغ المحجوز: <span className="text-emerald-400 font-bold">{formatDZD(app.campaign?.budget)}</span></p>
                      {app.deliverable_url && (
                        <a href={app.deliverable_url} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline block pt-1">
                          🔗 معاينة المحتوى المنفذ ({app.deliverable_url})
                        </a>
                      )}
                    </div>

                    <div>
                      {app.status === 'completed' ? (
                        <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" />
                          تمت العملية وتحرير المبلغ
                        </span>
                      ) : (
                        <button
                          onClick={() => handleApproveDeal(app.id)}
                          className="btn-primary text-xs px-5 py-3 font-bold flex items-center gap-2 shadow-lg"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          <span>الموافقة وتحرير الأموال الآن</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 5: Brand / Business Profile */}
        {activeTab === 'profile' && (
          <div className="max-w-3xl mx-auto glass-card p-6 sm:p-8 animate-fade-in">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">إعدادات ملف المتجر والمشروع التجاري</h3>
                <p className="text-xs text-slate-400">بيانات متجرك أو عملك التجاري تظهر لصنّاع المحتوى عند التواصل ونشر الحملات الإعلانية</p>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">اسم المتجر / العلامة التجارية / الشركة</label>
                  <input
                    type="text"
                    placeholder="مثال: متجر ستايل الجزائري"
                    className="input-field w-full"
                    value={profileData.brandName}
                    onChange={(e) => setProfileData({ ...profileData, brandName: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">مجال النشاط التجاري (Sector)</label>
                  <select
                    className="input-field w-full"
                    value={profileData.sector}
                    onChange={(e) => setProfileData({ ...profileData, sector: e.target.value })}
                  >
                    <option value="تجارة إلكترونية وموضة">تجارة إلكترونية وموضة</option>
                    <option value="إلكترونيات وهواتف">إلكترونيات وهواتف</option>
                    <option value="مطاعم ومأكولات">مطاعم ومأكولات</option>
                    <option value="مستحضرات تجميل وعناية">مستحضرات تجميل وعناية</option>
                    <option value="خدمات واستشارات">خدمات وبرمجيات</option>
                    <option value="تأثيث وديكور">تأثيث وديكور منزلي</option>
                    <option value="رياضة ومستلزمات">رياضة ومستلزمات</option>
                    <option value="آخر">مجال آخر</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">وصف النشاط التجاري والمنتجات (Bio / Description)</label>
                <textarea
                  rows={4}
                  placeholder="اكتب نبذة مختصرة عن متجرك، المنتجات التي تقدمها، والفئة المستهدفة من الزبائن..."
                  className="input-field w-full"
                  value={profileData.bio}
                  onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">رقم هاتف التواصل والواتساب</label>
                  <div className="relative">
                    <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="tel"
                      placeholder="0550123456"
                      className="input-field w-full pr-9"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">الولاية / المقر الرئيسي</label>
                  <div className="relative">
                    <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="مثال: الجزائر العاصمة"
                      className="input-field w-full pr-9"
                      value={profileData.wilaya}
                      onChange={(e) => setProfileData({ ...profileData, wilaya: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">رقم السجل التجاري / NIF (اختياري)</label>
                  <input
                    type="text"
                    placeholder="16/00-1234567"
                    className="input-field w-full font-mono text-sm"
                    value={profileData.rcNumber}
                    onChange={(e) => setProfileData({ ...profileData, rcNumber: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">رابط الموقع أو صفحة الانستغرام / فيسبوك</label>
                <div className="relative">
                  <Globe className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400" />
                  <input
                    type="url"
                    placeholder="https://instagram.com/my_store_dz"
                    className="input-field w-full pr-10"
                    value={profileData.websiteUrl}
                    onChange={(e) => setProfileData({ ...profileData, websiteUrl: e.target.value })}
                  />
                </div>
              </div>

              {savedSuccess && (
                <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl text-sm font-semibold text-center flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>تم حفظ معلومات المتجر بنجاح!</span>
                </div>
              )}

              <button type="submit" className="btn-primary w-full py-3.5 font-bold text-base flex items-center justify-center gap-2">
                <span>حفظ بيانات المتجر والمشروع</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
