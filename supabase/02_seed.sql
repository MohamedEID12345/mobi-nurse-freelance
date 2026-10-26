-- =====================================================================
-- MOBI-NURSE — initial data (run once after 01_schema.sql)
-- Services/prices are SAMPLE data: edit, delete or add from the Admin Panel.
-- =====================================================================

insert into settings(key, value) values
  ('PLATFORM_COMMISSION_PERCENT',      '10'),
  ('NURSE_REGISTRATION_FEE',           '100'),
  ('MIN_WITHDRAWAL_AMOUNT',            '100'),
  ('MATCHING_RADIUS_KM',               '15'),
  ('MATCHING_BATCH_SIZE',              '5'),
  ('MATCHING_OFFER_TIMEOUT_SECONDS',   '60'),
  ('SEARCH_MAX_MINUTES',               '20'),
  ('NURSE_LOCATION_MAX_AGE_MINUTES',   '60'),
  ('SUPPORT_WHATSAPP',                 '201062569857'),
  ('ADMIN_WHATSAPP',                   '201062569857'),
  ('EMERGENCY_NUMBER',                 '123'),
  ('URGENT_REQUESTS_ENABLED',          'true');

insert into governorates (code, name_ar, name_en, is_active, sort_order, activated_at) values
('SHARQIA','الشرقية','Sharqia',true,1,now()),
('CAIRO','القاهرة','Cairo',false,2,null),
('GIZA','الجيزة','Giza',false,3,null),
('ALEXANDRIA','الإسكندرية','Alexandria',false,4,null),
('QALYUBIA','القليوبية','Qalyubia',false,5,null),
('DAKAHLIA','الدقهلية','Dakahlia',false,6,null),
('GHARBIA','الغربية','Gharbia',false,7,null),
('MONUFIA','المنوفية','Monufia',false,8,null),
('BEHEIRA','البحيرة','Beheira',false,9,null),
('KAFR_EL_SHEIKH','كفر الشيخ','Kafr El Sheikh',false,10,null),
('DAMIETTA','دمياط','Damietta',false,11,null),
('PORT_SAID','بورسعيد','Port Said',false,12,null),
('ISMAILIA','الإسماعيلية','Ismailia',false,13,null),
('SUEZ','السويس','Suez',false,14,null),
('FAIYUM','الفيوم','Faiyum',false,15,null),
('BENI_SUEF','بني سويف','Beni Suef',false,16,null),
('MINYA','المنيا','Minya',false,17,null),
('ASYUT','أسيوط','Asyut',false,18,null),
('SOHAG','سوهاج','Sohag',false,19,null),
('QENA','قنا','Qena',false,20,null),
('LUXOR','الأقصر','Luxor',false,21,null),
('ASWAN','أسوان','Aswan',false,22,null),
('RED_SEA','البحر الأحمر','Red Sea',false,23,null),
('NEW_VALLEY','الوادي الجديد','New Valley',false,24,null),
('MATROUH','مطروح','Matrouh',false,25,null),
('NORTH_SINAI','شمال سيناء','North Sinai',false,26,null),
('SOUTH_SINAI','جنوب سيناء','South Sinai',false,27,null);

insert into cities (governorate_id, name_ar, name_en, sort_order)
select g.id, c.name_ar, c.name_en, c.ord from governorates g cross join (values
  ('الزقازيق','Zagazig',1), ('العاشر من رمضان','10th of Ramadan',2), ('بلبيس','Belbeis',3),
  ('منيا القمح','Minya El Qamh',4), ('أبو حماد','Abu Hammad',5), ('أبو كبير','Abu Kebir',6),
  ('فاقوس','Faqous',7), ('ههيا','Hihya',8), ('ديرب نجم','Diyarb Negm',9), ('كفر صقر','Kafr Saqr',10),
  ('مشتول السوق','Mashtoul El Souk',11), ('الحسينية','El Husseiniya',12), ('أولاد صقر','Awlad Saqr',13),
  ('الإبراهيمية','El Ibrahimiya',14), ('القنايات','El Qanayat',15), ('القرين','El Qurein',16),
  ('الصالحية الجديدة','New Salhia',17), ('صان الحجر','San El Hagar',18)
) as c(name_ar, name_en, ord) where g.code = 'SHARQIA';

