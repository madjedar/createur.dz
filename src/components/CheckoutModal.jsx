import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Lock, CreditCard, CheckCircle, Loader2, Landmark, Smartphone } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { calculateFees, formatDZD, createCheckoutSession } from '../services/chargilyService';

export default function CheckoutModal({ isOpen, onClose, creator, campaign, applicationId }) {
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

  useEffect(() => {
    if (isOpen) {
      setAgreed(false);
      setSuccess(false);
      setError(null);
      setPaymentMethod('edahabia');
      setLoading(false);
    }
  }, [isOpen]);

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
        // Bug #3 fix: Approve application before redirecting to payment
        if (applicationId) {
          const { updateApplicationStatus } = await import('../services/dbService');
          await updateApplicationStatus(applicationId, 'approved');
        }
        window.location.href = result.checkoutUrl;
      } else if (result.success && !result.checkoutUrl) {
        // Bug #3 fix: Approve application on direct success
        if (applicationId) {
          const { updateApplicationStatus } = await import('../services/dbService');
          await updateApplicationStatus(applicationId, 'approved');
        }
        setSuccess(true);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay" onClick={onClose}>
      <div 
        className="relative w-full max-w-lg p-6 overflow-hidden modal-content rounded-[32px] bg-white shadow-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        <button 
          onClick={onClose}
          className="absolute text-brand-brownLight top-4 left-4 hover:text-brand-brown hover:bg-brand-cream p-2 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {success ? (
          <div className="flex flex-col items-center justify-center py-10 text-center animate-fade-in-up">
            <CheckCircle className="w-16 h-16 text-brand-orange mb-4" />
            <h2 className="text-2xl font-bold text-brand-brown mb-2">{t('checkoutSuccessTitle') || 'تم الدفع بنجاح!'}</h2>
            <p className="text-brand-brownLight mb-6">{t('checkoutSuccessDesc') || 'تم حجز المبلغ في حساب الضمان (Escrow). يمكنك الآن متابعة العمل مع صانع المحتوى.'}</p>
            <button
              onClick={onClose}
              className="btn-primary px-8 py-3 rounded-full font-bold"
            >
              متابعة
            </button>
          </div>
        ) : (
          <>
            <h2 className="mb-6 text-2xl font-bold text-brand-brown">{t('checkoutTitle')}</h2>

            {/* Deal Summary */}
            <div className="p-4 mb-6 bg-brand-cream border border-brand-border rounded-2xl">
              <h3 className="mb-2 font-semibold text-brand-brown text-lg">{campaign?.title || 'حملة إعلانية'}</h3>
              <p className="text-sm text-brand-brownLight mb-3">مع: <span className="text-brand-brown">{creator?.name || 'صانع محتوى'}</span></p>
              <div className="flex flex-wrap gap-2">
                {(campaign?.deliverables || ['منشور إنستغرام', 'قصة (Story)']).map((item, idx) => (
                  <span key={idx} className="px-3 py-1 text-xs rounded-full bg-white text-brand-brownLight border border-brand-border shadow-sm">
                    {item}
                  </span>
                ))}
              </div>
            </div>

            {/* Fee Breakdown */}
            <div className="p-4 mb-6 rounded-2xl bg-brand-cream border border-brand-border space-y-3">
              <div className="flex justify-between items-center text-brand-brownLight">
                <span>تكلفة الحملة:</span>
                <span className="font-medium text-brand-brown">{formatDZD(baseAmount)}</span>
              </div>
              <div className="flex justify-between items-center text-brand-brownLight">
                <span>رسوم الضمان (Escrow):</span>
                <span className="font-medium text-brand-brown">{formatDZD(platformFee)}</span>
              </div>
              <div className="pt-3 mt-3 border-t border-brand-border flex justify-between items-center">
                <span className="font-bold text-brand-brown">المجموع الإجمالي:</span>
                <span className="text-xl font-black text-brand-orange">{formatDZD(total)}</span>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="mb-6">
              <h3 className="mb-3 text-sm font-medium text-brand-brownLight">اختر طريقة الدفع:</h3>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setPaymentMethod('edahabia')}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all shadow-sm ${paymentMethod === 'edahabia' ? 'border-brand-orange bg-brand-orange/10 ring-2 ring-brand-orange/20 scale-[1.02]' : 'border-brand-border hover:border-brand-orange/50 bg-white hover:bg-brand-cream'}`}
                >
                  <CreditCard className={`w-8 h-8 mb-2 ${paymentMethod === 'edahabia' ? 'text-brand-orange' : 'text-brand-brownLight'}`} />
                  <span className={`font-semibold text-sm ${paymentMethod === 'edahabia' ? 'text-brand-orange' : 'text-brand-brownLight'}`}>البطاقة الذهبية</span>
                </button>
                <button
                  onClick={() => setPaymentMethod('baridimob')}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all shadow-sm ${paymentMethod === 'baridimob' ? 'border-brand-orange bg-brand-orange/10 ring-2 ring-brand-orange/20 scale-[1.02]' : 'border-brand-border hover:border-brand-orange/50 bg-white hover:bg-brand-cream'}`}
                >
                  <Smartphone className={`w-8 h-8 mb-2 ${paymentMethod === 'baridimob' ? 'text-brand-orange' : 'text-brand-brownLight'}`} />
                  <span className={`font-semibold text-sm ${paymentMethod === 'baridimob' ? 'text-brand-orange' : 'text-brand-brownLight'}`}>بريدي موب</span>
                </button>
                <button
                  onClick={() => setPaymentMethod('cib')}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all shadow-sm ${paymentMethod === 'cib' ? 'border-brand-orange bg-brand-orange/10 ring-2 ring-brand-orange/20 scale-[1.02]' : 'border-brand-border hover:border-brand-orange/50 bg-white hover:bg-brand-cream'}`}
                >
                  <Landmark className={`w-8 h-8 mb-2 ${paymentMethod === 'cib' ? 'text-brand-orange' : 'text-brand-brownLight'}`} />
                  <span className={`font-semibold text-sm ${paymentMethod === 'cib' ? 'text-brand-orange' : 'text-brand-brownLight'}`}>بطاقة CIB</span>
                </button>
              </div>
            </div>

            {/* Escrow Flow Visual */}
            <div className="mb-6 relative">
              <div className="absolute top-1/2 left-4 right-4 h-[2px] bg-brand-border -translate-y-1/2 z-0"></div>
              <div className="relative z-10 flex justify-between gap-2">
                <div className="flex-1 p-2 text-center rounded-2xl bg-white border border-brand-border shadow-sm">
                  <div className="w-8 h-8 mx-auto mb-1 bg-brand-cream rounded-full flex items-center justify-center">💰</div>
                  <span className="text-[10px] text-brand-brownLight font-medium block">{t('checkoutStep1')}</span>
                </div>
                <div className="flex-1 p-2 text-center rounded-2xl bg-white border border-brand-orange/50 shadow-sm ring-1 ring-brand-orange/20">
                  <div className="w-8 h-8 mx-auto mb-1 bg-brand-orange/10 text-brand-orange rounded-full flex items-center justify-center">🔒</div>
                  <span className="text-[10px] text-brand-brownLight font-medium block">{t('checkoutStep2')}</span>
                </div>
                <div className="flex-1 p-2 text-center rounded-2xl bg-white border border-brand-border shadow-sm">
                  <div className="w-8 h-8 mx-auto mb-1 bg-brand-cream rounded-full flex items-center justify-center">✅</div>
                  <span className="text-[10px] text-brand-brownLight font-medium block">{t('checkoutStep3')}</span>
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
                  className="w-5 h-5 transition-all border-2 rounded bg-white border-brand-border checked:bg-brand-orange checked:border-brand-orange focus:ring-brand-orange/50 cursor-pointer appearance-none"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                />
                <CheckCircle className={`absolute inset-0 w-5 h-5 text-white pointer-events-none transition-opacity ${agreed ? 'opacity-100' : 'opacity-0'}`} />
              </div>
              <span className="text-sm text-brand-brownLight group-hover:text-brand-brown transition-colors">
                {t('checkoutTerms')}
              </span>
            </label>

            {/* Pay Button */}
            <button
              onClick={handlePay}
              disabled={!agreed || loading}
              className={`btn-primary w-full py-3.5 rounded-full font-bold flex items-center justify-center transition-all ${
                !agreed 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'shadow-lg shadow-brand-orange/20'
              }`}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin text-white" />
              ) : (
                <>{t('checkoutPayBtn')} — {formatDZD(total)}</>
              )}
            </button>

            {/* Security Badge */}
            <div className="flex items-center justify-center gap-2 mt-4 text-xs text-brand-brownLight font-medium">
              <ShieldCheck className="w-4 h-4 text-green-500" />
              <span>معاملات مالية آمنة ومشفّرة 100% (بريدي موب / الذهبية / CIB)</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
