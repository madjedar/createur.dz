import React from 'react';
import { Globe, MessageCircle, Camera, Mail, MapPin, Heart } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const Footer = () => {
  const { t } = useLanguage();
  return (
    <footer className="border-t border-white/10 bg-slate-950 mt-auto" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">
          {/* Column 1 - Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img src="/logo.png" alt="Créateur DZ Logo" className="h-10 w-auto object-contain rounded-xl bg-white/10 p-1 shadow-md" />
              <span className="gradient-text text-xl font-bold font-inter" dir="ltr">Créateur DZ</span>
            </div>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              {t('footerAbout')}
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full glass-card flex items-center justify-center text-slate-400 hover:text-emerald-400 hover:bg-white/10 transition-all">
                <MessageCircle className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full glass-card flex items-center justify-center text-slate-400 hover:text-emerald-400 hover:bg-white/10 transition-all">
                <Camera className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full glass-card flex items-center justify-center text-slate-400 hover:text-emerald-400 hover:bg-white/10 transition-all">
                <Globe className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Column 2 - Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">{t('footerLinks')}</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors block">المنصة</a></li>
              <li><a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors block">صنّاع المحتوى</a></li>
              <li><a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors block">العلامات التجارية</a></li>
              <li><a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors block">الأسعار</a></li>
              <li><a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors block">الدعم</a></li>
            </ul>
          </div>

          {/* Column 3 - Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4">{t('footerContact')}</h4>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-slate-400">
                <Mail className="w-5 h-5 text-emerald-500" />
                <span>contact@createur-dz.com</span>
              </li>
              <li className="flex items-center gap-3 text-slate-400">
                <MapPin className="w-5 h-5 text-emerald-500" />
                <span>عنابة، الجزائر</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Payment Partners Strip */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 py-6 border-t border-white/5">
          <span className="text-slate-400 text-sm">{t('paymentPartners')}:</span>
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <span className="badge-edahabia text-xs px-3 py-1.5 rounded-md font-bold shadow-lg">💳 بطاقة الذهبية</span>
            <div className="w-px h-4 bg-white/10"></div>
            <span className="badge-cib text-xs px-3 py-1.5 rounded-md font-bold shadow-lg">🏦 بطاقة CIB</span>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 mt-2 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
          <p className="text-slate-500 text-center md:text-right">
            © {new Date().getFullYear()} Créateur DZ — {t('footerRights')}
          </p>
          <p className="text-slate-500 flex items-center justify-center gap-2">
            صنع بـ
            <Heart className="w-4 h-4 text-red-500 fill-red-500" />
            في عنابة، الجزائر
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
