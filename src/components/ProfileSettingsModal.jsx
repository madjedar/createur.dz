import React, { useState, useEffect } from 'react';
import { X, Save, User, Phone, MapPin, AtSign, PlayCircle, Share2, Globe, DollarSign, Briefcase, Camera } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../lib/supabase';

const wilayas = [
  "Adrar", "Chlef", "Laghouat", "Oum El Bouaghi", "Batna", "Béjaïa", "Biskra", "Béchar", "Blida", "Bouira",
  "Tamanrasset", "Tébessa", "Tlemcen", "Tiaret", "Tizi Ouzou", "Alger", "Djelfa", "Jijel", "Sétif", "Saïda",
  "Skikda", "Sidi Bel Abbès", "Annaba", "Guelma", "Constantine", "Médéa", "Mostaganem", "M'Sila", "Mascara", "Ouargla",
  "Oran", "El Bayadh", "Illizi", "Bordj Bou Arréridj", "Boumerdès", "El Tarf", "Tindouf", "Tissemsilt", "El Oued", "Khenchela",
  "Souk Ahras", "Tipaza", "Mila", "Aïn Defla", "Naâma", "Aïn Témouchent", "Ghardaïa", "Relizane", "Timimoun", "Bordj Badji Mokhtar",
  "Ouled Djellal", "Béni Abbès", "In Salah", "In Guezzam", "Touggourt", "Djanet", "El M'Ghair", "El Meniaa"
];

const translations = {
  ar: {
    profileSettings: 'إعدادات الملف الشخصي',
    basicInfo: 'المعلومات الأساسية',
    socialLinks: 'روابط التواصل الاجتماعي',
    save: 'حفظ',
    saving: 'جاري الحفظ...',
    saved: 'تم الحفظ!',
    fullName: 'الاسم الكامل',
    brandName: 'اسم العلامة التجارية',
    bio: 'النبذة التعريفية (Bio)',
    category: 'الفئة',
    location: 'الولاية',
    phone: 'رقم الهاتف',
    ratePerPost: 'السعر لكل منشور',
    avatarUrl: 'رابط الصورة الشخصية',
    enterYour: 'أدخل',
    cancel: 'إلغاء',
    websiteUrl: 'رابط الموقع',
    tiktok: 'تيك توك',
  },
  fr: {
    profileSettings: 'Paramètres du profil',
    basicInfo: 'Informations de base',
    socialLinks: 'Réseaux sociaux',
    save: 'Enregistrer',
    saving: 'Enregistrement...',
    saved: 'Enregistré !',
    fullName: 'Nom complet',
    brandName: 'Nom de la marque',
    bio: 'Bio',
    category: 'Catégorie',
    location: 'Wilaya',
    phone: 'Téléphone',
    ratePerPost: 'Tarif par publication',
    avatarUrl: 'URL de l\'avatar',
    enterYour: 'Entrez votre',
    cancel: 'Annuler',
    websiteUrl: 'Site web',
    tiktok: 'TikTok',
  },
  en: {
    profileSettings: 'Profile Settings',
    basicInfo: 'Basic Information',
    socialLinks: 'Social Links',
    save: 'Save',
    saving: 'Saving...',
    saved: 'Saved!',
    fullName: 'Full Name',
    brandName: 'Brand Name',
    bio: 'Bio',
    category: 'Category',
    location: 'Wilaya',
    phone: 'Phone',
    ratePerPost: 'Rate per Post',
    avatarUrl: 'Avatar URL',
    enterYour: 'Enter your',
    cancel: 'Cancel',
    websiteUrl: 'Website URL',
    tiktok: 'TikTok',
  }
};

