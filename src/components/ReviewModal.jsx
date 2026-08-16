import React, { useState, useEffect } from 'react';
import { X, Star, CheckCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const ReviewModal = ({ isOpen, onClose, creator }) => {
  const { t } = useLanguage();
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const isMounted = React.useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      setSubmitted(false);
      setRating(0);
      setReviewText('');
      setHoveredStar(0);
      document.addEventListener('keydown', handleEscape);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    try {
      const { addReview } = await import('../services/dbService');
      if (creator?.id) {
        await addReview(creator.id, rating, reviewText);
      }
    } catch (err) {
      console.error('Failed to save review:', err);
    }

    if (isMounted.current) {
      setSubmitted(true);
      setTimeout(() => {
        if (isMounted.current) {
          setSubmitted(false);
          setRating(0);
          setReviewText('');
          onClose();
        }
      }, 2000);
    }
  };

  return (
    <div 
      className="modal-overlay flex items-center justify-center p-4 z-50 fixed inset-0 bg-black/60 backdrop-blur-sm overflow-y-auto" 
      onClick={onClose}
    >
      <div 
        className="modal-content bg-white border border-brand-border rounded-[32px] max-w-md w-full my-auto p-6 sm:p-8 relative animate-scale-in max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        <button 
          onClick={onClose}
          className="absolute top-5 left-5 text-brand-brownLight hover:text-brand-brown hover:bg-brand-cream p-2 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="flex flex-col items-center justify-center py-10 animate-scale-in text-center">
            <CheckCircle className="w-16 h-16 text-emerald-500 mb-4 animate-bounce" />
            <h3 className="text-xl font-bold text-brand-brown mb-2">{t('reviewThanks')}</h3>
            <p className="text-brand-brownLight text-sm">تم إرسال تقييمك بنجاح لمساعدة المجتمع</p>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-black text-brand-brown mb-5">{t('reviewTitle')}</h2>
            
            {creator && (
              <div className="bg-brand-cream border border-brand-border rounded-2xl p-4 flex items-center gap-3 mb-6">
                <img src={creator.avatar || 'https://via.placeholder.com/50'} alt={creator.name} className="w-12 h-12 rounded-full object-cover border border-brand-border" />
                <div>
                  <h4 className="text-brand-brown font-bold">{creator.name}</h4>
                  <p className="text-xs text-brand-brownLight">{creator.category}</p>
                </div>
              </div>
            )}

            <div className="flex justify-center gap-2 mb-6" dir="ltr">
              {[1, 2, 3, 4, 5].map((index) => {
                const isActive = index <= (hoveredStar || rating);
                return (
                  <button
                    key={index}
                    type="button"
                    className="focus:outline-none transition-transform hover:scale-110 p-1"
                    onMouseEnter={() => setHoveredStar(index)}
                    onMouseLeave={() => setHoveredStar(0)}
                    onClick={() => setRating(index)}
                  >
                    <Star 
                      className={`w-8 h-8 ${isActive ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} 
                    />
                  </button>
                );
              })}
            </div>

            <textarea
              className="input-field w-full mb-6 resize-none text-xs"
              rows={4}
              placeholder={t('reviewPlaceholder')}
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
            />

            <button
              onClick={handleSubmit}
              disabled={rating === 0}
              className={`btn-primary w-full py-3.5 font-bold shadow-md shadow-brand-orange/20 ${rating === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              إرسال التقييم
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ReviewModal;
