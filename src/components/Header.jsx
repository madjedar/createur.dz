import React, { useState } from 'react';
import { Menu, X, User, LogOut, LayoutDashboard, PlusCircle, Sparkles, Building2, Globe, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const Header = ({ onOpenAuth, onOpenDashboard }) => {
  const { user: realUser, logout } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);

  // FAKE USER FOR VISUAL TESTING ONLY
  const isFakeMode = window.location.hash.includes('#fake');
  const user = isFakeMode ? {
    role: 'creator',
    user_metadata: {
      avatar_url: 'https://i.pravatar.cc/150?img=11',
      full_name: 'Test Creator'
    }
  } : realUser;

  const isBrand = user?.role === 'brand';
  const isAdmin = user?.role === 'admin';

  return (
    <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <a href="#" className="flex-shrink-0 flex items-center gap-3 group">
            <img 
              src="/logo.png" 
              alt="Créateur DZ Logo" 
              className="h-10 sm:h-11 w-auto object-contain rounded-xl bg-white/10 p-1 group-hover:scale-105 transition-transform duration-200 shadow-md"
            />
            <span className="text-xl sm:text-2xl font-bold gradient-text font-inter tracking-wide" dir="ltr">Créateur DZ</span>
          </a>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-4">
            
            {/* Language Switcher */}
            <div className="relative">
              <button 
                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-colors font-bold text-sm"
              >
                <Globe className="w-4 h-4" />
                <span className="uppercase">{language}</span>
              </button>
              {isLangMenuOpen && (
                <div className="absolute top-full mt-2 w-32 bg-slate-800 border border-white/10 rounded-xl shadow-xl overflow-hidden py-1 z-50 ltr:right-0 rtl:left-0">
                  <button onClick={() => { setLanguage('ar'); setIsLangMenuOpen(false); }} className="w-full text-start px-4 py-2 hover:bg-white/5 text-sm font-bold">🇩🇿 العربية</button>
                  <button onClick={() => { setLanguage('fr'); setIsLangMenuOpen(false); }} className="w-full text-start px-4 py-2 hover:bg-white/5 text-sm font-bold">🇫🇷 Français</button>
                  <button onClick={() => { setLanguage('en'); setIsLangMenuOpen(false); }} className="w-full text-start px-4 py-2 hover:bg-white/5 text-sm font-bold">🇬🇧 English</button>
                </div>
              )}
            </div>

            {user ? (
              <>
                {isAdmin ? (
                  <button
                    onClick={() => onOpenDashboard('admin')}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 transition-colors font-bold text-sm"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    <span>لوحة الأدمن / Admin Dashboard</span>
                  </button>
                ) : isBrand ? (
                  <>
                    <button
                      onClick={() => onOpenDashboard('create')}
                      className="btn-primary text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 font-bold shadow-lg"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>{t('addCampaign')}</span>
                    </button>
                    <button
                      onClick={() => onOpenDashboard('overview')}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-colors font-bold text-sm"
                    >
                      <Building2 className="w-4 h-4 text-blue-400" />
                      <span>{t('brandDashboard')}</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => onOpenDashboard('overview')}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-colors font-bold text-sm"
                  >
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>{t('creatorDashboard')}</span>
                  </button>
                )}

                <button
                  onClick={logout}
                  className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm px-2 py-1"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{t('logout')}</span>
                </button>

                <div className={`w-9 h-9 rounded-full overflow-hidden border-2 ${isBrand ? 'border-blue-500' : 'border-emerald-500'}`}>
                  {user.user_metadata?.avatar_url ? (
                    <img src={user.user_metadata.avatar_url} alt="User" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-300">
                      <User className="w-5 h-5" />
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={() => onOpenAuth('login')}
                  className="text-slate-300 hover:text-white transition-colors text-sm font-bold px-3 py-2"
                >
                  {t('login')}
                </button>
                <button
                  onClick={() => onOpenAuth('signup', 'creator')}
                  className="btn-primary text-xs px-4 py-2.5 rounded-xl font-bold flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{t('joinCreator')}</span>
                </button>
                <button
                  onClick={() => onOpenAuth('signup', 'brand')}
                  className="btn-secondary text-xs px-4 py-2.5 rounded-xl font-bold flex items-center gap-1.5 border border-white/10"
                >
                  <Building2 className="w-4 h-4 text-blue-400" />
                  <span>{t('joinBrand')}</span>
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-slate-300 hover:text-white p-2"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-white/10 px-4 py-6 space-y-4">
          {/* Mobile Language Switcher */}
          <div className="flex items-center gap-2 mb-4 bg-white/5 p-2 rounded-xl justify-center">
            <button onClick={() => { setLanguage('ar'); setIsMobileMenuOpen(false); }} className={`flex-1 py-2 rounded-lg text-sm font-bold ${language === 'ar' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400'}`}>العربية</button>
            <button onClick={() => { setLanguage('fr'); setIsMobileMenuOpen(false); }} className={`flex-1 py-2 rounded-lg text-sm font-bold ${language === 'fr' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400'}`}>Français</button>
            <button onClick={() => { setLanguage('en'); setIsMobileMenuOpen(false); }} className={`flex-1 py-2 rounded-lg text-sm font-bold ${language === 'en' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400'}`}>English</button>
          </div>

          {user ? (
            <>
              {isAdmin ? (
                <button
                  onClick={() => { setIsMobileMenuOpen(false); onOpenDashboard('admin'); }}
                  className="w-full py-3 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center gap-2 font-bold border border-purple-500/20"
                >
                  <ShieldAlert className="w-5 h-5" />
                  <span>لوحة الأدمن / Admin Dashboard</span>
                </button>
              ) : isBrand ? (
                <>
                  <button
                    onClick={() => { setIsMobileMenuOpen(false); onOpenDashboard('create'); }}
                    className="btn-primary w-full py-3 rounded-xl flex items-center justify-center gap-2 font-bold"
                  >
                    <PlusCircle className="w-5 h-5" />
                    <span>{t('addCampaign')}</span>
                  </button>
                  <button
                    onClick={() => { setIsMobileMenuOpen(false); onOpenDashboard('overview'); }}
                    className="w-full py-3 rounded-xl bg-white/5 text-white flex items-center justify-center gap-2 font-bold"
                  >
                    <Building2 className="w-5 h-5 text-blue-400" />
                    <span>{t('brandDashboard')}</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => { setIsMobileMenuOpen(false); onOpenDashboard('overview'); }}
                  className="w-full py-3 rounded-xl bg-white/5 text-white flex items-center justify-center gap-2 font-bold"
                >
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                  <span>{t('creatorDashboard')}</span>
                </button>
              )}

              <button
                onClick={() => { setIsMobileMenuOpen(false); logout(); }}
                className="w-full py-2 text-slate-400 flex items-center justify-center gap-2 text-sm"
              >
                <LogOut className="w-4 h-4" />
                <span>{t('logout')}</span>
              </button>
            </>
          ) : (
            <div className="space-y-3">
              <button
                onClick={() => { setIsMobileMenuOpen(false); onOpenAuth('login'); }}
                className="w-full py-3 rounded-xl bg-white/5 text-white font-bold"
              >
                {t('login')}
              </button>
              <button
                onClick={() => { setIsMobileMenuOpen(false); onOpenAuth('signup', 'creator'); }}
                className="btn-primary w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                <span>{t('joinCreator')}</span>
              </button>
              <button
                onClick={() => { setIsMobileMenuOpen(false); onOpenAuth('signup', 'brand'); }}
                className="btn-secondary w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2"
              >
                <Building2 className="w-5 h-5 text-blue-400" />
                <span>{t('joinBrand')}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;
