export type Lang = 'ar' | 'en';

const ar = {
  dir: 'rtl',
  topbar: { area: 'متاح الآن في محافظة الشرقية', hours: 'خدمة على مدار الساعة 24/7', support: 'الدعم واتساب' },
  nav: { home: 'الرئيسية', about: 'من نحن', services: 'الخدمات', how: 'كيف نعمل', nurses: 'انضم كممرض', faq: 'الأسئلة', contact: 'تواصل معنا', login: 'دخول', book: 'اطلب ممرض الآن' },
  toggles: { dark: 'الوضع الليلي', light: 'الوضع النهاري', lang: 'English' },
  hero: {
    badge: 'منصة تمريض منزلي موثوقة',
    title1: 'ممرضك الأمين',
    title2: 'لحد باب بيتك',
    subtitle: 'اطلب ممرض أو ممرضة معتمدة في دقائق: غيار على الجروح، حقن ومحاليل بوصفة طبية، قياس الضغط والسكر، رعاية كبار السن وما بعد العمليات — وتابع الوصول خطوة بخطوة.',
    cta: 'اطلب خدمة تمريض',
    urgent: 'طلب عاجل',
    trust: ['ممرضون معتمدون', 'دفع إلكتروني آمن', 'متابعة لحظية'],
    phone: { onTheWay: 'الممرضة في الطريق', eta: 'الوصول خلال 8 دقائق', nurse: 'ممرضة معتمدة', service: 'غيار على الجروح', total: 'الإجمالي', track: 'تتبع الطلب', steps: ['تم القبول', 'في الطريق', 'وصلت'] },
    float: { accepted: 'تم قبول طلبك', rating: 'تقييم 4.9', paid: 'دفع آمن عبر كاشير' },
  },
  stats: { services: 'خدمة تمريضية', governorates: 'مدينة ومركز نخدمها', nurses: 'ممرض معتمد', completed: 'خدمة مكتملة', support: 'دعم متواصل', verified: 'ممرضون موثقون' },
  why: {
    kicker: 'لماذا MOBI-NURSE؟',
    title: 'رعاية تمريضية باحترافية… وراحة بال لأسرتك',
    lead: 'نجمع بين ممرضين مؤهلين ومنصة ذكية تختار لك الأقرب والأعلى تقييماً، مع أسعار واضحة ودفع آمن.',
    cards: [
      { t: 'ممرضون موثقون', d: 'نراجع البطاقة الشخصية وترخيص مزاولة المهنة لكل ممرض قبل التفعيل.' },
      { t: 'أقرب ممرض لك', d: 'نظام ترشيح ذكي يختار الأقرب والأعلى تقييماً ويرسل الطلب فوراً.' },
      { t: 'سعر واضح ودفع آمن', d: 'تعرف السعر قبل التأكيد، وتدفع بعد الخدمة بالبطاقة أو المحفظة عبر كاشير.' },
    ],
  },
  about: {
    kicker: 'من نحن',
    title: 'نُعيد الرعاية التمريضية إلى دفء البيت',
    text: 'MOBI-NURSE منصة مصرية تربط الأسر بممرضين وممرضات معتمدين لتقديم خدمات التمريض المنزلي المسموح بها قانوناً، بأعلى معايير الأمان والخصوصية.',
    points: [
      { t: 'زيارات منزلية مرنة', d: 'اطلب الآن أو حدد موعداً يناسبك خلال 30 يوماً.' },
      { t: 'رعاية مخصصة للأسرة', d: 'أضف أفراد أسرتك واطلب لهم الخدمة بضغطة.' },
      { t: 'خصوصية وأمان', d: 'بياناتك ومستندات الممرضين محمية ولا تُشارك إلا عند الحاجة.' },
    ],
  },
  services: { kicker: 'خدماتنا', title: 'خدمات تمريض منزلي متكاملة', lead: 'اختر الخدمة، وسنرسل لك أقرب ممرض مؤهل.', from: 'السعر', order: 'اطلب', all: 'كل الخدمات', currency: 'ج.م', empty: 'سيتم إضافة الخدمات قريباً.' },
  how: {
    kicker: 'كيف نعمل',
    title: 'أربع خطوات بسيطة',
    steps: [
      { t: 'اختر الخدمة', d: 'حدد الخدمة والمريض ووصفاً مختصراً للحالة.' },
      { t: 'حدد موقعك', d: 'نحدد موقعك تلقائياً وتراه على خرائط جوجل.' },
      { t: 'ممرض في الطريق', d: 'يقبل أقرب ممرض طلبك وتتابع وصوله لحظة بلحظة.' },
      { t: 'ادفع وقيّم', d: 'بعد انتهاء الخدمة ادفع إلكترونياً وقيّم التجربة.' },
    ],
  },
  emergency: { title: 'حالة تحتاج ممرضاً في أسرع وقت؟', text: 'اطلب ممرضاً عاجلاً بدون تسجيل حساب. للحالات الحرجة اتصل بالإسعاف فوراً على 123.', cta: 'طلب تمريض عاجل', call: 'اتصل بالإسعاف 123' },
  join: {
    kicker: 'للممرضين والممرضات',
    title: 'انضم لفريق MOBI-NURSE وزوّد دخلك',
    points: ['استقبل طلبات قريبة منك وقت ما تكون متاح', 'ربحك واضح قبل قبول أي طلب', 'محفظة إلكترونية وسحب على فودافون كاش أو إنستاباي', 'تقييمات تبني سمعتك المهنية'],
    cta: 'سجّل كمقدم خدمة',
  },
  app: { kicker: 'التطبيق', title: 'كل الخدمة في جيبك', text: 'حمّل تطبيق MOBI-NURSE على أندرويد واستقبل إشعارات حالة طلبك لحظياً، أو استخدم الموقع مباشرة من أي متصفح.', apk: 'تحميل تطبيق أندرويد', web: 'استخدم من المتصفح' },
  faq: {
    kicker: 'الأسئلة الشائعة',
    title: 'إجابات سريعة',
    items: [
      { q: 'في أي مناطق تتوفر الخدمة؟', a: 'الخدمة متاحة حالياً في محافظة الشرقية، ونعمل على التوسع لباقي المحافظات قريباً.' },
      { q: 'كيف أتأكد أن الممرض مؤهل؟', a: 'كل ممرض يرفع البطاقة الشخصية وترخيص مزاولة المهنة، وتراجعها الإدارة قبل تفعيل الحساب. ويمكنك رؤية تقييمه وعدد خدماته.' },
      { q: 'متى وكيف أدفع؟', a: 'تدفع بعد انتهاء الخدمة إلكترونياً عبر كاشير بالبطاقات أو المحافظ الإلكترونية، والسعر يظهر لك قبل تأكيد الطلب.' },
      { q: 'هل يمكن إلغاء الطلب؟', a: 'نعم، مجاناً أثناء البحث عن ممرض أو قبل وصوله.' },
      { q: 'هل تُعطى الحقن والمحاليل بدون روشتة؟', a: 'لا. أي إجراء يتطلب أمراً طبياً يتم فقط بوجود وصفة طبية سارية من الطبيب.' },
      { q: 'هل الخدمة بديل عن الإسعاف؟', a: 'لا. في الحالات الحرجة اتصل بالإسعاف 123 فوراً. الطلب العاجل مخصص للحالات غير الحرجة.' },
    ],
  },
  contact: { kicker: 'تواصل معنا', title: 'نحن هنا لمساعدتك', whatsapp: 'واتساب الدعم', whatsappD: 'رد سريع على استفساراتك', area: 'مناطق الخدمة', areaD: 'محافظة الشرقية — مصر', hours: 'مواعيد العمل', hoursD: 'طوال أيام الأسبوع على مدار الساعة', cta: 'راسلنا على واتساب' },
  footer: { about: 'منصة تمريض منزلي تربط الأسر بممرضين معتمدين لحد باب البيت.', links: 'روابط سريعة', services: 'الخدمات', policies: 'السياسات', rights: 'جميع الحقوق محفوظة', emergency: 'الخدمة ليست بديلاً عن الإسعاف — في الحالات الحرجة اتصل بـ 123',
    policyNames: { terms: 'الشروط والأحكام', privacy: 'سياسة الخصوصية', 'nurse-terms': 'شروط مقدمي الخدمة', payment: 'سياسة الدفع', cancellation: 'سياسة الإلغاء', 'healthcare-disclaimer': 'إخلاء المسؤولية الطبية', emergency: 'تنبيه الطوارئ' } },
  policies: { title: 'السياسات والشروط', updated: 'آخر تحديث' },
};

