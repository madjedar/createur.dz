export const getLocalizedItem = (item, field, lang = 'ar') => {
  if (!item || !item[field]) return '';
  if (typeof item[field] === 'string') return item[field];
  return item[field][lang] || item[field]['ar'] || item[field]['fr'] || item[field]['en'] || '';
};

export const mockCreators = [
  {
    id: '1',
    name: 'أمين بن عمر',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=amine',
    bio: {
      ar: 'صانع محتوى تقني متخصص في مراجعات الهواتف والتكنولوجيا. أكثر من 500 ألف متابع على يوتيوب.',
      fr: 'Créateur de contenu tech spécialisé dans les tests de smartphones et la technologie. Plus de 500k abonnés YouTube.',
      en: 'Tech content creator specialized in smartphone reviews and technology. Over 500k YouTube subscribers.'
    },
    category: {
      ar: 'تكنولوجيا',
      fr: 'Technologie',
      en: 'Technology'
    },
    location: {
      ar: 'الجزائر العاصمة',
      fr: 'Alger',
      en: 'Algiers'
    },
    rating: 4.8,
    reviewCount: 124,
    ratePerPost: 25000,
    followers: { youtube: 520000, instagram: 180000, tiktok: 340000 },
    engagement: 4.2,
    completedDeals: 38,
    socialLinks: {
      youtube: 'https://youtube.com/@amine',
      instagram: 'https://instagram.com/amine',
      tiktok: 'https://tiktok.com/@amine',
    },
    tags: ['تكنولوجيا', 'مراجعات', 'هواتف'],
    verified: true,
  },
  {
    id: '2',
    name: 'سارة مزياني',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sara',
    bio: {
      ar: 'مؤثرة في مجال الجمال والموضة. أشارك نصائح العناية بالبشرة ومكياج يومي مع جمهور نسائي واسع.',
      fr: 'Influenceuse beauté et mode. Je partage des conseils soins de la peau et maquillage quotidien.',
      en: 'Beauty and fashion influencer. Sharing skincare tips and daily makeup routines with a large audience.'
    },
    category: {
      ar: 'تجميل وعناية',
      fr: 'Beauté & Soins',
      en: 'Beauty & Skincare'
    },
    location: {
      ar: 'وهران',
      fr: 'Oran',
      en: 'Oran'
    },
    rating: 4.9,
    reviewCount: 98,
    ratePerPost: 30000,
    followers: { youtube: 280000, instagram: 450000, tiktok: 620000 },
    engagement: 5.8,
    completedDeals: 52,
    socialLinks: {
      youtube: 'https://youtube.com/@sara',
      instagram: 'https://instagram.com/sara',
      tiktok: 'https://tiktok.com/@sara',
    },
    tags: ['جمال', 'موضة', 'عناية'],
    verified: true,
  },
  {
    id: '3',
    name: 'يوسف حداد',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=youcef',
    bio: {
      ar: 'طبّاخ ومدوّن طعام جزائري. أقدم وصفات تقليدية وعصرية من المطبخ الجزائري والعالمي.',
      fr: 'Chef et blogueur culinaire algérien. Je propose des recettes traditionnelles et modernes.',
      en: 'Algerian chef and food blogger. Providing traditional and modern culinary recipes.'
    },
    category: {
      ar: 'طبخ وأكل',
      fr: 'Cuisine & Restauration',
      en: 'Food & Cooking'
    },
    location: {
      ar: 'قسنطينة',
      fr: 'Constantine',
      en: 'Constantine'
    },
    rating: 4.7,
    reviewCount: 76,
    ratePerPost: 20000,
    followers: { youtube: 150000, instagram: 220000, tiktok: 410000 },
    engagement: 6.1,
    completedDeals: 29,
    socialLinks: {
      youtube: 'https://youtube.com/@youcef',
      instagram: 'https://instagram.com/youcef',
      tiktok: 'https://tiktok.com/@youcef',
    },
    tags: ['طبخ', 'وصفات', 'طعام جزائري'],
    verified: true,
  },
  {
    id: '4',
    name: 'نور الهدى بلقاسمي',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=nour',
    bio: {
      ar: 'خبيرة في التنمية الذاتية والتطوير الشخصي. أساعد الشباب الجزائري على تحقيق أهدافهم وتطوير مهاراتهم.',
      fr: 'Experte en développement personnel. J\'aide la jeunesse algérienne à atteindre ses objectifs.',
      en: 'Personal development coach helping Algerian youth achieve their professional and personal goals.'
    },
    category: {
      ar: 'تكنولوجيا',
      fr: 'Services & Conseils',
      en: 'Coaching & Education'
    },
    location: {
      ar: 'عنابة',
      fr: 'Annaba',
      en: 'Annaba'
    },
    rating: 4.6,
    reviewCount: 89,
    ratePerPost: 18000,
    followers: { youtube: 95000, instagram: 310000, tiktok: 280000 },
    engagement: 7.3,
    completedDeals: 21,
    socialLinks: {
      youtube: 'https://youtube.com/@nour',
      instagram: 'https://instagram.com/nour',
      tiktok: 'https://tiktok.com/@nour',
    },
    tags: ['تنمية ذاتية', 'تحفيز', 'تطوير'],
    verified: false,
  },
  {
    id: '5',
    name: 'كريم بوعلام',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=karim',
    bio: {
      ar: 'مصور فوتوغرافي ومخرج فيديو. أوثّق جمال الطبيعة والثقافة الجزائرية من الشمال إلى الصحراء.',
      fr: 'Photographe et vidéaste. Je documente la beauté de l\'Algérie du nord au Sahara.',
      en: 'Photographer and videographer documenting Algeria\'s beauty from the north coast to the Sahara.'
    },
    category: {
      ar: 'سفر وسياحة',
      fr: 'Voyage & Tourisme',
      en: 'Travel & Tourism'
    },
    location: {
      ar: 'تمنراست',
      fr: 'Tamanrasset',
      en: 'Tamanrasset'
    },
    rating: 4.9,
    reviewCount: 56,
    ratePerPost: 35000,
    followers: { youtube: 200000, instagram: 380000, tiktok: 190000 },
    engagement: 5.4,
    completedDeals: 18,
    socialLinks: {
      youtube: 'https://youtube.com/@karim',
      instagram: 'https://instagram.com/karim',
      tiktok: 'https://tiktok.com/@karim',
    },
    tags: ['تصوير', 'سفر', 'طبيعة'],
    verified: true,
  },
  {
    id: '6',
    name: 'ليلى عيساوي',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=leila',
    bio: {
      ar: 'أم ومدوّنة حياة عائلية. أشارك تجربتي في التربية والموضوعات المنزلية ونصائح للأمهات.',
      fr: 'Maman et blogueuse lifestyle familial. Je partage mon expérience et astuces quotidiennes.',
      en: 'Mom and family lifestyle blogger sharing parenting advice and home management tips.'
    },
    category: {
      ar: 'موضة وأزياء',
      fr: 'Style de vie',
      en: 'Lifestyle'
    },
    location: {
      ar: 'سطيف',
      fr: 'Sétif',
      en: 'Setif'
    },
    rating: 4.5,
    reviewCount: 112,
    ratePerPost: 15000,
    followers: { youtube: 120000, instagram: 290000, tiktok: 510000 },
    engagement: 8.2,
    completedDeals: 44,
    socialLinks: {
      youtube: 'https://youtube.com/@leila',
      instagram: 'https://instagram.com/leila',
      tiktok: 'https://tiktok.com/@leila',
    },
    tags: ['عائلة', 'أمومة', 'تربية'],
    verified: true,
  },
  {
    id: '7',
    name: 'رضا مهري',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=reda',
    bio: {
      ar: 'لاعب ألعاب إلكترونية ومعلق رياضي. بث مباشر يومي وتحليلات للألعاب التنافسية.',
      fr: 'Gamer et streamer e-sport. LIVES quotidiens et analyses de jeux compétitifs.',
      en: 'Esports gamer and streamer. Daily live streams and competitive gaming analysis.'
    },
    category: {
      ar: 'رياضة ولياقة',
      fr: 'Gaming & Sport',
      en: 'Gaming & Sports'
    },
    location: {
      ar: 'البليدة',
      fr: 'Blida',
      en: 'Blida'
    },
    rating: 4.4,
    reviewCount: 67,
    ratePerPost: 22000,
    followers: { youtube: 380000, instagram: 95000, tiktok: 470000 },
    engagement: 3.9,
    completedDeals: 25,
    socialLinks: {
      youtube: 'https://youtube.com/@reda',
      instagram: 'https://instagram.com/reda',
      tiktok: 'https://tiktok.com/@reda',
    },
    tags: ['ألعاب', 'رياضة', 'بث مباشر'],
    verified: false,
  },
  {
    id: '8',
    name: 'فاطمة الزهراء بن يحيى',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=fatima',
    bio: {
      ar: 'صانعة محتوى تعليمي. أقدم دروس في اللغة الإنجليزية والفرنسية للطلاب والمهنيين.',
      fr: 'Créatrice de contenu éducatif. Cours d\'anglais et de français pour étudiants et pros.',
      en: 'Educational content creator providing English and French lessons for students and pros.'
    },
    category: {
      ar: 'تكنولوجيا',
      fr: 'Éducation',
      en: 'Education'
    },
    location: {
      ar: 'تلمسان',
      fr: 'Tlemcen',
      en: 'Tlemcen'
    },
    rating: 4.8,
    reviewCount: 203,
    ratePerPost: 12000,
    followers: { youtube: 650000, instagram: 140000, tiktok: 320000 },
    engagement: 9.1,
    completedDeals: 33,
    socialLinks: {
      youtube: 'https://youtube.com/@fatima',
      instagram: 'https://instagram.com/fatima',
      tiktok: 'https://tiktok.com/@fatima',
    },
    tags: ['تعليم', 'لغات', 'دروس'],
    verified: true,
  },
];

