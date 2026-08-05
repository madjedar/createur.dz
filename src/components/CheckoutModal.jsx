import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Lock, CreditCard, CheckCircle, Loader2, Landmark } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { calculateFees, formatDZD, createCheckoutSession } from '../services/chargilyService';

export default function CheckoutModal({ isOpen, onClose, creator, campaign }) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('edahabia');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const baseAmount = campaign?.budget || 25000;
  const { platformFee, total } = calculateFees(baseAmount);

  const handlePay = async () => {
    if (!agreed) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await createCheckoutSession({
        ...campaign,
        amount: total,
        paymentMethod
      });
      
      if (result.success && result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      } else {
        setError(result.error || t('checkoutError'));
      }
    } catch (err) {
      setError(err.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay bg-slate-950/80 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="relative w-full max-w-lg p-6 overflow-hidden modal-content bg-slate-900 border border-white/10 rounded-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        <button 
          onClick={onClose}
          className="absolute text-slate-400 top-4 left-4 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {success ? (
          <div className="flex flex-col items-center justify-center py-10 text-center animate-fade-in-up">
            <CheckCircle className="w-16 h-16 text-emerald-500 mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">{t('checkoutSuccessTitle')}</h2>
            <p className="text-slate-400">{t('checkoutSuccessDesc')}</p>
          </div>
        ) : (
          <>
            <h2 className="mb-6 text-2xl font-bold text-white">{t('checkoutTitle')}</h2>

            {/* Deal Summary */}
            <div className="p-4 mb-6 glass-card rounded-xl">
              <h3 className="mb-2 font-semibold text-white text-lg">{campaign?.title || 'حملة إعلانية'}</h3>
              <p className="text-sm text-slate-400 mb-3">مع: <span className="text-slate-200">{creator?.name || 'صانع محتوى'}</span></p>
              <div className="flex flex-wrap gap-2">
                {(campaign?.deliverables || ['منشور إنستغرام', 'قصة (Story)']).map((item, idx) => (
                  <span key={idx} className="px-2 py-1 text-xs rounded-md bg-white/5 text-slate-300 border border-white/5">
                    {item}
                  </span>
                ))}
              </div>
            </div>

            {/* Fee Breakdown */}
            <div className="p-4 mb-6 rounded-xl bg-slate-800/50 border border-white/5 space-y-3">
              <div className="flex justify-between items-center text-slate-300">
                <span>تكلفة الحملة:</span>
                <span>{formatDZD(baseAmount)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>رسوم الضمان (Escrow):</span>
                <span>{formatDZD(platformFee)}</span>
              </div>
              <div className="pt-3 mt-3 border-t border-white/10 flex justify-between items-center">
                <span className="font-bold text-white">المجموع الإجمالي:</span>
                <span className="text-xl font-bold gradient-text">{formatDZD(total)}</span>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="mb-6">
              <h3 className="mb-3 text-sm font-medium text-slate-300">اختر طريقة الدفع:</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setPaymentMethod('edahabia')}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${paymentMethod === 'edahabia' ? 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/50' : 'border-white/10 hover:border-amber-500/50 bg-white/5'}`}
                >
                  <CreditCard className={`w-8 h-8 mb-2 ${paymentMethod === 'edahabia' ? 'text-amber-500' : 'text-slate-400'}`} />
                  <span className={`font-semibold ${paymentMethod === 'edahabia' ? 'text-amber-500' : 'text-slate-300'}`}>البطاقة الذهبية</span>
                </button>
                <button
                  onClick={() => setPaymentMethod('cib')}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${paymentMethod === 'cib' ? 'border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/50' : 'border-white/10 hover:border-blue-500/50 bg-white/5'}`}
                >
                  <Landmark className={`w-8 h-8 mb-2 ${paymentMethod === 'cib' ? 'text-blue-500' : 'text-slate-400'}`} />
                  <span className={`font-semibold ${paymentMethod === 'cib' ? 'text-blue-500' : 'text-slate-300'}`}>بطاقة CIB</span>
                </button>
              </div>
            </div>

            {/* Escrow Flow Visual */}
            <div className="mb-6 relative">
              <div className="absolute top-1/2 left-4 right-4 h-[2px] bg-white/10 -translate-y-1/2 z-0"></div>
              <div className="relative z-10 flex justify-between gap-2">
                <div className="flex-1 p-2 text-center rounded-lg glass-card">
                  <div className="w-8 h-8 mx-auto mb-1 bg-slate-800 rounded-full flex items-center justify-center border border-white/10">💰</div>
                  <span className="text-[10px] text-slate-300 block">{t('checkoutStep1')}</span>
                </div>
                <div className="flex-1 p-2 text-center rounded-lg glass-card border-blue-500/30">
                  <div className="w-8 h-8 mx-auto mb-1 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center border border-blue-500/50">🔒</div>
                  <span className="text-[10px] text-slate-300 block">{t('checkoutStep2')}</span>
                </div>
                <div className="flex-1 p-2 text-center rounded-lg glass-card">
                  <div className="w-8 h-8 mx-auto mb-1 bg-slate-800 rounded-full flex items-center justify-center border border-white/10">✅</div>
                  <span className="text-[10px] text-slate-300 block">{t('checkoutStep3')}</span>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 mb-4 text-sm text-red-200 bg-red-500/20 border border-red-500/30 rounded-lg">
                {error}
              </div>
            )}

            {/* Terms Checkbox */}
            <label className="flex items-start gap-3 mb-6 cursor-pointer group">
              <div className="relative flex items-center pt-1">
                <input 
                  type="checkbox" 
                  className="w-5 h-5 transition-all border-2 rounded bg-slate-900 border-slate-600 checked:bg-amber-500 checked:border-amber-500 focus:ring-amber-500/50 focus:ring-offset-slate-900 cursor-pointer appearance-none"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                />
                <CheckCircle className={`absolute inset-0 w-5 h-5 text-slate-900 pointer-events-none transition-opacity ${agreed ? 'opacity-100' : 'opacity-0'}`} />
              </div>
              <span className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
                {t('checkoutTerms')}
              </span>
            </label>

            {/* Pay Button */}
            <button
              onClick={handlePay}
              disabled={!agreed || loading}
              className={`w-full py-3.5 rounded-xl font-bold flex items-center justify-center transition-all ${
                !agreed 
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-900 shadow-lg shadow-amber-500/25'
              }`}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>{t('checkoutPayBtn')} — {formatDZD(total)}</>
              )}
            </button>

            {/* Security Badge */}
            <div className="flex items-center justify-center gap-2 mt-4 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>معاملات مالية آمنة ومشفّرة 100% (بطاقة الذهبية / CIB)</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
