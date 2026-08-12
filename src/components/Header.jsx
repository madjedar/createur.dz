import React, { useState, useRef, useEffect } from 'react';
import { Menu, X, User, LogOut, LayoutDashboard, PlusCircle, Sparkles, Building2, Globe, ShieldAlert, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import NotificationDropdown from './NotificationDropdown';

const Header = ({ onOpenAuth, onOpenDashboard, onOpenProfileSettings }) => {
  const { user: realUser, logout } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const langMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target)) {
        setIsLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    <header className="sticky top-0 z-50 bg-brand-cream border-b border-brand-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <a href="#" className="flex-shrink-0 flex items-center gap-3 group">
            <img 
              src="/logo.png" 
              alt="Créateur DZ Logo" 
              className="h-10 sm:h-11 w-auto object-contain rounded-xl bg-white p-1 group-hover:scale-105 transition-transform duration-200"
            />
            <span className="text-xl sm:text-2xl font-bold font-inter tracking-wide text-brand-orange" dir="ltr">Créateur DZ</span>
          </a>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-4">
            
            {/* Language Switcher */}
            <div className="relative" ref={langMenuRef}>
              <button 
                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-brand-brownLight hover:text-brand-brown hover:bg-white/50 transition-colors font-bold text-sm"
              >
                <Globe className="w-4 h-4" />
                <span className="uppercase">{language}</span>
              </button>
              {isLangMenuOpen && (
                <div className="absolute top-full mt-2 w-32 bg-white border border-brand-border rounded-[20px] shadow-xl overflow-hidden py-1 z-50 ltr:right-0 rtl:left-0">
                  <button onClick={() => { setLanguage('ar'); setIsLangMenuOpen(false); }} className="w-full text-start px-4 py-2 hover:bg-brand-cream text-brand-brown text-sm font-bold">🇩🇿 العربية</button>
                  <button onClick={() => { setLanguage('fr'); setIsLangMenuOpen(false); }} className="w-full text-start px-4 py-2 hover:bg-brand-cream text-brand-brown text-sm font-bold">🇫🇷 Français</button>
                  <button onClick={() => { setLanguage('en'); setIsLangMenuOpen(false); }} className="w-full text-start px-4 py-2 hover:bg-brand-cream text-brand-brown text-sm font-bold">🇬🇧 English</button>
                </div>
              )}
            </div>

            {user ? (
              <>
                <NotificationDropdown />
                {isAdmin ? (
                  <button
                    onClick={() => onOpenDashboard('admin')}
                    className="flex items-center gap-2 px-4 py-2 rounded-full text-purple-600 hover:bg-white transition-colors font-bold text-sm"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    <span>{t('adminDashboard')}</span>
                  </button>
                ) : isBrand ? (
                  <>
                    <button
                      onClick={() => onOpenDashboard('create')}
                      className="btn-primary text-xs flex items-center gap-1.5"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>{t('addCampaign')}</span>
                    </button>
                    <button
                      onClick={() => onOpenDashboard('overview')}
                      className="flex items-center gap-2 px-4 py-2 rounded-full text-brand-brown hover:bg-white transition-colors font-bold text-sm"
                    >
                      <Building2 className="w-4 h-4 text-brand-orange" />
                      <span>{t('brandDashboard')}</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => onOpenDashboard('overview')}
                    className="flex items-center gap-2 px-4 py-2 rounded-full text-brand-brown hover:bg-white transition-colors font-bold text-sm"
                  >
                    <Sparkles className="w-4 h-4 text-brand-orange" />
                    <span>{t('creatorDashboard')}</span>
                  </button>
                )}

                <button
                  onClick={onOpenProfileSettings}
                  className="flex items-center gap-2 text-brand-brownLight hover:text-brand-brown transition-colors text-sm px-3 py-2 rounded-full hover:bg-white"
                >
                  <Settings className="w-4 h-4" />
                  <span>{t('profileSettings') || 'الملف الشخصي'}</span>
                </button>

                <button
                  onClick={logout}
                  className="flex items-center gap-2 text-brand-brownLight hover:text-brand-brown transition-colors text-sm px-3 py-2 rounded-full hover:bg-white"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{t('logout')}</span>
                </button>

                <div 
                  onClick={() => onOpenDashboard(isAdmin ? 'admin' : 'overview')}
                  className={`w-10 h-10 rounded-full overflow-hidden border-2 cursor-pointer hover:scale-105 transition-transform ${isAdmin ? 'border-purple-500' : 'border-brand-orange'}`}
                  title={user.user_metadata?.full_name || 'Profile'}
                >
                  {(user.profile?.avatar_url || user.user_metadata?.avatar_url) ? (
                    <img src={user.profile?.avatar_url || user.user_metadata.avatar_url} alt="User" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-brand-border flex items-center justify-center text-brand-brownLight">
                      <User className="w-5 h-5" />
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={() => onOpenAuth('login')}
                  className="text-brand-brown hover:text-brand-orange transition-colors text-sm font-bold px-4 py-2 rounded-full"
                >
                  {t('login')}
                </button>
                <button
                  onClick={() => onOpenAuth('signup', 'creator')}
                  className="btn-primary text-xs flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{t('joinCreator')}</span>
                </button>
                <button
                  onClick={() => onOpenAuth('signup', 'brand')}
                  className="btn-secondary text-xs flex items-center gap-1.5"
                >
                  <Building2 className="w-4 h-4" />
                  <span>{t('joinBrand')}</span>
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-brand-brown hover:text-brand-orange p-2"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-brand-cream border-b border-brand-border px-4 py-6 space-y-4">
          {/* Mobile Language Switcher */}
          <div className="flex items-center gap-2 mb-4 bg-white p-2 rounded-full shadow-sm justify-center">
            <button onClick={() => { setLanguage('ar'); setIsMobileMenuOpen(false); }} className={`flex-1 py-2 rounded-full text-sm font-bold ${language === 'ar' ? 'bg-brand-orange/10 text-brand-orange' : 'text-brand-brownLight'}`}>العربية</button>
            <button onClick={() => { setLanguage('fr'); setIsMobileMenuOpen(false); }} className={`flex-1 py-2 rounded-full text-sm font-bold ${language === 'fr' ? 'bg-brand-orange/10 text-brand-orange' : 'text-brand-brownLight'}`}>Français</button>
            <button onClick={() => { setLanguage('en'); setIsMobileMenuOpen(false); }} className={`flex-1 py-2 rounded-full text-sm font-bold ${language === 'en' ? 'bg-brand-orange/10 text-brand-orange' : 'text-brand-brownLight'}`}>English</button>
          </div>

          {user ? (
            <>
              {isAdmin ? (
                <button
                  onClick={() => { setIsMobileMenuOpen(false); onOpenDashboard('admin'); }}
                  className="w-full py-3 rounded-full bg-white text-purple-600 flex items-center justify-center gap-2 font-bold shadow-sm"
                >
                  <ShieldAlert className="w-5 h-5" />
                  <span>{t('adminDashboard')}</span>
                </button>
              ) : isBrand ? (
                <>
                  <button
                    onClick={() => { setIsMobileMenuOpen(false); onOpenDashboard('create'); }}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    <PlusCircle className="w-5 h-5" />
                    <span>{t('addCampaign')}</span>
                  </button>
                  <button
                    onClick={() => { setIsMobileMenuOpen(false); onOpenDashboard('overview'); }}
                    className="w-full py-3 rounded-full bg-white text-brand-brown flex items-center justify-center gap-2 font-bold shadow-sm"
                  >
                    <Building2 className="w-5 h-5 text-brand-orange" />
                    <span>{t('brandDashboard')}</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => { setIsMobileMenuOpen(false); onOpenDashboard('overview'); }}
                  className="w-full py-3 rounded-full bg-white text-brand-brown flex items-center justify-center gap-2 font-bold shadow-sm"
                >
                  <Sparkles className="w-5 h-5 text-brand-orange" />
                  <span>{t('creatorDashboard')}</span>
                </button>
              )}

              <button
                onClick={() => { setIsMobileMenuOpen(false); onOpenProfileSettings(); }}
                className="w-full py-3 rounded-full bg-white text-brand-brown flex items-center justify-center gap-2 font-bold shadow-sm"
              >
                <Settings className="w-5 h-5 text-brand-brownLight" />
                <span>{t('profileSettings') || 'الملف الشخصي'}</span>
              </button>

              <button
                onClick={() => { setIsMobileMenuOpen(false); logout(); }}
                className="w-full py-2 text-brand-brownLight hover:text-brand-brown flex items-center justify-center gap-2 text-sm font-bold"
              >
                <LogOut className="w-4 h-4" />
                <span>{t('logout')}</span>
              </button>
            </>
          ) : (
            <div className="space-y-3">
              <button
                onClick={() => { setIsMobileMenuOpen(false); onOpenAuth('login'); }}
                className="w-full py-3 rounded-full bg-white text-brand-brown font-bold shadow-sm"
              >
                {t('login')}
              </button>
              <button
                onClick={() => { setIsMobileMenuOpen(false); onOpenAuth('signup', 'creator'); }}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                <span>{t('joinCreator')}</span>
              </button>
              <button
                onClick={() => { setIsMobileMenuOpen(false); onOpenAuth('signup', 'brand'); }}
                className="btn-secondary w-full flex items-center justify-center gap-2"
              >
                <Building2 className="w-5 h-5" />
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