export const mockCampaigns = [
  {
    id: 'c1',
    brand: 'Djezzy',
    brandLogo: '📱',
    title: {
      ar: 'حملة إطلاق باقة 5G الجديدة',
      fr: 'Campagne de lancement du nouveau forfait 5G',
      en: 'New 5G Package Launch Campaign'
    },
    description: {
      ar: 'نبحث عن صنّاع محتوى تقني لتغطية إطلاق شبكة 5G في الجزائر العاصمة.',
      fr: 'Nous recherchons des créateurs tech pour couvrir le lancement de la 5G à Alger.',
      en: 'Looking for tech creators to cover the 5G launch in Algiers.'
    },
    budget: 50000,
    category: {
      ar: 'تكنولوجيا',
      fr: 'Technologie',
      en: 'Technology'
    },
    deadline: '2026-09-15',
    deliverables: {
      ar: ['فيديو يوتيوب (5-10 دقائق)', 'ستوري انستغرام (3 قصص)', 'منشور تيك توك'],
      fr: ['Vidéo YouTube (5-10 min)', 'Stories Instagram (3 stories)', 'Post TikTok'],
      en: ['YouTube Video (5-10 min)', 'Instagram Stories (3 stories)', 'TikTok Post']
    },
    status: 'active',
    applicants: 12,
  },
  {
    id: 'c2',
    brand: 'Hamoud Boualem',
    brandLogo: '🥤',
    title: {
      ar: 'حملة ترويجية — مشروبات حمود بوعلام',
      fr: 'Campagne promotionnelle — Boissons Hamoud Boualem',
      en: 'Promotional Campaign — Hamoud Boualem Beverages'
    },
    description: {
      ar: 'محتوى إبداعي يبرز المنتجات الجزائرية مع مشروبات حمود بوعلام الأصيلة.',
      fr: 'Contenu créatif mettant en valeur les boissons authentiques Hamoud Boualem.',
      en: 'Creative content highlighting authentic Hamoud Boualem beverages.'
    },
    budget: 35000,
    category: {
      ar: 'طبخ وأكل',
      fr: 'Cuisine & Restauration',
      en: 'Food & Cooking'
    },
    deadline: '2026-09-01',
    deliverables: {
      ar: ['فيديو وصفة مع المنتج', 'صور احترافية (5 صور)', 'ريلز انستغرام'],
      fr: ['Vidéo recette avec produit', 'Photos pro (5 photos)', 'Reel Instagram'],
      en: ['Recipe video with product', 'Pro photos (5 photos)', 'Instagram Reel']
    },
    status: 'active',
    applicants: 8,
  },
  {
    id: 'c3',
    brand: 'Ooredoo',
    brandLogo: '📶',
    title: {
      ar: 'برنامج سفراء Ooredoo للشباب',
      fr: 'Programme Ambassadeurs Ooredoo Jeunesse',
      en: 'Ooredoo Youth Ambassador Program'
    },
    description: {
      ar: 'برنامج سفراء مستمر لمدة 3 أشهر لإنشاء محتوى حول خدمات Ooredoo الرقمية.',
      fr: 'Programme d\'ambassadeurs de 3 mois pour promouvoir les services digitaux Ooredoo.',
      en: '3-month ambassador program to create content around Ooredoo digital services.'
    },
    budget: 80000,
    category: {
      ar: 'تكنولوجيا',
      fr: 'Technologie',
      en: 'Technology'
    },
    deadline: '2026-10-01',
    deliverables: {
      ar: ['4 فيديوهات يوتيوب شهرياً', 'تغطية أحداث حصرية', 'محتوى تيك توك أسبوعي'],
      fr: ['4 vidéos YouTube/mois', 'Couverture d\'événements', 'Contenu TikTok hebdomadaire'],
      en: ['4 YouTube videos/month', 'Event coverage', 'Weekly TikTok content']
    },
    status: 'active',
    applicants: 24,
  },
];

