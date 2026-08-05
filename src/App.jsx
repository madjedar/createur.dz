import { useState, useEffect } from 'react'
import { useAuth, AuthProvider } from './context/AuthContext'
import { LanguageProvider, useLanguage } from './context/LanguageContext'
import { mockCreators, mockCampaigns, categories } from './data/mockData'
import { formatDZD } from './services/chargilyService'
import Header from './components/Header'
import Hero from './components/Hero'
import Footer from './components/Footer'
import AuthModal from './components/AuthModal'
import CreatorDashboardModal from './components/CreatorDashboardModal'
import BrandDashboardModal from './components/BrandDashboardModal'
import AdminDashboardModal from './components/AdminDashboardModal'
import CreatorDetailsModal from './components/CreatorDetailsModal'
import CheckoutModal from './components/CheckoutModal'
import ReviewModal from './components/ReviewModal'
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
} from 'lucide-react'

function AppContent() {
  const { user } = useAuth()
  const { t, language } = useLanguage()

  // Modal states
  const [authModal, setAuthModal] = useState({ open: false, mode: 'login', role: 'creator' })
  const [dashboardState, setDashboardState] = useState({ open: false, tab: 'overview', type: 'creator' })
  const [selectedCreator, setSelectedCreator] = useState(null)
  const [checkoutData, setCheckoutData] = useState(null)
  const [reviewCreator, setReviewCreator] = useState(null)

  // Filters
  const [selectedCategory, setSelectedCategory] = useState('الكل')
  const [searchQuery, setSearchQuery] = useState('')

  // Payment callback detection
  const [toast, setToast] = useState(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const paymentStatus = params.get('payment')
    if (paymentStatus === 'success') {
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

  // Auto redirect on login
  useEffect(() => {
    const isOAuthLogin = sessionStorage.getItem('oauth_login') === 'true';
    
    // If user has no role, they must select one
    if (user && (!user.role || user.role === 'null')) {
      if (!authModal.open || authModal.mode !== 'select_role') {
        handleOpenAuth('select_role');
      }
      return;
    }

    // If user has a role and just logged in, or if auth modal was open when they logged in (via password)
    if (user && user.role && (authModal.open || isOAuthLogin)) {
      handleCloseAuth();
      if (isOAuthLogin) sessionStorage.removeItem('oauth_login');
      
      if (user.role === 'admin') {
        setIsAdminDashboardOpen(true);
      } else {
        handleOpenDashboard('overview');
      }
    }
  }, [user?.id, user?.role, authModal.open]);

  // Handlers
  const handleOpenAuth = (mode = 'login', role = 'creator') => setAuthModal({ open: true, mode, role })
  const handleCloseAuth = () => setAuthModal({ open: false, mode: 'login', role: 'creator' })
  const handleOpenDashboard = (tab = 'overview') => setDashboardState({ open: true, tab })
  const handleCloseDashboard = () => setDashboardState({ open: false, tab: 'overview' })
  const handleSelectCreator = (creator) => setSelectedCreator(creator)
  const handleCloseCreator = () => setSelectedCreator(null)
  const handleHireCreator = (creator) => {
    setSelectedCreator(null)
    setCheckoutData({
      creator,
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
  const filteredCreators = mockCreators.filter((c) => {
    const matchCategory = selectedCategory === 'الكل' || c.category === selectedCategory
    const matchSearch =
      searchQuery === '' ||
      c.name.includes(searchQuery) ||
      c.bio.includes(searchQuery) ||
      c.tags.some((tag) => tag.includes(searchQuery))
    return matchCategory && matchSearch
  })

  const formatFollowers = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(0) + 'K'
    return num.toString()
  }

  return (
    <div className="min-h-screen bg-gradient-dark">
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
      <Header 
        onOpenAuth={handleOpenAuth} 
        onOpenDashboard={handleOpenDashboard} 
        onOpenCreateCampaign={() => handleOpenDashboard('create')} 
      />

      {/* ─── Hero ─── */}
      <Hero 
        onOpenAuth={handleOpenAuth} 
        onOpenDashboard={handleOpenDashboard} 
      />

      {/* ─── Section 2: Direct 3-Step Process ─── */}
      <section className="py-20 px-4 border-b border-white/5 relative bg-[#080C14]">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl sm:text-5xl font-black text-white mb-4 leading-relaxed">
            {t('howItWorks')} <span className="gradient-text-mint">{t('howItWorksHighlight')}</span>
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto text-sm sm:text-base mb-16 leading-relaxed">
            {t('howItWorksSub')}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass-card-hover p-8 text-center relative group">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-2xl font-black flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                1
              </div>
              <h3 className="text-xl font-bold text-white mb-3 tracking-wide">{t('step1Title')}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                {t('step1Desc')}
              </p>
            </div>

            <div className="glass-card-hover p-8 text-center relative group">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-2xl font-black flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                2
              </div>
              <h3 className="text-xl font-bold text-white mb-3 tracking-wide">{t('step2Title')}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                {t('step2Desc')}
              </p>
            </div>

            <div className="glass-card-hover p-8 text-center relative group">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-2xl font-black flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                3
              </div>
              <h3 className="text-xl font-bold text-white mb-3 tracking-wide">{t('step3Title')}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                {t('step3Desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Section 3: Clean Creator Showcase Grid ─── */}
      <section id="creators" className="py-20 px-4 bg-[#080C14]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-3 tracking-wide">
                {t('featuredCreators')}
              </h2>
              <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
                {t('featuredCreatorsSub')}
              </p>
            </div>

            {/* Category Filters */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                    selectedCategory === cat
                      ? 'bg-emerald-400 text-slate-950 font-black shadow-lg shadow-emerald-500/20'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/10'
                  }`}
                >
                  {cat}
                </button>
              ))}
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

          {/* Creators Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCreators.map((creator) => (
              <div
                key={creator.id}
                onClick={() => handleSelectCreator(creator)}
                className="glass-card-hover p-6 cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-3.5 mb-4">
                    <img
                      src={creator.avatar}
                      alt={creator.name}
                      className="w-14 h-14 rounded-2xl bg-white/10 object-cover border border-white/10 group-hover:scale-105 transition-transform"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white text-base truncate group-hover:text-emerald-400 transition-colors">
                        {creator.name}
                      </h3>
                      <span className="text-xs text-slate-400 block mt-0.5">{creator.category}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed mb-6">
                    {creator.bio}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-semibold">{t('deliveryStartsAt')}</span>
                  <span className="font-extrabold text-emerald-400 text-sm">{formatDZD(creator.ratePerPost)}</span>
                </div>
              </div>
            ))}
          </div>

          {filteredCreators.length === 0 && (
            <div className="text-center py-16">
              <Search className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-lg">{t('noResults')}</p>
            </div>
          )}
        </div>
      </section>

      {/* ─── Footer ─── */}
      <Footer />

      {/* ─── Modals ─── */}
      <AuthModal
        isOpen={authModal.open}
        onClose={handleCloseAuth}
        initialMode={authModal.mode}
        initialRole={authModal.role}
      />

      {user?.role === 'admin' ? (
        <AdminDashboardModal
          isOpen={dashboardState.open && dashboardState.tab === 'admin'}
          onClose={handleCloseDashboard}
        />
      ) : user?.role === 'brand' ? (
        <BrandDashboardModal
          isOpen={dashboardState.open}
          onClose={handleCloseDashboard}
          onHireCreator={handleHireCreator}
          initialTab={dashboardState.tab}
        />
      ) : (
        <CreatorDashboardModal
          isOpen={dashboardState.open}
          onClose={handleCloseDashboard}
        />
      )}
      <CreatorDetailsModal
        isOpen={!!selectedCreator}
        onClose={handleCloseCreator}
        creator={selectedCreator}
        onHire={handleHireCreator}
      />
      <CheckoutModal
        isOpen={!!checkoutData}
        onClose={handleCloseCheckout}
        creator={checkoutData?.creator}
        campaign={checkoutData?.campaign}
      />
      <ReviewModal
        isOpen={!!reviewCreator}
        onClose={handleCloseReview}
        creator={reviewCreator}
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
