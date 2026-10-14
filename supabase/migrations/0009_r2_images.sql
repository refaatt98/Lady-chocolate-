-- ============================================================
-- الصور على Cloudflare R2
-- المفاتيح محفوظة مشفّرة بـ Supabase Vault (مش بهالملف ولا بالكود):
--   select vault.create_secret('<value>', 'r2_account_id');
--   select vault.create_secret('<value>', 'r2_bucket');
--   select vault.create_secret('<value>', 'r2_access_key_id');
--   select vault.create_secret('<value>', 'r2_secret_access_key');
--   select vault.create_secret('<value>', 'r2_public_url');
-- لتغيير مفتاح: select vault.update_secret(id, '<new value>') from vault.secrets where name = '...';
-- ============================================================

-- بيقراها بس الـ service role (دالة r2-upload) — الزوار والأدمن من المتصفح ما بيقدروا
create or replace function public.r2_config()
returns table (account_id text, bucket text, access_key_id text, secret_access_key text, public_url text)
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select decrypted_secret from vault.decrypted_secrets where name = 'r2_account_id'),
    (select decrypted_secret from vault.decrypted_secrets where name = 'r2_bucket'),
    (select decrypted_secret from vault.decrypted_secrets where name = 'r2_access_key_id'),
    (select decrypted_secret from vault.decrypted_secrets where name = 'r2_secret_access_key'),
    (select decrypted_secret from vault.decrypted_secrets where name = 'r2_public_url');
$$;
revoke all on function public.r2_config() from public, anon, authenticated;
grant execute on function public.r2_config() to service_role;

-- نقل روابط الصور الموجودة لـ R2 (الملفات نفسها انرفعت بنفس الأسماء تحت products/)
-- صور الموقع الأصلية: /images/products/x.jpg  → <R2>/products/x.jpg
-- صور Supabase Storage: .../product-images/2026-10/x.webp → <R2>/products/2026-10/x.webp
create or replace function private.to_r2(url text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when url like '/images/products/%' then 'https://pub-79939cbe349c4177a41e142bd6c240b6.r2.dev/products/' || substr(url, length('/images/products/') + 1)
    when url like '%/storage/v1/object/public/product-images/%' then 'https://pub-79939cbe349c4177a41e142bd6c240b6.r2.dev/products/' || split_part(url, '/storage/v1/object/public/product-images/', 2)
    else url
  end;
$$;

update public.products
set images = (select coalesce(array_agg(private.to_r2(u) order by ord), '{}') from unnest(images) with ordinality as t(u, ord)),
    preview = case when preview ? 'image' then jsonb_set(preview, '{image}', to_jsonb(private.to_r2(preview->>'image'))) else preview end;

update public.site_settings
set content = jsonb_set(content, '{journey,image}', to_jsonb(private.to_r2(content->'journey'->>'image')))
where content->'journey' ? 'image';
