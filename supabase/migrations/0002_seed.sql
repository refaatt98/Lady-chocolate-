-- بيانات البداية: نفس البيانات الوهمية اللي كانت بـ src/data — بتتعدّل كلها من لوحة التحكم.
-- ⚠️ الأسعار، الرقم والعنوان مؤقتين.

insert into public.site_settings (id, name, latin_name, tagline, whatsapp, phone_display, instagram, address, hours, delivery_note, delivery_cities, min_lead_days)
values (
  1, 'الليدي شوكولات', 'Lady Chocolate', 'شوكولا بلجيكية، بروح زمان',
  '970599000000', '0599 000 000', 'https://instagram.com/', 'فلسطين', 'يوميًا من ١٠ الصبح لـ ١٠ المسا',
  'رسوم التوصيل بتختلف حسب المنطقة، ومنأكدها معك على الواتساب قبل التحضير.',
  array['رام الله', 'البيرة', 'نابلس', 'الخليل', 'بيت لحم', 'جنين', 'طولكرم', 'قلقيلية', 'أريحا', 'القدس', 'سلفيت', 'طوباس'],
  2
)
on conflict (id) do nothing;

insert into public.categories (slug, name, latin_name, description, tone, sort) values
  ('trays', 'صواني المناسبات', 'Occasion Trays', 'صواني مرتبة يدويًا، بتنكتب عليها الأسامي والتاريخ.', 'olive', 1),
  ('milk', 'بالحليب', 'Milk', 'شوكولا بلجيكية بالحليب، ناعمة وكريمية.', 'milk', 2),
  ('dark', 'داكنة', 'Dark', 'كاكاو عالي وطعم عميق لعشّاق المرارة الحلوة.', 'dark', 3),
  ('white', 'بيضاء', 'White', 'زبدة كاكاو وفانيلا، طعم هادي وناعم.', 'white', 4),
  ('filled', 'محشية', 'Pralines', 'برالين بحشوات بندق، فستق وكراميل.', 'caramel', 5)
on conflict (slug) do nothing;

with p as (
  insert into public.products (slug, name, category_id, short_description, description, images, ingredients, badge, featured, sort, preview)
  values (
    'green-field-tray', 'صينية الحقل الأخضر', (select id from public.categories where slug = 'trays'),
    'زهرة شوكولا بالحليب حوالين قرص مرسوم، وقطع بأخضر الهوية.',
    'صينية دائرية مرتبة باليد: بتلات شوكولا بلجيكية بالحليب على شكل زهرة، بنصّها قرص شوكولا بيضاء مطبوع عليه رسمة ريفية قديمة والاسم اللي بتختاره، ومحاطة بقطع ملفوفة بالأخضر مكتوب عليها الاسم. بتنفع للنجاح، المواليد والمناسبات الحلوة.',
    array['/images/products/tray-green-field.jpg', '/images/products/tray-green-field-square.jpg'],
    array['شوكولا بلجيكية بالحليب', 'شوكولا بيضاء', 'طباعة صالحة للأكل'],
    'بالاسم', true, 1,
    '{"image":"/images/products/tray-green-field-square.jpg","disc":{"cx":47.8,"cy":50,"w":26.4,"h":22.8},"coverTo":60,"top":"phrase","main":"name"}'
  )
  on conflict (slug) do nothing
  returning id
), s as (
  insert into public.product_sizes (product_id, label, pieces, price, sort)
  select p.id, v.label, v.pieces, v.price, v.sort from p,
    (values ('صغيرة', 60, 280, 1), ('وسط', 90, 380, 2), ('كبيرة', 130, 520, 3)) as v(label, pieces, price, sort)
)
insert into public.product_fields (product_id, key, label, placeholder, max_length, sort)
select p.id, v.key, v.label, v.placeholder, v.max_length, v.sort from p,
  (values ('name', 'الاسم', 'مثلًا: توفيق', 20, 1), ('phrase', 'العبارة', 'مثلًا: اللهم أنبته نباتًا حسنًا', 40, 2)) as v(key, label, placeholder, max_length, sort);

with p as (
  insert into public.products (slug, name, category_id, short_description, description, images, ingredients, badge, featured, sort, preview)
  values (
    'white-names-tray', 'صينية الأبيض الملكي', (select id from public.categories where slug = 'trays'),
    'بتلات شوكولا كثيفة، وحلقة قطع بيضاء عليها أسامي العرسان.',
    'صينية للخطبة والعرس: طبقات بتلات شوكولا بلجيكية بالحليب والداكنة بشكل زهرة كبيرة، بنصّها قرص أبيض مكتوب عليه أسماء العرسان والتاريخ بخط عربي ناعم، ومحاطة بحلقة قطع بيضاء مخصّصة بالأسامي.',
    array['/images/products/tray-white-names.jpg', '/images/products/tray-white-names-square.jpg'],
    array['شوكولا بلجيكية بالحليب', 'شوكولا داكنة', 'شوكولا بيضاء'],
    'للأعراس', true, 2,
    '{"image":"/images/products/tray-white-names-square.jpg","disc":{"cx":47.7,"cy":48.2,"w":26.4,"h":22.4},"main":"names","bottom":"date"}'
  )
  on conflict (slug) do nothing
  returning id
), s as (
  insert into public.product_sizes (product_id, label, pieces, price, sort)
  select p.id, v.label, v.pieces, v.price, v.sort from p,
    (values ('صغيرة', 70, 320, 1), ('وسط', 100, 430, 2), ('كبيرة', 150, 590, 3)) as v(label, pieces, price, sort)
)
insert into public.product_fields (product_id, key, label, placeholder, max_length, sort)
select p.id, v.key, v.label, v.placeholder, v.max_length, v.sort from p,
  (values ('names', 'الأسماء', 'مثلًا: منى ومحمود', 30, 1), ('date', 'التاريخ', 'مثلًا: 25.9.26', 12, 2)) as v(key, label, placeholder, max_length, sort);
