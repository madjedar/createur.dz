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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay overflow-y-auto" onClick={onClose}>
      <div 
        className="relative w-full max-w-2xl my-auto p-0 overflow-hidden modal-content bg-white rounded-[32px] shadow-2xl animate-scale-in flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute z-10 p-2 text-brand-brownLight top-4 left-4 bg-white/80 rounded-full hover:bg-brand-cream hover:text-brand-brown transition-all backdrop-blur-md shadow-sm"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-brand-border">
          {/* Profile Header */}
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8 text-center md:text-right">
            <div className="relative">
              <img 
                src={creator.avatar || 'https://via.placeholder.com/150'} 
                alt={creator.name} 
                className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-white shadow-lg bg-brand-cream"
              />
              {creator.verified && (
                <div className="absolute bottom-1 right-1 bg-blue-500 rounded-full p-1 border-2 border-white shadow-sm text-white">
                  <BadgeCheck className="w-5 h-5 md:w-6 md:h-6" />
                </div>
              )}
            </div>

            <div className="flex-1 space-y-2">
              <h1 className="text-3xl font-black text-brand-brown flex items-center justify-center md:justify-start gap-2">
                {getLocalizedItem(creator, 'name', language)}
              </h1>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-sm text-brand-brownLight">
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {getLocalizedItem(creator, 'location', language) || 'الجزائر'}
                </span>
                <span className="px-3 py-1 bg-brand-cream border border-brand-border rounded-full text-brand-brown font-medium">
                  {getLocalizedItem(creator, 'category', language) || 'صانع محتوى'}
                </span>
                <span className="flex items-center gap-1 text-amber-500">
                  <Star className="w-4 h-4 fill-amber-500" />
                  <span className="font-bold text-brand-brown">{creator.rating || 4.8}</span>
                  <span className="text-brand-brownLight">({creator.reviewCount || 24})</span>
                </span>
              </div>

              {/* Bio */}
              <p className="mt-4 text-brand-brownLight leading-relaxed max-w-lg text-sm md:text-base">
                {getLocalizedItem(creator, 'bio', language)}
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3 md:gap-4 mb-8">
            <div className="p-4 text-center bg-white border border-brand-border rounded-2xl shadow-sm">
              <Users className="w-5 h-5 mx-auto mb-2 text-brand-orange" />
              <div className="text-xl md:text-2xl font-black text-brand-brown">{formatNumber(totalFollowers || 150000)}</div>
              <div className="text-xs text-brand-brownLight mt-1 font-medium">{t('creatorFollowers')}</div>
            </div>
            <div className="p-4 text-center bg-white border border-brand-border rounded-2xl shadow-sm">
              <TrendingUp className="w-5 h-5 mx-auto mb-2 text-brand-orange" />
              <div className="text-xl md:text-2xl font-black text-brand-brown">{creator.engagement || 5.2}%</div>
              <div className="text-xs text-brand-brownLight mt-1 font-medium">{t('creatorEngagement')}</div>
            </div>
            <div className="p-4 text-center bg-white border border-brand-border rounded-2xl shadow-sm">
              <Handshake className="w-5 h-5 mx-auto mb-2 text-brand-orange" />
              <div className="text-xl md:text-2xl font-black text-brand-brown">{creator.completedDeals || 12}</div>
              <div className="text-xs text-brand-brownLight mt-1 font-medium">{t('creatorDeals')}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Social Links */}
            <div className="space-y-3">
              <h3 className="font-bold text-brand-brown mb-4">المنصات</h3>
              <a href="#" className="flex items-center justify-between p-3 bg-white border border-brand-border rounded-2xl hover:bg-brand-cream transition-colors group shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-50 text-red-500 rounded-xl group-hover:bg-red-500 group-hover:text-white transition-colors">
                    <Play className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-brand-brown">YouTube</span>
                </div>
                <span className="text-brand-brownLight font-medium">{formatNumber(creator.followers?.youtube || 80000)}</span>
              </a>
              
              <a href="#" className="flex items-center justify-between p-3 bg-white border border-brand-border rounded-2xl hover:bg-brand-cream transition-colors group shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-pink-50 text-pink-500 rounded-xl group-hover:bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500 group-hover:text-white transition-all">
                    <Camera className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-brand-brown">Instagram</span>
                </div>
                <span className="text-brand-brownLight font-medium">{formatNumber(creator.followers?.instagram || 50000)}</span>
              </a>

              <a href="#" className="flex items-center justify-between p-3 bg-white border border-brand-border rounded-2xl hover:bg-brand-cream transition-colors group shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-brand-cream text-brand-brown rounded-xl group-hover:bg-brand-brown group-hover:text-white transition-colors">
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 15.68a6.34 6.34 0 0 0 6.27 6.28A6.34 6.34 0 0 0 17.62 16v-6.32a8.21 8.21 0 0 0 4.19 1.15V7.27a4.91 4.91 0 0 1-2.22-.58z"/></svg>
                  </div>
                  <span className="font-bold text-brand-brown">TikTok</span>
                </div>
                <span className="text-brand-brownLight font-medium">{formatNumber(creator.followers?.tiktok || 120000)}</span>
              </a>
            </div>

            {/* Rate Card */}
            <div>
              <h3 className="font-bold text-brand-brown mb-4">{t('creatorRate')}</h3>
              <div className="h-full p-6 flex flex-col justify-center items-center bg-brand-cream border border-brand-border rounded-2xl relative overflow-hidden group">
                <div className="relative z-10 text-center">
                  <span className="block text-brand-brownLight font-medium mb-2">{t('deliveryStartsAt')}</span>
                  <span className="text-4xl font-black text-brand-orange block mb-4">{formatDZD(creator.ratePerPost || 15000, language)}</span>
                  <div className="px-4 py-2 bg-white border border-brand-border rounded-full text-xs font-bold text-brand-brown inline-block shadow-sm">
                    قابل للتفاوض حسب الحملة
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Portfolio Section */}
          <div className="mb-8">
            <h3 className="font-bold text-brand-brown mb-4 flex items-center justify-between">
              {t('creatorPortfolio')}
              <a href="#" className="text-sm font-medium text-blue-500 hover:text-blue-600 flex items-center gap-1">
                عرض الكل <ExternalLink className="w-3 h-3" />
              </a>
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="aspect-[4/5] rounded-2xl overflow-hidden relative group bg-brand-cream border border-brand-border">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                    <span className="text-xs text-white font-bold">حملة تسويقية #{item}</span>
                  </div>
                  <div className="w-full h-full bg-brand-cream animate-pulse group-hover:scale-105 transition-transform duration-500"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons (Sticky Bottom) */}
        <div className="p-4 md:p-6 border-t border-brand-border bg-white/90 backdrop-blur-md flex flex-col sm:flex-row gap-3">
          <button 
            onClick={() => onHire(creator)}
            className="flex-1 py-3 px-4 rounded-full font-bold btn-primary flex items-center justify-center gap-2"
          >
            <Handshake className="w-5 h-5" />
            {t('creatorHire')}
          </button>
          <button 
            onClick={() => onContact && onContact(creator)}
            className="flex-1 sm:flex-none py-3 px-6 rounded-full font-bold text-brand-brown bg-white border border-brand-border hover:bg-brand-cream transition-all flex items-center justify-center gap-2 shadow-sm">
            {t('creatorContact')}
          </button>
        </div>
      </div>
    </div>
  );
}