-- SAMPLE services & prices (EGP) — edit from Admin Panel → الخدمات
insert into services (name_ar, name_en, description_ar, description_en, price, duration_minutes, sort_order) values
('زيارة تمريض منزلية', 'Home nursing visit', 'زيارة تمريضية عامة بالمنزل لتقييم الحالة وتقديم الرعاية التمريضية الأساسية.', 'General home nursing visit and basic care.', 250, 60, 1),
('غيار على الجروح', 'Wound dressing', 'تنظيف وتطهير الجرح وتغيير الضمادات بأدوات معقمة.', 'Sterile wound cleaning and dressing change.', 200, 45, 2),
('قياس العلامات الحيوية', 'Vital signs check', 'قياس الحرارة والنبض والتنفس وضغط الدم ونسبة الأكسجين.', 'Temperature, pulse, respiration, BP and SpO2.', 120, 30, 3),
('قياس ضغط الدم', 'Blood pressure check', 'قياس ضغط الدم وتسجيل القراءة.', 'Blood pressure measurement.', 80, 20, 4),
('قياس السكر', 'Blood glucose check', 'قياس نسبة السكر في الدم بجهاز معتمد.', 'Blood glucose measurement.', 80, 20, 5),
('إعطاء حقنة بوصفة طبية', 'Prescribed injection', 'إعطاء حقنة عضل أو وريد حسب وصفة طبية سارية.', 'IM/IV injection per a valid prescription.', 100, 30, 6),
('تركيب كانيولا ومحلول بوصفة طبية', 'Cannula & IV drip (prescribed)', 'تركيب كانيولا ومتابعة محلول وريدي حسب وصفة طبية.', 'Cannula insertion and IV drip per prescription.', 300, 90, 7),
('رعاية كبار السن (4 ساعات)', 'Elderly care (4 hours)', 'رعاية تمريضية لكبار السن لمدة 4 ساعات تشمل المتابعة والمساعدة.', '4-hour nursing care for the elderly.', 450, 240, 8),
('رعاية ما بعد العمليات', 'Post-operative care', 'متابعة الحالة بعد العمليات والغيار وقياس العلامات الحيوية.', 'Post-operative follow-up and care.', 350, 60, 9),
('رعاية مريض طريح الفراش', 'Bedridden patient care', 'رعاية تمريضية للمرضى طريحي الفراش والوقاية من قرح الفراش.', 'Nursing care for bedridden patients.', 300, 60, 10),
('رعاية منزلية 12 ساعة', '12-hour home care', 'تواجد تمريضي بالمنزل لمدة 12 ساعة.', '12 hours of in-home nursing.', 900, 720, 11),
('رعاية ما بعد الخروج من المستشفى', 'Post-discharge care', 'متابعة تمريضية بعد الخروج من المستشفى وتنفيذ التعليمات الطبية.', 'Nursing follow-up after hospital discharge.', 300, 60, 12);

