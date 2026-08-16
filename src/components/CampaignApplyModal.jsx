import React, { useState, useEffect } from 'react';
import { 
  X, Send, Sparkles, CheckCircle2, AlertCircle, 
  Building2, Calendar, DollarSign, Clock, Link as LinkIcon, ShieldCheck
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { formatDZD } from '../services/chargilyService';
import { getLocalizedItem } from '../data/mockData';

export default function CampaignApplyModal({ 
  isOpen, 
  onClose, 
  campaign, 
  onSuccess 
}) {
  const { user } = useAuth();
  const { t, language } = useLanguage();

  const [pitch, setPitch] = useState('');
  const [sampleUrl, setSampleUrl] = useState('');
  const [deliveryDays, setDeliveryDays] = useState('5');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPitch('');
      setSampleUrl('');
      setDeliveryDays('5');
      setErrorMessage('');
      setSuccess(false);
    }
  }, [isOpen, campaign]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen || !campaign) return null;

  const campaignTitle = getLocalizedItem(campaign, 'title', language) || campaign.title || 'حملة إعلانية';
  const campaignCategory = getLocalizedItem(campaign, 'category', language) || campaign.category || 'عام';
  const campaignDesc = getLocalizedItem(campaign, 'description', language) || campaign.description || '';
  const brandName = campaign.brand?.brand_name || campaign.brand?.full_name || campaign.brand_name || 'العلامة التجارية';
  const deliverables = campaign.deliverables 
    ? (Array.isArray(campaign.deliverables) ? campaign.deliverables : [campaign.deliverables])
    : ['منشور ترويجي', 'فيديو ريلز'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.id) return;
    if (!pitch.trim()) {
      setErrorMessage(t('pitchRequired') || 'يرجى كتابة رسالة التقديم (Pitch)');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    try {
      const { applyToCampaign, createNotification } = await import('../services/dbService');
      
      const pitchPayload = {
        pitch_text: pitch.trim(),
        portfolio_url: sampleUrl.trim() || null,
        delivery_days: Number(deliveryDays) || 5
      };

      await applyToCampaign(campaign.id, user.id, pitchPayload);

      // Send in-app notification to the brand owner
      if (campaign.brand_id) {
        await createNotification(
          campaign.brand_id,
          'طلب تقديم جديد على حملتك',
          `قام المبدع ${user?.profile?.full_name || user?.user_metadata?.full_name || 'صانع محتوى'} بالتقديم على حملتك "${campaignTitle}".`
        );
      }

      setSuccess(true);
      if (onSuccess) onSuccess(campaign);

      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err) {
      console.error('Error submitting campaign application:', err);
      if (err?.code === '23505') {
        setErrorMessage(t('alreadyApplied') || 'لقد قدمت على هذه الحملة مسبقاً');
      } else {
        setErrorMessage(err?.message || t('applicationError') || 'حدث خطأ أثناء إرسال طلب التقديم');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto" 
      dir="rtl"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-[32px] max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-brand-border animate-scale-in relative my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-5 left-5 p-2 text-brand-brownLight hover:text-brand-brown rounded-full hover:bg-brand-cream transition-colors"
          title={t('close')}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-brand-border">
          <div className="w-12 h-12 rounded-[16px] bg-brand-orange/10 text-brand-orange flex items-center justify-center font-bold shadow-inner">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-brand-brown">
              {t('applyModalTitle') || 'التقديم على الحملة الإعلانية'}
            </h3>
            <p className="text-xs font-medium text-brand-brownLight mt-0.5">
              {brandName} • {campaignCategory}
            </p>
          </div>
        </div>

        {/* Campaign Summary Card */}
        <div className="p-4 rounded-[20px] bg-brand-cream/80 border border-brand-border mb-6 space-y-2.5">
          <div className="flex justify-between items-start">
            <h4 className="font-black text-brand-brown text-sm">{campaignTitle}</h4>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-brand-orange text-white font-mono shadow-sm">
              {formatDZD(campaign.budget, language)}
            </span>
          </div>

          {campaignDesc && (
            <p className="text-xs text-brand-brownLight line-clamp-2 leading-relaxed">
              {campaignDesc}
            </p>
          )}

          <div className="pt-2 border-t border-brand-border/60 flex flex-wrap gap-1.5">
            {deliverables.map((deliv, idx) => (
              <span key={idx} className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white text-brand-brown border border-brand-border/60">
                ✓ {deliv}
              </span>
            ))}
          </div>
        </div>

        {/* Success State */}
        {success ? (
          <div className="p-8 text-center bg-emerald-50 rounded-[24px] border border-emerald-200 animate-scale-in">
            <CheckCircle2 className="w-14 h-14 text-emerald-600 mx-auto mb-3 animate-bounce" />
            <h4 className="font-black text-emerald-800 text-lg mb-1">تم إرسال طلبك بنجاح! 🎉</h4>
            <p className="text-emerald-700 text-xs">
              سيقوم صاحب المتجر بمراجعة عرضك والتواصل معك عبر المحادثات المباشرة.
            </p>
          </div>
        ) : (
          /* Application Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Pitch Textarea */}
            <div>
              <label className="block text-xs font-bold text-brand-brown mb-1.5">
                {t('pitchLabel') || 'رسالة التقديم (Pitch) *'}
              </label>
              <textarea
                rows={3}
                placeholder={t('pitchPlaceholder') || 'اشرح فكرتك للمحتوى، أسلوب التصوير، ولماذا منتجهم يناسب جمهورك...'}
                className="input-field w-full text-xs leading-relaxed"
                value={pitch}
                onChange={(e) => setPitch(e.target.value)}
                required
              />
            </div>

            {/* Sample Link */}
            <div>
              <label className="block text-xs font-bold text-brand-brown mb-1.5">
                {t('sampleLink') || 'رابط عمل سابق / ريلز مشابه (اختياري)'}
              </label>
              <div className="relative">
                <LinkIcon className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-brownLight" />
                <input
                  type="url"
                  placeholder="https://instagram.com/reel/example"
                  className="input-field w-full pr-10 text-xs font-mono text-left dir-ltr"
                  value={sampleUrl}
                  onChange={(e) => setSampleUrl(e.target.value)}
                />
              </div>
            </div>

            {/* Delivery Days Timeline */}
            <div>
              <label className="block text-xs font-bold text-brand-brown mb-1.5">
                {t('deliveryTimeline') || 'مدة التنفيذ والتسليم المقترحة'}
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { value: '3', label: '3 أيام' },
                  { value: '5', label: '5 أيام' },
                  { value: '7', label: '7 أيام' },
                  { value: '10', label: '10 أيام' }
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setDeliveryDays(option.value)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      deliveryDays === option.value
                        ? 'bg-brand-orange text-white border-brand-orange shadow-sm'
                        : 'bg-brand-cream/60 text-brand-brownLight border-brand-border hover:border-brand-orange/40'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Escrow Guarantee Pill */}
            <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/60 text-[11px] text-amber-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
              <span>ميزانية هذه الحملة مضمونة وتودع في حساب الضمان قبل بدء العمل.</span>
            </div>

            {/* Error message */}
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full py-3.5 text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-brand-orange/20 mt-2"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? (t('submitting') || 'جاري الإرسال...') : (t('sendApplication') || 'إرسال طلب التقديم')}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
