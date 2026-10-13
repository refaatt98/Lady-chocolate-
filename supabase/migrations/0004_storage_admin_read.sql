-- حذف الصور من التخزين بيحتاج صلاحية قراءة كمان (Supabase Storage بيطلب select + delete).
-- الصور نفسها عامة عبر الرابط العام — هالقاعدة بس للأدمن عشان يقدر يشوف قائمة الملفات ويحذف.
create policy "product-images: admin reads" on storage.objects
  for select to authenticated using (bucket_id = 'product-images' and (select private.is_admin()));