-- =====================================================================
-- Policies (editable from Admin Panel → الإعدادات → الصفحات)
-- =====================================================================
insert into content_pages (slug, title_ar, title_en, is_published, sort_order, body_ar, body_en) values
('terms', 'الشروط والأحكام', 'Terms of Service', true, 1,
$p$## 1. التعريفات
- **المنصة**: تطبيق وموقع MOBI-NURSE وجميع خدماتهما.
- **العميل**: كل شخص يطلب خدمة تمريض منزلي لنفسه أو لأحد أفراد أسرته، سواء بحساب أو كطلب عاجل بدون تسجيل.
- **مقدم الخدمة / الممرض**: الممرض أو الممرضة المسجل والمعتمد على المنصة بعد التحقق من مستنداته.
- **الخدمة**: خدمة التمريض المنزلي المسموح بها قانوناً والمعروضة في قائمة الخدمات.

## 2. طبيعة المنصة
- MOBI-NURSE منصة وسيطة إلكترونية تربط العملاء بممرضين مستقلين معتمدين، ولا تُعد منشأة طبية أو مستشفى.
- المنصة **ليست بديلاً عن الإسعاف أو الطوارئ**. في الحالات الحرجة يجب الاتصال بالإسعاف على **123** فوراً.
- لا يقدم الممرض تشخيصاً طبياً ولا يصف أدوية، ويلتزم بحدود الممارسة المهنية المسموح بها قانوناً.

## 3. التسجيل والحساب
- يجب أن تكون البيانات المسجلة صحيحة وكاملة، ورقم الموبايل هو المعرّف الأساسي للحساب.
- المستخدم مسؤول عن سرية كلمة المرور وعن أي نشاط يتم من خلال حسابه.
- يحق للمنصة إيقاف أو تعليق أي حساب يقدم بيانات غير صحيحة أو يسيء الاستخدام أو يخالف هذه الشروط.

## 4. طلب الخدمة
- يحدد العميل الخدمة والمريض والموقع والموعد ووصف الحالة، ويظهر له السعر النهائي قبل التأكيد.
- السعر تحدده المنصة فقط، ولا يحق للممرض تعديله أو طلب أي مبالغ إضافية خارج التطبيق.
- يجب أن يكون وصف الحالة صادقاً، وأي خدمة تتطلب وصفة طبية (مثل الحقن والمحاليل) لا تُنفذ إلا بوجود وصفة طبية سارية.
- يحق للممرض الاعتذار عن تنفيذ أي إجراء يراه خارج حدود ممارسته أو يمثل خطراً على المريض، مع توجيه العميل لطلب الرعاية المناسبة.

## 5. الدفع
- يتم الدفع إلكترونياً عبر بوابة الدفع المعتمدة (كاشير) بالبطاقات والمحافظ الإلكترونية المتاحة.
- لا تحتفظ المنصة بأي بيانات للبطاقات البنكية.
- تحصل المنصة على عمولة من قيمة كل خدمة مكتملة ومدفوعة وفقاً لما هو معلن لمقدمي الخدمة.
- تفاصيل الدفع والاسترداد موضحة في **سياسة الدفع** و**سياسة الإلغاء**.

## 6. التزامات العميل
- توفير بيئة آمنة ومحترمة للممرض، ووجود مرافق بالغ مع المريض عند الحاجة.
- عدم طلب خدمات غير مشروعة أو خارج نطاق التمريض.
- عدم التواصل مع الممرض للتعاقد خارج المنصة على طلبات تمت عبرها.

## 7. التقييمات والشكاوى
- يمكن للعميل تقييم الخدمة بعد الدفع، ويجب أن يكون التقييم صادقاً وغير مسيء.
- يمكن تقديم شكوى من داخل التطبيق، وتراجعها الإدارة وقد تتخذ إجراءات تصل إلى إيقاف الحساب.

## 8. حدود المسؤولية
- يقدم الممرض الخدمة بصفته المهنية المستقلة ويكون مسؤولاً مهنياً عن عمله وفقاً للقوانين المنظمة لمهنة التمريض.
- تبذل المنصة العناية الواجبة في التحقق من مستندات مقدمي الخدمة، ولا تتحمل مسؤولية الأضرار الناتجة عن معلومات غير صحيحة قدمها العميل أو عن الحالات الطارئة التي تتطلب تدخل الإسعاف.

## 9. التعديلات
- يحق للمنصة تعديل هذه الشروط، ويتم إعلان التعديلات داخل التطبيق، ويُعد الاستمرار في الاستخدام موافقة عليها.

## 10. القانون الواجب التطبيق
- تخضع هذه الشروط لقوانين جمهورية مصر العربية، وتختص المحاكم المصرية بنظر أي نزاع.

## 11. التواصل
- الدعم الفني عبر واتساب فقط: **+201062569857**$p$,
$p$## 1. The platform
MOBI-NURSE is an online marketplace connecting customers with independent, verified nurses for legally permitted home-nursing services. It is not a hospital and **not a replacement for emergency services** — call **123** in a critical emergency.

## 2. Accounts
Information must be accurate. You are responsible for your password and account activity. Accounts may be suspended for false data, misuse or breach of these terms.

## 3. Requests
The platform sets the price shown before confirmation; nurses cannot change it or charge outside the app. Procedures requiring a prescription are performed only with a valid prescription. Nurses may decline unsafe or out-of-scope procedures.

## 4. Payment
Payments are processed by Kashier (cards and e-wallets). Card data is never stored by MOBI-NURSE. The platform earns a commission on each completed, paid service.

## 5. Customer obligations
Provide a safe, respectful environment; do not request unlawful services; do not take platform bookings off-platform.

## 6. Reviews & complaints
Reviews must be honest. Complaints are reviewed by the administration, which may suspend accounts.

## 7. Liability
Nurses act in their independent professional capacity. The platform exercises due care in verifying documents and is not liable for harm caused by inaccurate information supplied by customers or for emergencies requiring ambulance care.

## 8. Changes & law
Terms may change with in-app notice. Egyptian law applies; Egyptian courts have jurisdiction.

## 9. Support
WhatsApp only: **+201062569857**$p$),

