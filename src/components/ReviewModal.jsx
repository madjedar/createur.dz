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
    <div className="modal-overlay flex items-center justify-center p-4 z-50 fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="modal-content glass-card max-w-md w-full p-6 relative animate-scale-in"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 left-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {submitted ? (
          <div className="flex flex-col items-center justify-center py-12 animate-scale-in text-center">
            <CheckCircle className="w-16 h-16 text-emerald-400 mb-4 animate-bounce" />
            <h3 className="text-xl font-bold text-white mb-2">{t('reviewThanks')}</h3>
            <p className="text-slate-400">تم إرسال تقييمك بنجاح</p>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-white mb-6">{t('reviewTitle')}</h2>
            
            {creator && (
              <div className="glass-card p-4 flex items-center gap-4 mb-6">
                <img src={creator.avatar || 'https://via.placeholder.com/50'} alt={creator.name} className="w-12 h-12 rounded-full object-cover" />
                <div>
                  <h4 className="text-white font-semibold">{creator.name}</h4>
                  <p className="text-sm text-slate-400">{creator.category}</p>
                </div>
              </div>
            )}

            <div className="flex justify-center gap-1 mb-6" dir="ltr">
              {[1, 2, 3, 4, 5].map((index) => {
                const isActive = index <= (hoveredStar || rating);
                return (
                  <button
                    key={index}
                    type="button"
                    className="focus:outline-none transition-transform hover:scale-110"
                    onMouseEnter={() => setHoveredStar(index)}
                    onMouseLeave={() => setHoveredStar(0)}
                    onClick={() => setRating(index)}
                  >
                    <Star 
                      className={`w-8 h-8 ${isActive ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`} 
                    />
                  </button>
                );
              })}
            </div>

            <textarea
              className="input-field w-full mb-6 resize-none"
              rows={4}
              placeholder={t('reviewPlaceholder')}
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
            />

            <button
              onClick={handleSubmit}
              disabled={rating === 0}
              className={`btn-primary w-full py-3 ${rating === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
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
