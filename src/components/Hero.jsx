import React from 'react';
import { ArrowLeft, ShieldCheck, Sparkles, CheckCircle2, Lock, CreditCard, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const Hero = ({ onOpenAuth, onOpenDashboard }) => {
  const { user } = useAuth();
  const { t } = useLanguage();

  return (
    <section className="relative overflow-hidden bg-brand-cream py-20 lg:py-28 px-4 sm:px-6 lg:px-8">
      {/* Decorative Arch Background */}
      <div className="absolute top-0 right-0 w-1/2 h-[80%] bg-brand-orange rounded-bl-[150px] sm:rounded-bl-[250px] opacity-10 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-orangeLight rounded-tr-[150px] opacity-10 pointer-events-none"></div>

      <div className="relative z-10 max-w-5xl mx-auto text-center flex flex-col items-center">
        
        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-brand-brown mb-6 leading-tight sm:leading-tight lg:leading-tight tracking-wide relative">
          <span className="block mb-2 text-brand-brownLight text-3xl sm:text-5xl font-semibold">Make you</span>
          <span className="text-brand-orange">feel luxury</span>
        </h1>
        
        {/* Subtitle */}
        <p className="text-lg sm:text-xl text-brand-brownLight max-w-2xl mx-auto mb-10 leading-relaxed">
          {t('heroSubtitle')}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mb-16">
          {user ? (
            <button 
              onClick={() => onOpenDashboard('overview')}
              className="btn-primary px-8 py-4 text-lg w-full sm:w-auto flex items-center justify-center gap-3 shadow-lg shadow-brand-orange/20"
            >
              <Sparkles className="w-5 h-5" />
              <span>{t('goToDashboard')}</span>
            </button>
          ) : (
            <>
              <button 
                onClick={() => onOpenAuth('signup', 'brand')}
                className="btn-secondary px-8 py-4 text-lg w-full sm:w-auto flex items-center justify-center gap-3"
              >
                <Building2 className="w-5 h-5" />
                <span>{t('joinBrand')}</span>
              </button>
              <button 
                onClick={() => onOpenAuth('signup', 'creator')}
                className="btn-primary px-8 py-4 text-lg w-full sm:w-auto flex items-center justify-center gap-3 shadow-lg shadow-brand-orange/20"
              >
                <Sparkles className="w-5 h-5" />
                <span>{t('joinCreator')}</span>
              </button>
            </>
          )}
        </div>



        {/* Stats Row */}
        <div className="flex flex-wrap justify-center gap-8 sm:gap-16 border-t border-brand-border/50 pt-8 mt-4 w-full max-w-4xl text-brand-brown">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              <img src="https://i.pravatar.cc/100?img=1" className="w-8 h-8 rounded-full border-2 border-brand-cream" />
              <img src="https://i.pravatar.cc/100?img=2" className="w-8 h-8 rounded-full border-2 border-brand-cream" />
              <img src="https://i.pravatar.cc/100?img=3" className="w-8 h-8 rounded-full border-2 border-brand-cream" />
            </div>
            <div className="text-start">
              <p className="font-bold text-lg">1.3 M+</p>
              <p className="text-xs text-brand-brownLight">Customer review</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-orange/10 flex items-center justify-center text-brand-orange">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="text-start">
              <p className="font-bold text-lg">4.7 M+</p>
              <p className="text-xs text-brand-brownLight">Active members</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-orange/10 flex items-center justify-center text-brand-orange">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="text-start">
              <p className="font-bold text-lg">100%</p>
              <p className="text-xs text-brand-brownLight">Secure platform</p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default Hero;