('privacy', 'سياسة الخصوصية', 'Privacy Policy', true, 2,
$p$## 1. البيانات التي نجمعها
- **بيانات الحساب**: الاسم، رقم الموبايل، المحافظة والمدينة والعنوان، وكلمة المرور (مخزنة مشفرة تشفيراً أحادياً ولا يمكن لأحد الاطلاع عليها).
- **بيانات الموقع**: موقعك الجغرافي عند طلب الخدمة لتحديد أقرب ممرض، وموقع الممرض أثناء الاتصال وأثناء التوجه للعميل فقط.
- **بيانات المريض**: اسم المريض وصلة القرابة وتاريخ الميلاد والنوع ووصف مختصر للحالة. نجمع الحد الأدنى فقط من المعلومات الصحية اللازمة لتقديم الخدمة.
- **بيانات مقدمي الخدمة**: صورة البطاقة الشخصية (وجه وظهر)، ترخيص مزاولة المهنة، المؤهل، الصورة الشخصية، وسنوات الخبرة.
- **بيانات الدفع**: رقم العملية والمبلغ والحالة فقط. **لا نخزن أرقام البطاقات أو CVV أو أي بيانات بنكية حساسة**؛ تتم معالجتها بالكامل لدى بوابة الدفع كاشير.

## 2. كيف نستخدم البيانات
- تنفيذ الطلبات ومطابقة العميل مع أقرب ممرض مؤهل.
- التحقق من هوية ومؤهلات مقدمي الخدمة.
- معالجة المدفوعات وحساب المستحقات والعمولات.
- إرسال الإشعارات الخاصة بالطلبات والحساب.
- تحسين جودة الخدمة ومراجعة الشكاوى ومنع الاحتيال.

## 3. مشاركة البيانات
- يرى الممرض المعين للطلب فقط: اسم العميل، اسم المريض، وصف الحالة، العنوان، رابط الموقع، ورقم التواصل، وذلك طوال فترة تنفيذ الطلب.
- يرى العميل اسم الممرض وصورته وتقييمه ورقم التواصل أثناء تنفيذ الطلب.
- لا نبيع بياناتك لأي طرف ثالث، ولا نشاركها إلا مع مزودي الخدمات التقنية اللازمين (الاستضافة، قواعد البيانات، الإشعارات، بوابة الدفع) أو عند طلب جهة قضائية أو رسمية مختصة.

## 4. حماية البيانات
- جميع الاتصالات مشفرة (HTTPS).
- مستندات الممرضين محفوظة في مساحة تخزين خاصة غير متاحة للعامة، ولا يطلع عليها إلا المسؤولون المخولون بالتحقق، ويتم تسجيل الوصول إليها.
- نطبق مبدأ الحد الأدنى من الصلاحيات داخل فريق الإدارة.

## 5. الموقع الجغرافي
- لا نتتبع الممرض عندما يكون غير متصل.
- يتم مشاركة موقع الممرض مع العميل فقط أثناء التوجه إليه وتنفيذ الطلب.

## 6. الاحتفاظ بالبيانات وحذفها
- نحتفظ بسجلات الطلبات والمدفوعات للمدة التي تتطلبها القوانين المحاسبية والضريبية.
- يمكنك طلب حذف حسابك عبر الدعم على واتساب، وسيتم حذف أو إخفاء بياناتك الشخصية مع الاحتفاظ بما يلزم قانوناً من السجلات المالية.

## 7. حقوقك
- الاطلاع على بياناتك وتصحيحها من داخل التطبيق.
- طلب حذف الحساب أو الاعتراض على معالجة بياناتك وفقاً لقانون حماية البيانات الشخصية المصري رقم 151 لسنة 2020.

## 8. التواصل
- لأي استفسار يخص الخصوصية: واتساب **+201062569857**$p$,
$p$## 1. Data we collect
Account data (name, phone, governorate, city, address, hashed password); location when requesting a service and the nurse's location only while online/en-route; minimal patient data (name, relation, birth date, gender, short case description); nurse verification documents (national ID, practice license, qualification, photo); payment references only — **we never store card numbers or CVV** (processed by Kashier).

## 2. Use
Fulfilling and matching requests, verifying nurses, processing payments and earnings, notifications, quality, complaints and fraud prevention.

## 3. Sharing
The assigned nurse sees the customer/patient details, address and contact for the duration of the job; the customer sees the nurse's name, photo, rating and contact. We never sell data. We share only with required technical providers or competent authorities.

## 4. Security
HTTPS everywhere; nurse documents in private storage visible only to authorized verification staff; least-privilege admin access.

## 5. Location
Nurses are not tracked while offline. Live location is shared only during an active job.

## 6. Retention & deletion
Booking and payment records are kept as required by accounting/tax law. Request account deletion via WhatsApp support.

## 7. Your rights
Access, correct and request deletion of your data under Egypt's Personal Data Protection Law No. 151 of 2020.

## 8. Contact
WhatsApp **+201062569857**$p$),

