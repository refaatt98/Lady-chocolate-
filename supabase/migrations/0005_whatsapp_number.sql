-- رقم واتساب المحل الحقيقي (بيتغيّر بعدين من لوحة التحكم ← الإعدادات)
update public.site_settings
set whatsapp = '972527231273', phone_display = '052-723-1273', updated_at = now()
where id = 1;