const ProfileSettingsModal = ({ isOpen, onClose, isMandatory = false }) => {
  const { user, profile, updateProfileData } = useAuth();
  const { language } = useLanguage();
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: '',
    brand_name: '',
    bio: '',
    category: '',
    wilaya: '',
    phone: '',
    avatar_url: '',
    rate_per_post: '',
    instagram_url: '',
    tiktok_url: '',
    youtube_url: '',
    facebook_url: '',
    website_url: ''
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const tLocal = translations[language] || translations.en;
  
  useEffect(() => {
    if (isOpen && profile) {
      setFormData({
        full_name: profile.full_name || '',
        brand_name: profile.brand_name || '',
        bio: profile.bio || '',
        category: profile.category || '',
        wilaya: profile.wilaya || '',
        phone: profile.phone || '',
        avatar_url: profile.avatar_url || '',
        rate_per_post: profile.rate_per_post || '',
        instagram_url: profile.instagram_url || '',
        tiktok_url: profile.tiktok_url || '',
        youtube_url: profile.youtube_url || '',
        facebook_url: profile.facebook_url || '',
        website_url: profile.website_url || ''
      });
    }
  }, [isOpen, profile]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && !isMandatory) onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose, isMandatory]);

  const isMounted = React.useRef(true);
  
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  if (!isOpen) return null;

  const handleAvatarUpload = async (e) => {
    try {
      if (!e.target.files || e.target.files.length === 0) return;
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;
      
      setUploading(true);
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);
        
      if (uploadError) throw uploadError;
      
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
        
      setFormData(prev => ({ ...prev, avatar_url: data.publicUrl }));
    } catch (error) {
      console.error(error);
      alert('Error uploading avatar!');
    } finally {
      setUploading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isMandatory) {
      if (!formData.full_name || !formData.phone || !formData.wilaya) {
        alert(isRTL ? "يرجى ملء جميع الحقول المطلوبة (الاسم، الهاتف، الولاية)" : "Please fill all required fields (Name, Phone, Wilaya)");
        return;
      }
    }

    setIsSaving(true);
    
    try {
      if (updateProfileData) {
        await updateProfileData(formData);
      }
      if (isMounted.current) {
        setShowSuccess(true);
        setTimeout(() => {
          if (isMounted.current) {
            setShowSuccess(false);
            onClose();
          }
        }, 1000);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      if (isMounted.current) {
        setIsSaving(false);
      }
    }
  };

  const isCreator = profile?.role === 'creator';
  const isBrand = profile?.role === 'brand';
  const isRTL = language === 'ar';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div 
        className={`relative w-full max-w-2xl my-auto overflow-hidden bg-brand-cream border border-brand-border rounded-[24px] animate-scale-in flex flex-col max-h-[90vh] shadow-xl ${isRTL ? 'text-right' : 'text-left'}`}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-brand-border bg-white">
          <div>
            <h2 className="text-xl font-black text-brand-brown tracking-wide">
              {tLocal.profileSettings}
            </h2>
            {isMandatory && (
              <p className="text-brand-orange mt-1 font-bold text-xs">
                يرجى إكمال ملفك الشخصي للمتابعة (الاسم الكامل مطلوب)
              </p>
            )}
          </div>
          {!isMandatory && (
            <button 
              onClick={onClose}
              className="p-2 text-brand-brownLight hover:text-brand-brown hover:bg-brand-brown/5 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-brand-border p-6 bg-brand-cream/30">
          <form id="profile-settings-form" onSubmit={handleSubmit} className="space-y-8">
            
            {/* Basic Info Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-black text-brand-brown mb-4 border-b border-brand-border pb-2">
                {tLocal.basicInfo}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold text-brand-brown mb-1.5 flex items-center gap-2">
                    <User size={16} className="text-brand-orange" />
                    {tLocal.fullName}
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    className="w-full bg-white border border-brand-border rounded-[16px] px-4 py-3 text-brand-brown font-medium placeholder-brand-brownLight/50 focus:border-brand-orange focus:ring-1 focus:ring-brand-orange outline-none transition-all text-sm shadow-sm"
                    placeholder={`${tLocal.enterYour} ${tLocal.fullName}`}
                  />
                </div>

                {isBrand && (
                  <div>
                    <label className="text-sm font-bold text-brand-brown mb-1.5 flex items-center gap-2">
                      <Briefcase size={16} className="text-brand-orange" />
                      {tLocal.brandName}
                    </label>
                    <input
                      type="text"
                      name="brand_name"
                      value={formData.brand_name}
                      onChange={handleChange}
                      className="w-full bg-white border border-brand-border rounded-[16px] px-4 py-3 text-brand-brown font-medium placeholder-brand-brownLight/50 focus:border-brand-orange focus:ring-1 focus:ring-brand-orange outline-none transition-all text-sm shadow-sm"
                      placeholder={`${tLocal.enterYour} ${tLocal.brandName}`}
                    />
                  </div>
                )}
                
                <div>
                  <label className="text-sm font-bold text-brand-brown mb-1.5 flex items-center gap-2">
                    <Camera size={16} className="text-brand-orange" />
                    {tLocal.avatarUrl}
                  </label>
                  <div className="flex items-center gap-3">
                    {formData.avatar_url && (
                      <img src={formData.avatar_url} alt="Avatar" className="w-12 h-12 rounded-full object-cover border border-brand-border shadow-sm" />
                    )}
                    <label className="cursor-pointer bg-white hover:bg-[#FAFAFA] border border-brand-border rounded-[16px] px-4 py-3 text-brand-brown transition-all text-sm flex-1 text-center font-bold shadow-sm">
                      {uploading ? 'جاري الرفع...' : 'اختر صورة من جهازك'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        disabled={uploading}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-bold text-brand-brown mb-1.5 flex items-center gap-2">
                    <Phone size={16} className="text-brand-orange" />
                    {tLocal.phone}
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full bg-white border border-brand-border rounded-[16px] px-4 py-3 text-brand-brown font-medium placeholder-brand-brownLight/50 focus:border-brand-orange focus:ring-1 focus:ring-brand-orange outline-none transition-all text-sm shadow-sm"
                    placeholder="05..."
                    dir="ltr"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-bold text-brand-brown mb-1.5 flex items-center gap-2">
                    <MapPin size={16} className="text-brand-orange" />
                    {tLocal.location}
                  </label>
                  <select
                    name="wilaya"
                    value={formData.wilaya}
                    onChange={handleChange}
                    className="w-full bg-white border border-brand-border rounded-[16px] px-4 py-3 text-brand-brown font-medium placeholder-brand-brownLight/50 focus:border-brand-orange focus:ring-1 focus:ring-brand-orange outline-none transition-all text-sm appearance-none shadow-sm"
                  >
                    <option value="">--</option>
                    {wilayas.map((w, i) => (
                      <option key={i} value={w}>{`${i + 1} - ${w}`}</option>
                    ))}
                  </select>
                </div>
                
                {isCreator && (
                  <div>
                    <label className="text-sm font-bold text-brand-brown mb-1.5 flex items-center gap-2">
                      <DollarSign size={16} className="text-brand-orange" />
                      {tLocal.ratePerPost}
                    </label>
                    <input
                      type="number"
                      name="rate_per_post"
                      value={formData.rate_per_post}
                      onChange={handleChange}
                      className="w-full bg-white border border-brand-border rounded-[16px] px-4 py-3 text-brand-brown font-medium placeholder-brand-brownLight/50 focus:border-brand-orange focus:ring-1 focus:ring-brand-orange outline-none transition-all text-sm shadow-sm font-mono"
                      placeholder="DZD"
                      dir="ltr"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-bold text-brand-brown mb-1.5 flex items-center gap-2">
                  <User size={16} className="text-brand-orange" />
                  {tLocal.bio}
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows={4}
                  className="w-full bg-white border border-brand-border rounded-[16px] px-4 py-3 text-brand-brown font-medium placeholder-brand-brownLight/50 focus:border-brand-orange focus:ring-1 focus:ring-brand-orange outline-none transition-all text-sm resize-none shadow-sm"
                  placeholder={`${tLocal.enterYour} ${tLocal.bio}`}
                />
              </div>
            </div>

            {/* Social Links Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-black text-brand-brown mb-4 border-b border-brand-border pb-2">
                {tLocal.socialLinks}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold text-brand-brown mb-1.5 flex items-center gap-2">
                    <AtSign size={16} className="text-brand-orange" />
                    Instagram
                  </label>
                  <input
                    type="url"
                    name="instagram_url"
                    value={formData.instagram_url}
                    onChange={handleChange}
                    className="w-full bg-white border border-brand-border rounded-[16px] px-4 py-3 text-brand-brown font-medium placeholder-brand-brownLight/50 focus:border-brand-orange focus:ring-1 focus:ring-brand-orange outline-none transition-all text-sm shadow-sm"
                    placeholder="https://instagram.com/..."
                    dir="ltr"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-bold text-brand-brown mb-1.5 flex items-center gap-2">
                    <span className="font-bold text-brand-brown text-xs">TikTok</span>
                    {tLocal.tiktok}
                  </label>
                  <input
                    type="url"
                    name="tiktok_url"
                    value={formData.tiktok_url}
                    onChange={handleChange}
                    className="w-full bg-white border border-brand-border rounded-[16px] px-4 py-3 text-brand-brown font-medium placeholder-brand-brownLight/50 focus:border-brand-orange focus:ring-1 focus:ring-brand-orange outline-none transition-all text-sm shadow-sm"
                    placeholder="https://tiktok.com/@..."
                    dir="ltr"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-bold text-brand-brown mb-1.5 flex items-center gap-2">
                    <PlayCircle size={16} className="text-brand-orange" />
                    YouTube
                  </label>
                  <input
                    type="url"
                    name="youtube_url"
                    value={formData.youtube_url}
                    onChange={handleChange}
                    className="w-full bg-white border border-brand-border rounded-[16px] px-4 py-3 text-brand-brown font-medium placeholder-brand-brownLight/50 focus:border-brand-orange focus:ring-1 focus:ring-brand-orange outline-none transition-all text-sm shadow-sm"
                    placeholder="https://youtube.com/..."
                    dir="ltr"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-bold text-brand-brown mb-1.5 flex items-center gap-2">
                    <Share2 size={16} className="text-brand-orange" />
                    Facebook
                  </label>
                  <input
                    type="url"
                    name="facebook_url"
                    value={formData.facebook_url}
                    onChange={handleChange}
                    className="w-full bg-white border border-brand-border rounded-[16px] px-4 py-3 text-brand-brown font-medium placeholder-brand-brownLight/50 focus:border-brand-orange focus:ring-1 focus:ring-brand-orange outline-none transition-all text-sm shadow-sm"
                    placeholder="https://facebook.com/..."
                    dir="ltr"
                  />
                </div>

                {isBrand && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-bold text-brand-brown mb-1.5 flex items-center gap-2">
                      <Globe size={16} className="text-brand-orange" />
                      {tLocal.websiteUrl}
                    </label>
                    <input
                      type="url"
                      name="website_url"
                      value={formData.website_url}
                      onChange={handleChange}
                      className="w-full bg-white border border-brand-border rounded-[16px] px-4 py-3 text-brand-brown font-medium placeholder-brand-brownLight/50 focus:border-brand-orange focus:ring-1 focus:ring-brand-orange outline-none transition-all text-sm shadow-sm"
                      placeholder="https://..."
                      dir="ltr"
                    />
                  </div>
                )}
              </div>
            </div>
            
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-brand-border bg-white flex justify-end gap-3">
          {!isMandatory && (
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-[16px] font-bold text-brand-brownLight hover:text-brand-brown bg-brand-cream border border-brand-border hover:bg-[#FAFAFA] transition-all"
            >
              {tLocal.cancel}
            </button>
          )}
          <button
            type="submit"
            form="profile-settings-form"
            disabled={isSaving || showSuccess}
            className={`btn-primary px-6 py-3 rounded-[16px] font-bold flex items-center gap-2 ${
              isSaving || showSuccess ? 'opacity-75 cursor-not-allowed' : ''
            }`}
          >
            <Save size={18} />
            {showSuccess ? tLocal.saved : isSaving ? tLocal.saving : tLocal.save}
          </button>
        </div>

      </div>
    </div>
  );
};

export default ProfileSettingsModal;