('nurse-terms', 'شروط مقدمي الخدمة', 'Nurse Terms', true, 3,
$p$## 1. شروط الانضمام
- أن يكون المتقدم ممرضاً أو ممرضة حاصلاً على مؤهل تمريض معتمد وترخيص مزاولة مهنة ساري.
- رفع صورة واضحة للبطاقة الشخصية (وجه وظهر) وترخيص المزاولة وصورة شخصية حديثة.
- سداد رسوم تفعيل الحساب (**100 جنيه** أو حسب ما تعلنه المنصة) مرة واحدة، وهي رسوم إدارية للتحقق والتفعيل ومنفصلة عن عمولة الخدمات.
- لا يتم تفعيل الحساب ولا استقبال الطلبات إلا بعد مراجعة واعتماد الإدارة. قد يتم رفض الطلب مع توضيح السبب وإمكانية إعادة رفع المستندات.
- رسوم التفعيل غير مستردة بعد بدء مراجعة المستندات، إلا إذا رُفض الطلب لسبب يرجع للمنصة.

## 2. العمولة والمستحقات
- تحصل المنصة على عمولة **10%** من قيمة كل خدمة مكتملة ومدفوعة (أو النسبة المعلنة وقت الطلب)، ويظهر صافي ربحك في كل طلب قبل قبوله.
- تُضاف مستحقاتك تلقائياً إلى محفظتك بعد تأكيد الدفع من بوابة الدفع.
- يمكنك طلب سحب الرصيد (فودافون كاش، إنستاباي، أو غيرها المتاحة) بحد أدنى تعلنه المنصة، وتتم مراجعة الطلب وتحويله من الإدارة.

## 3. الدفع نيابة عن العميل
- إذا لم تتوفر وسيلة دفع لدى العميل، يمكنك الدفع إلكترونياً نيابة عنه من داخل التطبيق، ويُسجل المبلغ كمديونية على العميل لصالحك.
- يُمنع تماماً تحصيل أي مبالغ إضافية أو خارج التطبيق.

## 4. السلوك المهني
- الالتزام بآداب وأخلاقيات مهنة التمريض والحفاظ على خصوصية المريض وسرية معلوماته.
- عدم تنفيذ أي إجراء خارج حدود الممارسة المسموح بها، وعدم إعطاء أي دواء أو حقن بدون وصفة طبية سارية.
- الالتزام بالمواعيد وارتداء زي مناسب واستخدام أدوات معقمة.
- في حال اكتشاف حالة طارئة حرجة: توجيه الأسرة فوراً للاتصال بالإسعاف 123.

## 5. حالة الاتصال والطلبات
- لا تستقبل الطلبات إلا وأنت **متصل**، ويُستخدم موقعك لترشيحك للطلبات القريبة فقط.
- قبول الطلب التزام بالحضور؛ تكرار الإلغاء بعد القبول يؤثر على ترتيبك وقد يؤدي لإيقاف الحساب.
- يجب تحديث حالة الطلب داخل التطبيق: في الطريق، وصلت، بدأت الخدمة، انتهت الخدمة.

## 6. الإيقاف والإنهاء
- يحق للإدارة إيقاف الحساب مؤقتاً أو نهائياً عند تكرار الشكاوى أو انخفاض التقييم أو مخالفة الشروط أو انتهاء صلاحية المستندات.

## 7. العلاقة القانونية
- يعمل مقدم الخدمة بصفة مستقلة، ولا تنشأ بينه وبين المنصة علاقة عمل أو تبعية، ويتحمل مسؤوليته المهنية والضريبية عن دخله.$p$,
$p$## 1. Joining
Licensed nurse with a valid practice license; upload national ID (front/back), license and a recent photo; pay a one-time activation fee (**EGP 100** or as announced), separate from service commission. Accounts receive requests only after admin approval. The fee is non-refundable once review starts, unless rejection is due to the platform.

## 2. Commission & earnings
The platform keeps **10%** of each completed, paid service (or the rate shown at booking). Net earnings are credited to your wallet after payment confirmation; withdrawals are reviewed and transferred by the administration above the announced minimum.

## 3. Paying on behalf of a customer
You may pay electronically on the customer's behalf; the amount is recorded as the customer's due to you. Collecting extra or off-app money is prohibited.

## 4. Conduct
Professional ethics, patient privacy, no out-of-scope procedures, no medication or injections without a valid prescription, punctuality, sterile tools. Direct critical emergencies to ambulance 123.

## 5. Online status
You receive requests only while online; your location is used only for nearby matching. Repeated cancellations after acceptance affect ranking and may lead to suspension. Update job status in the app.

## 6. Suspension
Accounts may be suspended for complaints, low ratings, violations or expired documents.

## 7. Relationship
Nurses are independent providers, not employees, and are responsible for their own professional and tax obligations.$p$),

