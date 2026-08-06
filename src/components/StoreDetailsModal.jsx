import React, { useEffect } from 'react';
import { X, MapPin, Star, Building2, BadgeCheck, Briefcase, Send, CheckCircle2, ShieldCheck, ExternalLink, Globe } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { formatDZD } from '../services/chargilyService';
import { getLocalizedItem, mockCampaigns } from '../data/mockData';

export default function StoreDetailsModal({ isOpen, onClose, store, onApplyCampaign }) {
  const { t, language } = useLanguage();

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen || !store) return null;

  const storeName = getLocalizedItem(store, 'name', language);
  const storeSector = getLocalizedItem(store, 'sector', language);
  const storeLocation = getLocalizedItem(store, 'location', language);
  const storeBio = getLocalizedItem(store, 'bio', language);

  // Find related campaigns for this store or fallback to available campaigns
  const storeCampaigns = mockCampaigns.filter(
    (c) => c.brand.toLowerCase().includes(store.name.toLowerCase()) || store.name.toLowerCase().includes(c.brand.toLowerCase())
  );
  const displayCampaigns = storeCampaigns.length > 0 ? storeCampaigns : mockCampaigns.slice(0, 2);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay bg-slate-950/80 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-2xl my-auto p-0 overflow-hidden modal-content bg-slate-900 border border-white/10 rounded-2xl animate-scale-in flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute z-10 p-2 text-slate-400 top-3 left-3 bg-slate-900/60 rounded-full hover:bg-slate-800 hover:text-white transition-all backdrop-blur-md"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="overflow-y-auto p-6 sm:p-8 scrollbar-thin scrollbar-thumb-white/10 space-y-8">
          {/* Header & Logo */}
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-right border-b border-white/10 pb-6">
            <div className="relative">
              <img 
                src={store.logo || 'https://via.placeholder.com/150'} 
                alt={storeName} 
                className="w-24 h-24 md:w-28 md:h-28 rounded-2xl object-cover bg-blue-500/10 p-2 border-2 border-blue-500/20 shadow-xl"
              />
              {store.verified && (
                <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1 border-2 border-slate-900 shadow-sm text-white">
                  <BadgeCheck className="w-5 h-5" />
                </div>
              )}
            </div>

            <div className="flex-1 space-y-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center justify-center md:justify-start gap-2">
                {storeName}
              </h1>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-sm text-slate-400">
                <span className="flex items-center gap-1">
                  <Building2 className="w-4 h-4 text-blue-400" />
                  {storeSector}
                </span>
                <span className="flex items-center gap-1 text-slate-300">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  {storeLocation}
                </span>
                <span className="flex items-center gap-1 text-amber-400">
                  <Star className="w-4 h-4 fill-amber-400" />
                  <span className="font-medium">{store.rating || 4.9}</span>
                  <span className="text-slate-500">({store.reviewCount || 42})</span>
                </span>
              </div>

              <p className="text-sm text-slate-300 leading-relaxed max-w-lg mt-3">
                {storeBio}
              </p>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 glass-card rounded-xl border border-white/10 text-center">
              <span className="text-xs text-slate-400 block mb-1">{t('activeCampaignsCount')}</span>
              <span className="text-2xl font-black text-blue-400">{store.activeCampaigns} {t('applicants')}</span>
            </div>
            <div className="p-4 glass-card rounded-xl border border-white/10 text-center">
              <span className="text-xs text-slate-400 block mb-1">{t('budgetOffer')}</span>
              <span className="text-2xl font-black text-emerald-400">{formatDZD(store.totalBudget, language)}</span>
            </div>
          </div>

          {/* Store Campaigns Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-emerald-400" />
              {t('availableOpportunities')}
            </h3>

            <div className="space-y-4">
              {displayCampaigns.map((campaign) => {
                const campaignTitle = getLocalizedItem(campaign, 'title', language);
                const campaignDesc = getLocalizedItem(campaign, 'description', language);
                const campaignDeliverables = (campaign.deliverables && campaign.deliverables[language]) || campaign.deliverables?.ar || campaign.deliverables || [];

                return (
                  <div key={campaign.id} className="glass-card p-5 border border-white/10 rounded-xl flex flex-col justify-between space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-white text-base">{campaignTitle}</h4>
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">{campaignDesc}</p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
                        {formatDZD(campaign.budget, language)}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
                      {Array.isArray(campaignDeliverables) && campaignDeliverables.map((deliv, idx) => (
                        <span key={idx} className="px-2.5 py-1 rounded-md bg-white/5 text-slate-300 text-xs border border-white/5">
                          ✓ {deliv}
                        </span>
                      ))}
                    </div>

                    <button 
                      onClick={() => onApplyCampaign(campaign)}
                      className="btn-primary py-2.5 w-full flex items-center justify-center gap-2 text-sm font-bold shadow-lg shadow-emerald-500/20"
                    >
                      <Send className="w-4 h-4" />
                      <span>{t('applyNow')}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Guarantee Security Note */}
          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-slate-300 flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-blue-400 flex-shrink-0" />
            <div>
              <span className="font-bold text-white block">{t('checkoutTerms')}</span>
              <span>تضمن منصة Créateur DZ حماية الميزانية عبر حساب الضمان المالي المباشر.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