const en: typeof ar = {
  dir: 'ltr',
  topbar: { area: 'Now available in Sharqia Governorate', hours: '24/7 service', support: 'WhatsApp support' },
  nav: { home: 'Home', about: 'About', services: 'Services', how: 'How it works', nurses: 'Join as a nurse', faq: 'FAQ', contact: 'Contact', login: 'Sign in', book: 'Book a nurse' },
  toggles: { dark: 'Dark mode', light: 'Light mode', lang: 'العربية' },
  hero: {
    badge: 'Trusted home-nursing platform',
    title1: 'Your trusted nurse,',
    title2: 'right to your door',
    subtitle: 'Book a verified nurse in minutes — wound dressing, prescribed injections and IV drips, blood pressure & glucose checks, elderly and post-operative care — and follow the arrival step by step.',
    cta: 'Book a nursing service',
    urgent: 'Urgent request',
    trust: ['Verified nurses', 'Secure online payment', 'Live tracking'],
    phone: { onTheWay: 'Your nurse is on the way', eta: 'Arriving in 8 min', nurse: 'Verified nurse', service: 'Wound dressing', total: 'Total', track: 'Track request', steps: ['Accepted', 'On the way', 'Arrived'] },
    float: { accepted: 'Request accepted', rating: 'Rated 4.9', paid: 'Secure pay via Kashier' },
  },
  stats: { services: 'Nursing services', governorates: 'Cities & districts served', nurses: 'Verified nurses', completed: 'Completed visits', support: 'Support', verified: 'Verified nurses' },
  why: {
    kicker: 'Why MOBI-NURSE?',
    title: 'Professional nursing care… and peace of mind',
    lead: 'Qualified nurses plus a smart platform that picks the nearest, best-rated one for you — with clear prices and secure payment.',
    cards: [
      { t: 'Verified nurses', d: 'We review the national ID and practice license of every nurse before activation.' },
      { t: 'Nearest nurse to you', d: 'Smart matching offers your request to the nearest, best-rated nurses instantly.' },
      { t: 'Clear price, secure pay', d: 'See the price before confirming and pay after the visit by card or e-wallet via Kashier.' },
    ],
  },
  about: {
    kicker: 'About us',
    title: 'Bringing nursing care back to the warmth of home',
    text: 'MOBI-NURSE is an Egyptian platform connecting families with verified nurses for legally permitted home-nursing services, with the highest standards of safety and privacy.',
    points: [
      { t: 'Flexible home visits', d: 'Book now or schedule a time within the next 30 days.' },
      { t: 'Care for the whole family', d: 'Add family members and book for them in one tap.' },
      { t: 'Privacy & security', d: 'Your data and nurses’ documents are protected and shared only when needed.' },
    ],
  },
  services: { kicker: 'Our services', title: 'Complete home-nursing services', lead: 'Pick a service and we’ll send the nearest qualified nurse.', from: 'Price', order: 'Book', all: 'All services', currency: 'EGP', empty: 'Services will be added soon.' },
  how: {
    kicker: 'How it works',
    title: 'Four simple steps',
    steps: [
      { t: 'Choose a service', d: 'Select the service, the patient and a short case description.' },
      { t: 'Set your location', d: 'We detect your location automatically — check it on Google Maps.' },
      { t: 'Nurse on the way', d: 'The nearest nurse accepts and you follow the arrival live.' },
      { t: 'Pay & rate', d: 'After the visit, pay online and rate your experience.' },
    ],
  },
  emergency: { title: 'Need a nurse as soon as possible?', text: 'Request an urgent nurse without an account. For critical emergencies call the ambulance on 123 immediately.', cta: 'Urgent nursing request', call: 'Call ambulance 123' },
  join: {
    kicker: 'For nurses',
    title: 'Join MOBI-NURSE and grow your income',
    points: ['Receive nearby requests whenever you are available', 'See your earnings before accepting', 'E-wallet with withdrawals to Vodafone Cash or InstaPay', 'Ratings that build your professional reputation'],
    cta: 'Register as a provider',
  },
  app: { kicker: 'The app', title: 'Care in your pocket', text: 'Get the MOBI-NURSE Android app for live notifications about your request, or use the website from any browser.', apk: 'Download Android app', web: 'Use in browser' },
  faq: {
    kicker: 'FAQ',
    title: 'Quick answers',
    items: [
      { q: 'Where is the service available?', a: 'Currently in Sharqia Governorate, expanding to more governorates soon.' },
      { q: 'How do I know the nurse is qualified?', a: 'Every nurse uploads a national ID and practice license reviewed by our team before activation. You can also see their rating and completed visits.' },
      { q: 'When and how do I pay?', a: 'After the visit, online via Kashier by card or e-wallet. The price is shown before you confirm.' },
      { q: 'Can I cancel?', a: 'Yes, free of charge while searching or before the nurse arrives.' },
      { q: 'Are injections given without a prescription?', a: 'No. Any procedure requiring a medical order is done only with a valid doctor’s prescription.' },
      { q: 'Is this a replacement for an ambulance?', a: 'No. In critical emergencies call 123 immediately. Urgent requests are for non-critical cases.' },
    ],
  },
  contact: { kicker: 'Contact', title: 'We’re here to help', whatsapp: 'WhatsApp support', whatsappD: 'Fast replies to your questions', area: 'Service area', areaD: 'Sharqia Governorate — Egypt', hours: 'Working hours', hoursD: '7 days a week, around the clock', cta: 'Message us on WhatsApp' },
  footer: { about: 'A home-nursing platform connecting families with verified nurses, right to their door.', links: 'Quick links', services: 'Services', policies: 'Policies', rights: 'All rights reserved', emergency: 'Not a replacement for an ambulance — in critical emergencies call 123',
    policyNames: { terms: 'Terms of Service', privacy: 'Privacy Policy', 'nurse-terms': 'Nurse Terms', payment: 'Payment Policy', cancellation: 'Cancellation Policy', 'healthcare-disclaimer': 'Healthcare Disclaimer', emergency: 'Emergency Notice' } },
  policies: { title: 'Policies & terms', updated: 'Last updated' },
};

export const DICT = { ar, en };
export type Dict = typeof ar;
export function t(lang: Lang): Dict { return DICT[lang]; }
