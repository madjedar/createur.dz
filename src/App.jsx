import { useState, useEffect } from 'react'
import { useAuth, AuthProvider } from './context/AuthContext'
import { LanguageProvider, useLanguage } from './context/LanguageContext'
import { supabase } from './lib/supabase'
import { categories, getLocalizedItem } from './data/mockData'
import { formatDZD } from './services/chargilyService'
import Header from './components/Header'
import Hero from './components/Hero'
import Footer from './components/Footer'
import AuthModal from './components/AuthModal'
import CreatorDashboardModal from './components/CreatorDashboardModal'
import BrandDashboardModal from './components/BrandDashboardModal'
import AdminDashboardModal from './components/AdminDashboardModal'
import CreatorDetailsModal from './components/CreatorDetailsModal'
import StoreDetailsModal from './components/StoreDetailsModal'
import CheckoutModal from './components/CheckoutModal'
import ReviewModal from './components/ReviewModal'
import ProfileSettingsModal from './components/ProfileSettingsModal'
import {
  Search,
  Filter,
  Star,
  Users,
  TrendingUp,
  BadgeCheck,
  ArrowLeft,
  ChevronDown,
  CreditCard,
  ShieldCheck,
  Zap,
  Lock,
  Wallet,
  UserPlus,
  FileText,
  Handshake,
  CircleDollarSign,
  Building2,
  MapPin,
  Briefcase,
  Sparkles,
} from 'lucide-react'

