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
  
  // Track applied campaigns
  const [appliedCampaigns, setAppliedCampaigns] = useState([]);

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

  // Chat State
  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState([
    { id: 1, sender: 'brand', text: 'مرحباً، هل أنت متاح لحملتنا الإعلانية القادمة؟', time: '10:00 AM' },
    { id: 2, sender: 'me', text: 'أهلاً بك! نعم بالتأكيد، يمكننا مناقشة التفاصيل.', time: '10:05 AM' },
    { id: 3, sender: 'brand', text: 'رائع، الميزانية هي 45,000 د.ج مقابل ريلز و 2 ستوري. ما رأيك؟', time: '10:15 AM' },
  ]);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

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
    if (!payoutForm.amount || !payoutForm.ripNumber) return;
    setPayoutSuccess(true);
    setTimeout(() => {
      setPayoutSuccess(false);
      setPayoutForm({ amount: '', ripNumber: '', method: 'baridimob' });
    }, 3000);
  };

  const handleApply = (campaignId) => {
    if (!appliedCampaigns.includes(campaignId)) {
      setAppliedCampaigns([...appliedCampaigns, campaignId]);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    const newMsg = {
      id: messages.length + 1,
      sender: 'me',
      text: chatMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages([...messages, newMsg]);
    setChatMessage('');
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
                {mockCampaigns.slice(0, 3).map((campaign) => (
                  <div key={campaign.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 rounded-xl bg-white/5 border border-white/5 gap-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{campaign.brandLogo}</span>
                      <div>
                        <h4 className="font-bold text-white">{campaign.title}</h4>
                        <p className="text-xs text-slate-400">الميزانية: <span className="text-emerald-400 font-semibold">{formatDZD(campaign.budget)}</span></p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      قيد المراجعة
                    </span>
                  </div>
                ))}
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
              {mockCampaigns.map((campaign) => {
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

                    {appliedCampaigns.includes(campaign.id) ? (
                      <button disabled className="btn-secondary w-full py-3 flex items-center justify-center gap-2 opacity-50 cursor-not-allowed">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-400">تم التقديم - قيد المراجعة</span>
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleApply(campaign.id)}
                        className="btn-primary w-full py-3 flex items-center justify-center gap-2"
                      >
                        <Send className="w-4 h-4" />
                        <span>{t('applyNow')}</span>
                      </button>
                    )}
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
                <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-0.5 rounded-full">1 جديد</span>
              </div>
              <div className="flex-1 overflow-y-auto">
                <div className="p-4 border-l-2 border-l-emerald-500 bg-white/5 cursor-pointer flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-xl">
                    🛍️
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">متجر الأناقة</h4>
                    <p className="text-xs text-emerald-400 truncate w-40">رائع، الميزانية هي 45,000 د.ج...</p>
                  </div>
                </div>
                <div className="p-4 hover:bg-white/5 cursor-pointer flex items-center gap-3 opacity-60">
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 text-xl">
                    📱
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Tech Store DZ</h4>
                    <p className="text-xs text-slate-400 truncate w-40">شكراً لك، سنراجع طلبك قريباً.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Chat Area */}
            <div className="glass-card flex flex-col h-full lg:col-span-2">
              <div className="p-4 border-b border-white/10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-xl">
                  🛍️
                </div>
                <div>
                  <h3 className="font-bold text-white">متجر الأناقة</h3>
                  <span className="text-xs text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> متصل الآن
                  </span>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900/30">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex flex-col max-w-[75%] ${msg.sender === 'me' ? 'mr-auto items-end' : 'ml-auto items-start'}`}>
                    <div className={`p-3 rounded-2xl ${msg.sender === 'me' ? 'bg-emerald-500 text-white rounded-br-none' : 'bg-white/10 text-slate-200 rounded-bl-none'}`}>
                      {msg.text}
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1">{msg.time}</span>
                  </div>
                ))}
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
                  <button type="submit" disabled={!chatMessage.trim()} className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white p-2.5 rounded-xl transition-colors">
                    <SendHorizontal className="w-5 h-5" />
                  </button>
                </form>
              </div>
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
        {activeTab === 'wallet' && (
          <div className="space-y-8 animate-fade-in">
            {/* Balance Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass-card p-6 border-r-4 border-r-emerald-500">
                <span className="text-slate-400 text-sm">الرصيد المتاح للسحب</span>
                <div className="text-3xl font-bold text-emerald-400 mt-2">{formatDZD(mockWallet.availableBalance)}</div>
                <p className="text-xs text-slate-500 mt-2">جاهز للتحويل عبر BaridiMob</p>
              </div>

              <div className="glass-card p-6 border-r-4 border-r-amber-500">
                <span className="text-slate-400 text-sm">رصيد الضمان (محجوز)</span>
                <div className="text-3xl font-bold text-amber-400 mt-2 flex items-center gap-2">
                  <Lock className="w-6 h-6" />
                  {formatDZD(mockWallet.pendingEscrow)}
                </div>
                <p className="text-xs text-slate-500 mt-2">يُحرّر فور الموافقة على التسليمات</p>
              </div>

              <div className="glass-card p-6 border-r-4 border-r-blue-500">
                <span className="text-slate-400 text-sm">إجمالي الأرباح التاريخية</span>
                <div className="text-3xl font-bold gradient-text mt-2">{formatDZD(mockWallet.totalEarned)}</div>
                <p className="text-xs text-slate-500 mt-2">إجمالي 14 صفقة مكتملة</p>
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
                    max={mockWallet.availableBalance}
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
              <h3 className="text-lg font-bold text-white mb-4">سجل المعاملات المالية</h3>
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
                    {mockTransactions.map((tx) => {
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
        )}
      </div>
    </div>
  );
}