('payment', 'سياسة الدفع', 'Payment Policy', true, 4,
$p$## 1. وسائل الدفع
- يتم الدفع إلكترونياً عبر بوابة **كاشير (Kashier)** باستخدام بطاقات فيزا وماستركارد وميزة والمحافظ الإلكترونية المتاحة.
- لا تحتفظ المنصة بأي بيانات للبطاقات؛ وتتم معالجة الدفع بالكامل لدى بوابة الدفع وفق معايير الأمان المعتمدة.

## 2. موعد الدفع
- يتم الدفع بعد انتهاء الخدمة، عندما يطلب الممرض الدفع من داخل التطبيق.
- السعر النهائي (سعر الخدمة + رسوم الانتقال إن وجدت) يظهر للعميل قبل تأكيد الطلب ولا يتغير بعد ذلك.

## 3. تأكيد الدفع
- لا يُعتبر الطلب مدفوعاً إلا بعد تأكيد بوابة الدفع للعملية على خوادم المنصة.
- يصلك إشعار بنجاح الدفع، ويظهر في سجل المدفوعات داخل التطبيق.

## 4. الدفع نيابة عن العميل
- إذا تعذر على العميل الدفع، يمكن للممرض الدفع إلكترونياً نيابة عنه، وتُسجل قيمة الخدمة كمبلغ مستحق على العميل لصالح الممرض.

## 5. فشل الدفع
- في حال فشل العملية لا يتم خصم أي مبلغ، ويمكن إعادة المحاولة.
- في حال خصم مبلغ دون تأكيد الطلب أو الخصم مرتين، تواصل مع الدعم على واتساب وسيتم مراجعة العملية ورد المبلغ عبر بوابة الدفع.

## 6. الاسترداد
- تتم مراجعة طلبات الاسترداد المبررة (مثل عدم تقديم الخدمة) خلال 7 أيام عمل، ويُرد المبلغ بنفس وسيلة الدفع وفقاً لسياسات بوابة الدفع والبنك المصدر.

## 7. العمولة
- تحصل المنصة على عمولة من قيمة الخدمة وفق النسبة المعلنة لمقدمي الخدمة، ولا يدفع العميل أي رسوم إضافية غير المعروضة.$p$,
$p$## Methods
Payments are processed by **Kashier** (Visa, Mastercard, Meeza, available e-wallets). Card data is never stored by MOBI-NURSE.

## Timing
Payment is made after the service, when the nurse requests it. The final price (service + any travel fee) is shown before confirmation and does not change.

## Confirmation
A booking is paid only after Kashier confirms the transaction to our servers.

## Paying on behalf
If the customer cannot pay, the nurse may pay electronically on their behalf; the amount is recorded as owed by the customer to the nurse.

## Failures & refunds
Failed payments are not charged. For double charges or charges without confirmation, contact WhatsApp support. Justified refunds are reviewed within 7 working days and returned to the original method subject to Kashier/bank policies.

## Commission
The platform keeps a commission from the nurse's share; customers pay nothing beyond the displayed price.$p$),

('cancellation', 'سياسة الإلغاء', 'Cancellation Policy', true, 5,
$p$## 1. إلغاء العميل
- يمكن للعميل إلغاء الطلب **مجاناً** أثناء البحث عن ممرض، أو بعد قبول الممرض وقبل وصوله.
- لا يمكن إلغاء الطلب من التطبيق بعد وصول الممرض أو بدء الخدمة؛ وفي حالة وجود مشكلة يرجى التواصل مع الدعم أو تقديم شكوى.
- لا توجد حالياً رسوم إلغاء، ويحق للمنصة إعلان رسوم إلغاء مستقبلاً بعد إخطار المستخدمين.

## 2. إلغاء الممرض
- يمكن للممرض الاعتذار عن طلب قبله قبل الوصول، ويعود الطلب تلقائياً للبحث عن ممرض آخر.
- تكرار الاعتذار يؤثر على ترتيب الممرض في الترشيحات وقد يؤدي لإيقاف الحساب.

## 3. الإلغاء التلقائي
- إذا لم يتوفر ممرض خلال مدة البحث المحددة، يُلغى الطلب تلقائياً ويصلك إشعار، ويمكنك إعادة الطلب في أي وقت.

## 4. الإلغاء من الإدارة
- يحق للإدارة إلغاء أي طلب يخالف الشروط أو يحتوي على بيانات غير صحيحة.

## 5. المبالغ المدفوعة
- الدفع يتم بعد انتهاء الخدمة، لذلك لا يتم خصم أي مبلغ عند إلغاء الطلب قبل تنفيذه.$p$,
$p$## Customer
Free cancellation while searching or after a nurse accepts and before arrival. Cancellation is not available after arrival or service start — contact support or file a complaint. No cancellation fees currently; any future fees will be announced in advance.

## Nurse
A nurse may withdraw before arrival; the request automatically returns to searching. Repeated withdrawals affect ranking and may lead to suspension.

## Automatic
If no nurse is found within the search window, the request is cancelled automatically with a notification.

## Administration
Requests violating the terms may be cancelled by the administration.

## Charges
Payment happens after the service, so nothing is charged for cancelled requests.$p$),

('healthcare-disclaimer', 'إخلاء المسؤولية الطبية', 'Healthcare Disclaimer', true, 6,
$p$- خدمات MOBI-NURSE هي خدمات **تمريض منزلي** فقط، ولا تشمل التشخيص الطبي أو وصف العلاج.
- الإجراءات التي تتطلب أمراً طبياً (مثل الحقن والمحاليل وتركيب الكانيولا والقسطرة) لا تُنفذ إلا بموجب **وصفة طبية سارية** من طبيب مختص، ويجب تقديمها للممرض قبل التنفيذ.
- المعلومات المعروضة في التطبيق للتعريف بالخدمات فقط ولا تُعد نصيحة طبية.
- يجب على العميل تقديم معلومات صحيحة وكاملة عن حالة المريض والأدوية والحساسية.
- يحق للممرض الامتناع عن أي إجراء يرى أنه غير آمن أو خارج حدود ممارسته المهنية، وتوجيه العميل لاستشارة الطبيب أو التوجه لأقرب مستشفى.
- يتحمل الممرض المسؤولية المهنية عن عمله وفقاً للقوانين المنظمة لمهنة التمريض في مصر.$p$,
$p$- MOBI-NURSE provides **home-nursing** services only — no medical diagnosis or prescribing.
- Procedures requiring a medical order (injections, IV fluids, cannulas, catheters) are performed only with a **valid prescription** shown to the nurse beforehand.
- App content is informational, not medical advice.
- Customers must provide accurate information about the patient, medications and allergies.
- Nurses may refuse any procedure they consider unsafe or out of scope and refer the customer to a doctor or hospital.
- Nurses bear professional responsibility under Egyptian nursing regulations.$p$),

('emergency', 'تنبيه الحالات الطارئة', 'Emergency Notice', true, 7,
$p$## ⚠️ هذه الخدمة ليست بديلاً عن الإسعاف
في الحالات الطارئة الحرجة اتصل **بالإسعاف 123 فوراً**، ومنها:
- فقدان الوعي أو التشنجات.
- صعوبة شديدة في التنفس أو ألم شديد في الصدر.
- نزيف شديد لا يتوقف.
- علامات الجلطة: ميل الوجه، ضعف مفاجئ في الذراع أو الساق، صعوبة الكلام.
- الحوادث والإصابات الشديدة والحروق الكبيرة.
- التسمم أو تناول جرعة زائدة من الدواء.

**طلب التمريض العاجل** في التطبيق مخصص للحالات غير الحرجة التي تحتاج ممرضاً في أسرع وقت، ولا يضمن وقتاً محدداً للوصول.$p$,
$p$## ⚠️ Not a replacement for an ambulance
In a critical emergency call **ambulance 123 immediately**: loss of consciousness or seizures, severe breathing difficulty or chest pain, uncontrolled bleeding, stroke signs, serious injuries or burns, poisoning or overdose.

The in-app **urgent nursing request** is for non-critical cases needing a nurse as soon as possible and does not guarantee an arrival time.$p$);
