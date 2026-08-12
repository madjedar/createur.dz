import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, User, Sparkles, Building2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const AuthModal = ({ isOpen, onClose, initialMode = 'login', initialRole = 'creator' }) => {
  const { user, updateRole } = useAuth();
  const { t } = useLanguage();
  const [mode, setMode] = useState(initialMode);
  const [role, setRole] = useState(initialRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setMode(initialMode);
    setRole(initialRole);
  }, [initialMode, initialRole]);

  useEffect(() => {
    // If user is logged in via OAuth but hasn't set a role yet, prompt them to pick a role
    if (user && isOpen && (!user.role || user.role === 'null')) {
      setMode('select_role');
    }
  }, [user, isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && mode !== 'select_role') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
    }
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleGoogleAuth = async () => {
    try {
      setLoading(true);
      setError(null);
      if (!supabase) {
        throw new Error('Supabase client is not initialized.');
      }
      sessionStorage.setItem('oauth_login', 'true');
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { 
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Google Auth Error:', err);
      setError(err.message || 'Google authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelection = async (selectedRole) => {
    setLoading(true);
    try {
      await updateRole(selectedRole);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      let authError;
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        authError = error;
      } else {
        const { data, error } = await supabase.auth.signUp({ 
          email, 
          password, 
          options: { data: { full_name: fullName, role } } 
        });
        authError = error;
        
        if (!error && data?.user) {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            full_name: fullName,
            role: role
          });
          await updateRole(role);
        }
      }
      if (authError) throw authError;
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm" onClick={() => { if (mode !== 'select_role') onClose(); }}>
      <div 
        className="modal-content glass-card relative w-full max-w-md p-6 sm:p-8 animate-fade-in-up border border-white/10 rounded-2xl bg-slate-900 shadow-2xl" 
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 left-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex justify-center mb-4">
          <img src="/logo.png" alt="Créateur DZ" className="h-16 w-auto object-contain rounded-2xl bg-white/10 p-1.5 shadow-lg" />
        </div>

        {mode === 'select_role' ? (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-2">{t('selectAccountType')}</h2>
            <p className="text-sm text-slate-400 mb-6">{t('selectRoleSub')}</p>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                type="button"
                onClick={() => handleRoleSelection('creator')}
                disabled={loading}
                className="p-5 rounded-2xl border border-white/10 bg-white/5 hover:bg-emerald-500/10 hover:border-emerald-500/50 transition-all text-center group flex flex-col items-center gap-3"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Sparkles className="w-6 h-6" />
                </div>
                <span className="font-bold text-white block">{t('roleCreator')}</span>
                <span className="text-xs text-slate-400 block">{t('roleCreatorSub')}</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleSelection('brand')}
                disabled={loading}
                className="p-5 rounded-2xl border border-white/10 bg-white/5 hover:bg-blue-500/10 hover:border-blue-500/50 transition-all text-center group flex flex-col items-center gap-3"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Building2 className="w-6 h-6" />
                </div>
                <span className="font-bold text-white block">{t('roleBrand')}</span>
                <span className="text-xs text-slate-400 block">{t('roleBrandSub')}</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-white mb-6 text-center">
              {mode === 'login' ? t('authLoginTitle') : t('authSignupTitle')}
            </h2>

            {/* Role Switcher in Signup Mode */}
            {mode === 'signup' && (
              <div className="mb-6">
                <label className="block text-xs font-semibold text-slate-400 mb-2">{t('accountType')}</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('creator')}
                    className={`py-2.5 px-3 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                      role === 'creator'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-md'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{t('roleCreator')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('brand')}
                    className={`py-2.5 px-3 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                      role === 'brand'
                        ? 'bg-blue-500/20 border-blue-500 text-blue-400 shadow-md'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    <span>{t('roleBrand')}</span>
                  </button>
                </div>
              </div>
            )}

            <button 
              onClick={handleGoogleAuth}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-white text-slate-800 hover:bg-slate-100 rounded-xl py-3 font-semibold transition-colors mb-6 disabled:opacity-70"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 24c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 21.53 7.7 24 12 24z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 4.8c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.46 14.97 0 12 0 7.7 0 3.99 2.47 2.18 6.07l3.66 2.84c.87-2.6 3.3-4.11 6.16-4.11z" />
              </svg>
              {t('authGoogle')}
            </button>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/20 border border-red-500/50 text-red-300 text-xs font-semibold text-center animate-fade-in">
                {error}
              </div>
            )}

            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 h-px bg-white/10"></div>
              <span className="text-sm text-slate-400">{t('authOr')}</span>
              <div className="flex-1 h-px bg-white/10"></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div className="relative">
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder={t('authFullName')}
                    className="input-field w-full pr-10"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
              )}
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="email" 
                  placeholder={t('authEmail')}
                  className="input-field w-full pr-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="password" 
                  placeholder={t('authPassword')}
                  className="input-field w-full pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {error && <div className="text-red-400 text-sm mt-2">{error}</div>}

              <button 
                type="submit" 
                disabled={loading}
                className="btn-primary w-full py-3 mt-6 flex justify-center items-center gap-2"
              >
                {loading ? (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  mode === 'login' ? t('authLoginBtn') : t('authSignupBtn')
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button 
                onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                className="text-sm text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
              >
                {mode === 'login' 
                  ? t('authSwitchToSignup') 
                  : t('authSwitchToLogin')
                }
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
