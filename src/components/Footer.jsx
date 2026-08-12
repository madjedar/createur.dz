import React from 'react';
import { Globe, MessageCircle, Camera, Mail, MapPin, Heart } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const Footer = ({ onLinkClick }) => {
  const { t } = useLanguage();
  return (
    <footer className="border-t border-brand-border bg-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">
          {/* Column 1 - Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img src="/logo.png" alt="Créateur DZ Logo" className="h-10 w-auto object-contain rounded-xl bg-brand-cream border border-brand-border p-1" />
              <span className="text-brand-brown text-xl font-bold font-inter" dir="ltr">Créateur DZ</span>
            </div>
            <p className="text-brand-brownLight text-sm mb-6 leading-relaxed">
              {t('footerAbout')}
            </p>

          </div>

          {/* Column 2 - Quick Links */}
          <div>
            <h4 className="text-brand-brown font-semibold mb-4">{t('footerLinks')}</h4>
            <ul className="space-y-3">
              <li>
                <button 
                  onClick={() => onLinkClick?.('creators')} 
                  className="text-brand-brownLight hover:text-brand-orange transition-colors block text-right"
                >
                  {t('footerCreators')}
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onLinkClick?.('stores')} 
                  className="text-brand-brownLight hover:text-brand-orange transition-colors block text-right"
                >
                  {t('footerBrands')}
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3 - Contact */}
          <div>
            <h4 className="text-brand-brown font-semibold mb-4">{t('footerContact')}</h4>
            <ul className="space-y-4">

              <li className="flex items-center gap-3 text-brand-brownLight">
                <MapPin className="w-5 h-5 text-brand-orange" />
                <span>{t('footerCity')}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Payment Partners Strip */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 py-6 border-t border-brand-border">
          <span className="text-brand-brownLight text-sm">{t('paymentPartners')}:</span>
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <span className="badge-edahabia">💳 {t('checkoutEdahabia')}</span>
            <div className="w-px h-4 bg-brand-border"></div>
            <span className="badge-cib">🏦 {t('checkoutCIB')}</span>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-brand-border mt-2 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
          <p className="text-brand-brownLight text-center md:text-right">
            © {new Date().getFullYear()} Créateur DZ — {t('footerRights')}
          </p>
          <p className="text-brand-brownLight flex items-center justify-center gap-2">
            {t('footerMadeIn')}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
