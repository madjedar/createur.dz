import React from 'react';
import { ArrowLeft, ShieldCheck, Sparkles, CheckCircle2, Lock, CreditCard, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const Hero = ({ onOpenAuth, onOpenDashboard }) => {
  const { user } = useAuth();
  const { t } = useLanguage();

  return (
    <section className="relative overflow-hidden bg-[#080C14] py-20 lg:py-28 px-4 sm:px-6 lg:px-8 border-b border-white/5">
      {/* Glow Orbs */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-emerald-400/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="relative z-10 max-w-5xl mx-auto text-center flex flex-col items-center">
        
        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white mb-6 leading-tight sm:leading-tight lg:leading-tight tracking-wide">
          {t('heroTitle')}
        </h1>
        
        {/* Subtitle */}
        <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed">
          {t('heroSubtitle')}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mb-16">
          {user ? (
            <button 
              onClick={() => onOpenDashboard('overview')}
              className="btn-primary px-8 py-4 rounded-2xl text-lg font-bold flex items-center justify-center gap-3 w-full sm:w-auto shadow-xl shadow-emerald-500/20"
            >
              <Sparkles className="w-5 h-5" />
              <span>{t('goToDashboard')}</span>
            </button>
          ) : (
            <>
              <button 
                onClick={() => onOpenAuth('signup', 'brand')}
                className="px-8 py-4 rounded-2xl text-lg font-bold flex items-center justify-center gap-3 w-full sm:w-auto bg-slate-800 text-white hover:bg-slate-700 transition-colors border border-white/10"
              >
                <Building2 className="w-5 h-5 text-blue-400" />
                <span>{t('joinBrand')}</span>
              </button>
              <button 
                onClick={() => onOpenAuth('signup', 'creator')}
                className="btn-primary px-8 py-4 rounded-2xl text-lg font-bold flex items-center justify-center gap-3 w-full sm:w-auto shadow-xl shadow-emerald-500/20"
              >
                <Sparkles className="w-5 h-5" />
                <span>{t('joinCreator')}</span>
              </button>
            </>
          )}
        </div>

        {/* Clean Interactive App Preview Mockup Card */}
        <div className="w-full max-w-4xl glass-card p-6 sm:p-8 border border-white/15 shadow-2xl relative overflow-hidden group">
          {/* Top Bar Mockup */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
              <span className="text-xs text-slate-500 font-mono mr-2">createur-dz.com / deal-flow</span>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
              🔒 {t('heroTrust')}
            </span>
          </div>

          {/* Interactive Deal Flow Preview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-right">
            <div className="p-4 rounded-xl bg-[#080C14] border border-white/10">
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                <CreditCard className="w-4 h-4 text-blue-400" />
                <span>{t('step1')}</span>
              </div>
              <p className="font-bold text-white text-sm">{t('step1Desc')}</p>
              <p className="text-xs text-emerald-400 mt-1">{t('paymentMethods')}</p>
            </div>

            <div className="p-4 rounded-xl bg-[#080C14] border border-emerald-500/30">
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                <Lock className="w-4 h-4 text-amber-400" />
                <span>{t('step2')}</span>
              </div>
              <p className="font-bold text-white text-sm">{t('step2Desc')}</p>
              <p className="text-xs text-amber-400 mt-1">{t('secureFunds')}</p>
            </div>

            <div className="p-4 rounded-xl bg-[#080C14] border border-white/10">
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span className="text-sm font-semibold text-slate-300">{t('heroTrust')}</span>
              </div>
              <p className="font-bold text-white text-sm">{t('step3Desc')}</p>
              <p className="text-xs text-slate-400 mt-1">{t('payoutMethods')}</p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default Hero;