export const mockDashboardStats = {
  totalCampaigns: 12,
  activeCampaigns: 3,
  totalRevenue: 285000,
  pendingRevenue: 65000,
  totalFollowers: 1240000,
  engagementRate: 5.7,
  completedDeals: 38,
  averageRating: 4.7,
};

export const mockWallet = {
  availableBalance: 142500,
  pendingEscrow: 65000,
  totalEarned: 285000,
};

export const mockTransactions = [
  {
    id: 't1',
    date: '2026-08-01',
    description: 'حملة Djezzy — إطلاق 5G',
    amount: 50000,
    fee: 5000,
    method: 'edahabia',
    status: 'released',
    brand: 'Djezzy',
  },
  {
    id: 't2',
    date: '2026-07-28',
    description: 'حملة Hamoud Boualem',
    amount: 35000,
    fee: 3500,
    method: 'cib',
    status: 'escrow_funded',
    brand: 'Hamoud Boualem',
  },
];

export const mockPayoutRequests = [
  {
    id: 'p1',
    date: '2026-08-02',
    amount: 100000,
    rip: '007999990001234567890',
    method: 'baridimob',
    status: 'completed',
  },
];

export const mockNotifications = [
  { id: 'n1', type: 'payment', message: 'تم تمويل الضمان بنجاح — حملة Djezzy', time: 'منذ ساعة', read: false },
];

export const categories = [
  'الكل',
  'تكنولوجيا',
  'موضة وأزياء',
  'تجميل وعناية',
  'طبخ وأكل',
  'سفر وسياحة',
  'رياضة ولياقة',
];
