import React, { useEffect } from 'react';
import { X, MapPin, Star, Play, Camera, ExternalLink, BadgeCheck, Users, TrendingUp, Handshake } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { formatDZD } from '../services/chargilyService';
import { getLocalizedItem } from '../data/mockData';

export default function CreatorDetailsModal({ isOpen, onClose, creator, onHire, onContact }) {
  const { t, language } = useLanguage();
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen || !creator) return null;

  // Format numbers to K/M
  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const totalFollowers = (creator.followers?.youtube || 0) + (creator.followers?.instagram || 0) + (creator.followers?.tiktok || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay bg-slate-950/80 backdrop-blur-sm overflow-y-auto" onClick={onClose}>
      <div 
        className="relative w-full max-w-2xl my-auto p-0 overflow-hidden modal-content bg-slate-900 border border-white/10 rounded-2xl animate-scale-in flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute z-10 p-2 text-slate-400 top-2 left-2 bg-slate-900/50 rounded-full hover:bg-slate-800 hover:text-white transition-all backdrop-blur-md"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/10">
          {/* Profile Header */}
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8 text-center md:text-right">
            <div className="relative">
              <img 
                src={creator.avatar || 'https://via.placeholder.com/150'} 
                alt={creator.name} 
                className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-slate-800 shadow-xl"
              />
              {creator.verified && (
                <div className="absolute bottom-1 right-1 bg-blue-500 rounded-full p-1 border-2 border-slate-900 shadow-sm text-white">
                  <BadgeCheck className="w-5 h-5 md:w-6 md:h-6" />
                </div>
              )}
            </div>

            <div className="flex-1 space-y-2">
              <h1 className="text-3xl font-bold text-white flex items-center justify-center md:justify-start gap-2">
                {getLocalizedItem(creator, 'name', language)}
              </h1>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-sm text-slate-400">
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {getLocalizedItem(creator, 'location', language) || 'الجزائر'}
                </span>
                <span className="px-2 py-1 bg-white/5 border border-white/10 rounded-md text-slate-300">
                  {getLocalizedItem(creator, 'category', language) || 'صانع محتوى'}
                </span>
                <span className="flex items-center gap-1 text-amber-400">
                  <Star className="w-4 h-4 fill-amber-400" />
                  <span className="font-medium">{creator.rating || 4.8}</span>
                  <span className="text-slate-500">({creator.reviewCount || 24})</span>
                </span>
              </div>

              {/* Bio */}
              <p className="mt-4 text-slate-300 leading-relaxed max-w-lg">
                {getLocalizedItem(creator, 'bio', language)}
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3 md:gap-4 mb-8">
            <div className="p-4 text-center glass-card rounded-xl">
              <Users className="w-5 h-5 mx-auto mb-2 text-blue-400" />
              <div className="text-xl md:text-2xl font-bold text-white">{formatNumber(totalFollowers || 150000)}</div>
              <div className="text-xs text-slate-400 mt-1">{t('creatorFollowers')}</div>
            </div>
            <div className="p-4 text-center glass-card rounded-xl">
              <TrendingUp className="w-5 h-5 mx-auto mb-2 text-emerald-400" />
              <div className="text-xl md:text-2xl font-bold text-white">{creator.engagement || 5.2}%</div>
              <div className="text-xs text-slate-400 mt-1">{t('creatorEngagement')}</div>
            </div>
            <div className="p-4 text-center glass-card rounded-xl">
              <Handshake className="w-5 h-5 mx-auto mb-2 text-amber-400" />
              <div className="text-xl md:text-2xl font-bold text-white">{creator.completedDeals || 12}</div>
              <div className="text-xs text-slate-400 mt-1">{t('creatorDeals')}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Social Links */}
            <div className="space-y-3">
              <h3 className="font-semibold text-white mb-4">المنصات</h3>
              <a href="#" className="flex items-center justify-between p-3 glass-card rounded-xl hover:bg-white/10 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-500/10 text-red-500 rounded-lg group-hover:bg-red-500 group-hover:text-white transition-colors">
                    <Play className="w-5 h-5" />
                  </div>
                  <span className="font-medium text-slate-200">YouTube</span>
                </div>
                <span className="text-slate-400 font-medium">{formatNumber(creator.followers?.youtube || 80000)}</span>
              </a>
              
              <a href="#" className="flex items-center justify-between p-3 glass-card rounded-xl hover:bg-white/10 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-pink-500/10 text-pink-500 rounded-lg group-hover:bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500 group-hover:text-white transition-all">
                    <Camera className="w-5 h-5" />
                  </div>
                  <span className="font-medium text-slate-200">Instagram</span>
                </div>
                <span className="text-slate-400 font-medium">{formatNumber(creator.followers?.instagram || 50000)}</span>
              </a>

              <a href="#" className="flex items-center justify-between p-3 glass-card rounded-xl hover:bg-white/10 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-800 text-white rounded-lg group-hover:bg-white group-hover:text-black transition-colors">
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 15.68a6.34 6.34 0 0 0 6.27 6.28A6.34 6.34 0 0 0 17.62 16v-6.32a8.21 8.21 0 0 0 4.19 1.15V7.27a4.91 4.91 0 0 1-2.22-.58z"/></svg>
                  </div>
                  <span className="font-medium text-slate-200">TikTok</span>
                </div>
                <span className="text-slate-400 font-medium">{formatNumber(creator.followers?.tiktok || 120000)}</span>
              </a>
            </div>

            {/* Rate Card */}
            <div>
              <h3 className="font-semibold text-white mb-4">{t('creatorRate')}</h3>
              <div className="h-full p-6 flex flex-col justify-center items-center glass-card rounded-xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-blue-600/10 opacity-50 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 blur-3xl rounded-full -mr-16 -mt-16"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/20 blur-3xl rounded-full -ml-16 -mb-16"></div>
                
                <div className="relative z-10 text-center">
                  <span className="block text-slate-400 mb-2">{t('deliveryStartsAt')}</span>
                  <span className="text-4xl font-bold gradient-text block mb-4">{formatDZD(creator.ratePerPost || 15000, language)}</span>
                  <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-slate-300 inline-block">
                    قابل للتفاوض حسب الحملة
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Portfolio Section */}
          <div className="mb-8">
            <h3 className="font-semibold text-white mb-4 flex items-center justify-between">
              {t('creatorPortfolio')}
              <a href="#" className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1">
                عرض الكل <ExternalLink className="w-3 h-3" />
              </a>
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="aspect-[4/5] rounded-xl overflow-hidden relative group bg-slate-800">
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                    <span className="text-xs text-white font-medium">حملة تسويقية #{item}</span>
                  </div>
                  <div className="w-full h-full bg-slate-700 animate-pulse group-hover:scale-105 transition-transform duration-500"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons (Sticky Bottom) */}
        <div className="p-4 md:p-6 border-t border-white/10 bg-slate-900/90 backdrop-blur-md flex flex-col sm:flex-row gap-3">
          <button 
            onClick={() => onHire(creator)}
            className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-400 hover:to-blue-500 shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
          >
            <Handshake className="w-5 h-5" />
            {t('creatorHire')}
          </button>
          <button 
            onClick={() => onContact && onContact(creator)}
            className="flex-1 sm:flex-none py-3 px-6 rounded-xl font-bold text-slate-300 bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2">
            {t('creatorContact')}
          </button>
        </div>
      </div>
    </div>
  );
}