function AppContent() {
  const { user } = useAuth()
  const isLoggedIn = !!user
  const { t, language } = useLanguage()

  // Modal states
  const [authModal, setAuthModal] = useState({ open: false, mode: 'login', role: 'creator' })
  const [dashboardState, setDashboardState] = useState({ open: false, tab: 'overview', type: 'creator' })
  const [selectedCreator, setSelectedCreator] = useState(null)
  const [selectedStore, setSelectedStore] = useState(null)
  const [checkoutData, setCheckoutData] = useState(null)
  const [reviewCreator, setReviewCreator] = useState(null)
  const [isProfileSettingsOpen, setIsProfileSettingsOpen] = useState(false)
  const [isProfileMandatory, setIsProfileMandatory] = useState(false)

  // Showcase Tab & Filters
  const [showcaseTab, setShowcaseTab] = useState('creators') // 'creators' | 'stores'
  const [selectedCategory, setSelectedCategory] = useState('الكل')
  const [searchQuery, setSearchQuery] = useState('')

  // Database State
  const [creators, setCreators] = useState([])
  const [stores, setStores] = useState([])
  const [loadingData, setLoadingData] = useState(true)

  // Fetch real data on mount
  useEffect(() => {
    import('./services/dbService').then(({ getStoreProfiles, getCreatorProfiles }) => {
      Promise.all([getStoreProfiles(), getCreatorProfiles()])
        .then(([fetchedStores, fetchedCreators]) => {
          setStores(fetchedStores);
          setCreators(fetchedCreators);
          setLoadingData(false);
        })
        .catch(err => {
          console.error("Error fetching from DB:", err);
          setStores([]);
          setCreators([]);
          setLoadingData(false);
        });
    });
  }, []);

  // Payment callback detection
  const [toast, setToast] = useState(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const paymentStatus = params.get('payment')
    const errorMsg = params.get('error_description') || params.get('error')
    
    // Also check hash for Supabase OAuth errors
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const hashError = hashParams.get('error_description') || hashParams.get('error')

    if (errorMsg || hashError) {
      setToast({ type: 'error', message: `Auth Error: ${errorMsg || hashError}` })
      window.history.replaceState({}, '', window.location.pathname)
    } else if (paymentStatus === 'success') {
      setToast({ type: 'success', message: t('paymentSuccess') })
      window.history.replaceState({}, '', window.location.pathname)
    } else if (paymentStatus === 'failed') {
      setToast({ type: 'error', message: t('paymentFailed') })
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [t])

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  // Auto redirect on login and Mandatory Onboarding
  useEffect(() => {
    const isOAuthLogin = sessionStorage.getItem('oauth_login') === 'true';
    
    // If user has no role, they must select one
    if (user && (!user.role || user.role === 'null')) {
      if (!authModal.open || authModal.mode !== 'select_role') {
        handleOpenAuth('select_role');
      }
      return;
    }

    // Check mandatory profile completion
    if (user && user.role && user.profile) {
      if (!user.profile.full_name || !user.profile.phone || !user.profile.wilaya) {
        setIsProfileMandatory(true);
        setIsProfileSettingsOpen(true);
        return; // Stop them from going to dashboard yet
      } else {
        setIsProfileMandatory(false);
      }
    }

    // If user has a role and just logged in, or if auth modal was open when they logged in (via password)
    if (user && user.role && user.profile?.full_name && user.profile?.phone && user.profile?.wilaya && (authModal.open || isOAuthLogin)) {
      handleCloseAuth();
      if (isOAuthLogin) sessionStorage.removeItem('oauth_login');
      
      if (user.role === 'admin') {
        handleOpenDashboard('admin');
      } else {
        handleOpenDashboard('overview');
      }
    }
  }, [user?.id, user?.role, user?.profile, authModal.open]);

  // Role-based default showcase tab
  useEffect(() => {
    if (user?.role === 'creator') {
      setShowcaseTab('stores');
    } else if (user?.role === 'brand') {
      setShowcaseTab('creators');
    }
  }, [user?.role]);

  // Handlers
  const handleOpenAuth = (mode = 'login', role = 'creator') => setAuthModal({ open: true, mode, role })
  const handleCloseAuth = () => setAuthModal({ open: false, mode: 'login', role: 'creator' })
  const handleOpenDashboard = (tab = 'overview', type = 'creator', contactId = null) => {
    setDashboardState({ open: true, tab, type, contactId })
  }
  const handleCloseDashboard = () => setDashboardState({ open: false, tab: 'overview', type: 'creator', contactId: null })
  const handleSelectCreator = (creator) => setSelectedCreator(creator)
  const handleCloseCreator = () => setSelectedCreator(null)
  
  const handleContactCreator = (creator) => {
    setSelectedCreator(null);
    if (!isLoggedIn) {
      handleOpenAuth('login');
      return;
    }
    // Open dashboard in messages tab pre-selected with this creator
    handleOpenDashboard('messages', user?.role || 'brand', creator.id);
  };

  const handleHireCreator = (creator, applicationId = null) => {
    setSelectedCreator(null)
    setCheckoutData({
      creator,
      applicationId,
      campaign: {
        title: `صفقة رعاية مع ${creator.name}`,
        budget: creator.ratePerPost,
        deliverables: ['منشور على منصات التواصل', 'ستوري ترويجية', 'ذكر العلامة التجارية'],
      },
    })
  }
  const handleCloseCheckout = () => setCheckoutData(null)
  const handleReview = (creator) => {
    setSelectedCreator(null)
    setReviewCreator(creator)
  }
  const handleCloseReview = () => setReviewCreator(null)

  // Filtered creators
  const filteredCreators = creators.filter((c) => {
    const rawCategory = (c.category && typeof c.category === 'object') ? c.category.ar : (c.category || '')
    const matchCategory = selectedCategory === 'الكل' || rawCategory === selectedCategory
    const bioText = getLocalizedItem(c, 'bio', language)
    const categoryText = getLocalizedItem(c, 'category', language)
    const matchSearch =
      searchQuery === '' ||
      getLocalizedItem(c, 'name', language).toLowerCase().includes(searchQuery.toLowerCase()) ||
      bioText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      categoryText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.tags && c.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())))
    return matchCategory && matchSearch
  })

  // Filtered stores
  const filteredStores = stores.filter((s) => {
    const rawSector = (s.sector && typeof s.sector === 'object') ? s.sector.ar : (s.sector || '')
    const matchCategory = selectedCategory === 'الكل' || rawSector === selectedCategory
    const nameText = getLocalizedItem(s, 'name', language)
    const bioText = getLocalizedItem(s, 'bio', language)
    const sectorText = getLocalizedItem(s, 'sector', language)
    const locationText = getLocalizedItem(s, 'location', language)
    const matchSearch =
      searchQuery === '' ||
      nameText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bioText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sectorText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      locationText.toLowerCase().includes(searchQuery.toLowerCase())
    return matchCategory && matchSearch
  })

  const formatFollowers = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(0) + 'K'
    return num.toString()
  }

  return (
    <div className="min-h-screen bg-brand-cream">
      {/* ─── Toast Notification ─── */}
      {toast && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-xl font-semibold animate-fade-in-down shadow-2xl ${
            toast.type === 'success'
              ? 'bg-emerald-500/90 text-white'
              : 'bg-red-500/90 text-white'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* ─── Header ─── */}
      {/* Missing Env Variables Warning Banner */}
      {!supabase && (
        <div className="bg-red-500 text-white p-4 text-center font-bold text-lg z-50 relative shadow-lg">
          ⚠️ ERROR: ENVIRONMENT VARIABLES MISSING ⚠️<br />
          You must add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to your Render/Vercel Dashboard settings and redeploy.
        </div>
      )}

      <Header 
        onOpenAuth={handleOpenAuth} 
        onOpenDashboard={handleOpenDashboard} 
        onOpenCreateCampaign={() => handleOpenDashboard('create')}
        onOpenProfileSettings={() => setIsProfileSettingsOpen(true)}
      />

      {/* ─── Hero & How It Works — hidden when logged in ─── */}
      {!isLoggedIn && (
        <>
          <Hero 
            onOpenAuth={handleOpenAuth} 
            onOpenDashboard={handleOpenDashboard} 
          />

          {/* ─── Section 2: Direct 3-Step Process ─── */}
          <section className="py-20 px-4 border-b border-brand-border relative bg-brand-cream">
            <div className="max-w-5xl mx-auto text-center">
              <h2 className="text-3xl sm:text-5xl font-black text-brand-brown mb-4 leading-relaxed">
                {t('howItWorks')} <span className="text-brand-orange">{t('howItWorksHighlight')}</span>
              </h2>
              <p className="text-brand-brownLight max-w-xl mx-auto text-sm sm:text-base mb-16 leading-relaxed">
                {t('howItWorksSub')}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white border border-brand-border p-8 text-center relative group rounded-[40px] shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-14 h-14 rounded-full bg-brand-cream text-brand-orange text-2xl font-black flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                    1
                  </div>
                  <h3 className="text-xl font-bold text-brand-brown mb-3 tracking-wide">{t('step1Title')}</h3>
                  <p className="text-brand-brownLight text-sm leading-relaxed">{t('step1Desc')}</p>
                </div>

                <div className="bg-white border border-brand-border p-8 text-center relative group rounded-[40px] shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-14 h-14 rounded-full bg-brand-cream text-brand-orange text-2xl font-black flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                    2
                  </div>
                  <h3 className="text-xl font-bold text-brand-brown mb-3 tracking-wide">{t('step2Title')}</h3>
                  <p className="text-brand-brownLight text-sm leading-relaxed">{t('step2Desc')}</p>
                </div>

                <div className="bg-white border border-brand-border p-8 text-center relative group rounded-[40px] shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-14 h-14 rounded-full bg-brand-cream text-brand-orange text-2xl font-black flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                    3
                  </div>
                  <h3 className="text-xl font-bold text-brand-brown mb-3 tracking-wide">{t('step3Title')}</h3>
                  <p className="text-brand-brownLight text-sm leading-relaxed">{t('step3Desc')}</p>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {/* ─── Section 3: Clean Creators & Stores Showcase Grid ─── */}
      {isLoggedIn && (
        <section id="creators" className="py-20 px-4 bg-brand-cream">
        <div className="max-w-7xl mx-auto">
          {/* Main Showcase Toggle Tabs (Creators vs Stores) */}
          <div className="flex justify-center mb-10">
            <div className="p-1.5 bg-white border border-brand-border rounded-full flex gap-2 shadow-sm">
              <button
                onClick={() => setShowcaseTab('creators')}
                className={`px-6 py-3 rounded-full font-bold text-sm sm:text-base flex items-center gap-2 transition-all ${
                  showcaseTab === 'creators'
                    ? 'bg-brand-orange text-white shadow-lg shadow-brand-orange/20 scale-105'
                    : 'text-brand-brownLight hover:text-brand-brown'
                }`}
              >
                <Sparkles className="w-5 h-5" />
                <span>{t('tabCreators')}</span>
              </button>

              <button
                onClick={() => setShowcaseTab('stores')}
                className={`px-6 py-3 rounded-full font-bold text-sm sm:text-base flex items-center gap-2 transition-all ${
                  showcaseTab === 'stores'
                    ? 'bg-brand-orange text-white shadow-lg shadow-brand-orange/20 scale-105'
                    : 'text-brand-brownLight hover:text-brand-brown'
                }`}
              >
                <Building2 className="w-5 h-5" />
                <span>{t('tabStores')}</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <h2 className="text-3xl sm:text-4xl font-black text-brand-brown mb-3 tracking-wide">
                {showcaseTab === 'creators' ? t('featuredCreators') : t('featuredStores')}
              </h2>
              <p className="text-brand-brownLight text-sm sm:text-base leading-relaxed">
                {showcaseTab === 'creators' ? t('featuredCreatorsSub') : t('featuredStoresSub')}
              </p>
            </div>

            {/* Category Filters */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
              {categories.map((cat) => {
                const categoryLabels = {
                  'الكل': t('catAll'),
                  'تكنولوجيا': t('catTech'),
                  'موضة وأزياء': t('catFashion'),
                  'تجميل وعناية': t('catBeauty'),
                  'طبخ وأكل': t('catFood'),
                  'سفر وسياحة': t('catTravel'),
                  'رياضة ولياقة': t('catFitness')
                };
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors duration-200 ${
                      selectedCategory === cat
                        ? 'bg-brand-brown text-white'
                        : 'bg-white text-brand-brownLight hover:bg-brand-cream hover:text-brand-brown border border-brand-border'
                    }`}
                  >
                    {categoryLabels[cat] || cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search Box */}
          <div className="mb-8">
            <div className="relative max-w-md">
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                placeholder={t('searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pr-11"
              />
            </div>
          </div>

          {/* Tab 1: Creators Grid */}
          {showcaseTab === 'creators' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCreators.map((creator) => (
                <div
                  key={creator.id}
                  onClick={() => handleSelectCreator(creator)}
                  className="bg-brand-orange text-white hover:-translate-y-1 rounded-[40px] p-6 sm:p-8 cursor-pointer group flex flex-col justify-between transition-all duration-300 shadow-sm hover:shadow-lg"
                >
                  <div>
                    <div className="flex items-center gap-3.5 mb-4">
                      <img
                        src={creator.avatar}
                        alt={getLocalizedItem(creator, 'name', language)}
                        className="w-16 h-16 rounded-full bg-white/20 object-cover border-2 border-white/30 group-hover:scale-105 transition-transform"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-white text-lg truncate">
                          {getLocalizedItem(creator, 'name', language)}
                        </h3>
                        <span className="text-xs text-white/80 block mt-0.5">{getLocalizedItem(creator, 'category', language)}</span>
                      </div>
                    </div>

                    <p className="text-sm text-white/90 line-clamp-2 leading-relaxed mb-6">
                      {getLocalizedItem(creator, 'bio', language)}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-white/20 flex items-center justify-between">
                    <span className="text-xs text-white/80 font-semibold">{t('deliveryStartsAt')}</span>
                    <span className="font-bold text-white text-base bg-white/20 px-3 py-1 rounded-full">{formatDZD(creator.ratePerPost, language)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab 2: Stores & Small Businesses Grid */}
          {showcaseTab === 'stores' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStores.map((store) => (
                <div
                  key={store.id}
                  onClick={() => setSelectedStore(store)}
                  className="bg-white border border-brand-border hover:-translate-y-1 rounded-[40px] p-6 sm:p-8 cursor-pointer group flex flex-col justify-between transition-all duration-300 shadow-sm hover:shadow-lg"
                >
                  <div>
                    <div className="flex items-center gap-3.5 mb-4">
                      <img
                        src={store.logo}
                        alt={getLocalizedItem(store, 'name', language)}
                        className="w-16 h-16 rounded-full bg-brand-cream object-cover border-2 border-brand-border group-hover:scale-105 transition-transform"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-brand-brown text-lg truncate flex items-center gap-1.5">
                          {getLocalizedItem(store, 'name', language)}
                          {store.verified && <BadgeCheck className="w-5 h-5 text-brand-orange" />}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-brand-brownLight mt-0.5">
                          <span>{getLocalizedItem(store, 'sector', language)}</span>
                          <span>•</span>
                          <span className="flex items-center gap-0.5">
                            <MapPin className="w-3 h-3" />
                            {getLocalizedItem(store, 'location', language)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-brand-brownLight line-clamp-2 leading-relaxed mb-6">
                      {getLocalizedItem(store, 'bio', language)}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-brand-border flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-brand-brownLight uppercase tracking-wider block">{t('activeCampaignsCount')}</span>
                      <span className="font-bold text-brand-brown text-base">{store.activeCampaigns} {t('applicants')}</span>
                    </div>
                    <div className="text-left">
                      <span className="text-[10px] text-brand-brownLight uppercase tracking-wider block">{t('budgetOffer')}</span>
                      <span className="font-bold text-brand-orange text-base bg-brand-orange/10 px-3 py-1 rounded-full">{formatDZD(store.totalBudget, language)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {((showcaseTab === 'creators' && filteredCreators.length === 0) ||
            (showcaseTab === 'stores' && filteredStores.length === 0)) && (
            <div className="text-center py-16">
              <Search className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-lg">{t('noResults')}</p>
            </div>
          )}
        </div>
      </section>
      )}

      {/* ─── Footer ─── */}
      <Footer />

      {/* ─── Modals ─── */}
      <AuthModal
        isOpen={authModal.open}
        onClose={handleCloseAuth}
        initialMode={authModal.mode}
        initialRole={authModal.role}
      />

      {dashboardState.tab === 'admin' || user?.role === 'admin' ? (
        <AdminDashboardModal
          isOpen={dashboardState.open}
          onClose={handleCloseDashboard}
        />
      ) : user?.role === 'brand' ? (
        <BrandDashboardModal
          isOpen={dashboardState.open}
          onClose={handleCloseDashboard}
          initialTab={dashboardState.tab}
          initialContactId={dashboardState.contactId}
          onHireCreator={handleHireCreator}
        />
      ) : (
        <CreatorDashboardModal
          isOpen={dashboardState.open}
          onClose={handleCloseDashboard}
          initialTab={dashboardState.tab}
          initialContactId={dashboardState.contactId}
        />
      )}
      <CreatorDetailsModal
        isOpen={!!selectedCreator}
        onClose={handleCloseCreator}
        creator={selectedCreator}
        onHire={handleHireCreator}
        onContact={handleContactCreator}
      />
      <StoreDetailsModal
        isOpen={!!selectedStore}
        onClose={() => setSelectedStore(null)}
        store={selectedStore}
        onApplyCampaign={async (campaign) => {
          if (isLoggedIn && user?.role === 'creator') {
            try {
              // Check if campaign ID is a valid UUID (real DB record) vs mock data
              const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(campaign.id);
              
              if (isUUID) {
                const { applyToCampaign, createNotification } = await import('./services/dbService');
                await applyToCampaign(campaign.id, user.id);
                if (campaign.brand_id) {
                   await createNotification(
                     campaign.brand_id,
                     'طلب تقديم جديد',
                     `قام ${user?.user_metadata?.full_name || 'صانع محتوى'} بالتقديم على حملتك "${campaign.title}".`
                   );
                }
              }
              // Success for both mock and real campaigns
              setToast({ type: 'success', message: t('applicationSuccess') || 'تم التقديم بنجاح! ✅' });
              setSelectedStore(null);
              handleOpenDashboard('opportunities');
            } catch (err) {
              console.error(err);
              // Show specific error for duplicate applications
              if (err?.code === '23505') {
                setToast({ type: 'error', message: t('alreadyApplied') || 'لقد قدمت على هذه الحملة سابقاً' });
              } else {
                setToast({ type: 'error', message: t('applicationError') || 'حدث خطأ أثناء التقديم' });
              }
            }
          } else if (isLoggedIn) {
            setToast({ type: 'error', message: t('onlyCreatorsCanApply') || 'فقط صناع المحتوى يمكنهم التقديم' });
          } else {
            setSelectedStore(null);
            handleOpenAuth('signup', 'creator');
          }
        }}
      />
      <CheckoutModal
        isOpen={!!checkoutData}
        onClose={handleCloseCheckout}
        creator={checkoutData?.creator}
        campaign={checkoutData?.campaign}
        applicationId={checkoutData?.applicationId}
      />
      <ReviewModal
        isOpen={!!reviewCreator}
        onClose={handleCloseReview}
        creator={reviewCreator}
      />
      <ProfileSettingsModal 
        isOpen={isProfileSettingsOpen} 
        onClose={() => {
          if (!isProfileMandatory) setIsProfileSettingsOpen(false);
        }}
        isMandatory={isProfileMandatory}
      />
    </div>
  )
}
export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </AuthProvider>
  )
}
