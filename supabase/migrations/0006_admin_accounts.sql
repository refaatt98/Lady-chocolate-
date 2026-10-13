-- ============================================================
-- حسابات الأدمن من لوحة التحكم:
-- 1) أول أدمن: بكود تفعيل لمرة وحدة (setup_first_admin)
-- 2) أكثر من أدمن: إضافة / عرض / شيل — بس لأدمن مسجّل دخول
-- ============================================================

-- أكواد التفعيل (بمخطط private — ما بتنكشف عبر الـ API)
create table if not exists private.setup_codes (
  code_hash text not null,
  expires_at timestamptz not null,
  used_at timestamptz
);
alter table private.setup_codes enable row level security;
revoke all on private.setup_codes from public, anon, authenticated;

-- مساعد داخلي: بيعمل مستخدم (أو بيحدّث كلمة سره) وبيضيفه للأدمن
create or replace function private.upsert_admin_user(admin_email text, admin_password text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid;
  clean_email text := lower(trim(admin_email));
begin
  if clean_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'invalid_email';
  end if;
  if length(coalesce(admin_password, '')) < 8 then
    raise exception 'weak_password';
  end if;

  select u.id into uid from auth.users u where lower(u.email) = clean_email;
  if uid is null then
    uid := gen_random_uuid();
    insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
    values ('00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated', clean_email,
      extensions.crypt(admin_password, extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '');
    insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), uid, uid::text,
      jsonb_build_object('sub', uid::text, 'email', clean_email, 'email_verified', true), 'email', now(), now(), now());
  else
    update auth.users
    set encrypted_password = extensions.crypt(admin_password, extensions.gen_salt('bf')),
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        banned_until = null,
        updated_at = now()
    where id = uid;
  end if;

  insert into public.admins (user_id) values (uid) on conflict do nothing;
  return uid;
end;
$$;
revoke all on function private.upsert_admin_user(text, text) from public, anon, authenticated;

-- أول أدمن: بكود التفعيل (لمرة وحدة، وبينتهي)
create or replace function public.setup_first_admin(setup_code text, admin_email text, admin_password text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  found_hash text;
begin
  select c.code_hash into found_hash
  from private.setup_codes c
  where c.used_at is null and c.expires_at > now() and c.code_hash = extensions.crypt(trim(setup_code), c.code_hash)
  limit 1;

  if found_hash is null then
    -- تأخير بسيط ضد التخمين
    perform pg_sleep(1);
    raise exception 'invalid_code';
  end if;

  perform private.upsert_admin_user(admin_email, admin_password);
  update private.setup_codes set used_at = now() where code_hash = found_hash;
end;
$$;
revoke all on function public.setup_first_admin(text, text, text) from public;
grant execute on function public.setup_first_admin(text, text, text) to anon, authenticated;

-- قائمة الأدمن (للأدمن بس)
create or replace function public.admin_list()
returns table (user_id uuid, email text, created_at timestamptz, last_sign_in_at timestamptz, is_me boolean)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'not_admin';
  end if;
  return query
    select a.user_id, u.email::text, a.created_at, u.last_sign_in_at, a.user_id = auth.uid()
    from public.admins a
    join auth.users u on u.id = a.user_id
    where u.banned_until is null or u.banned_until < now()
    order by a.created_at;
end;
$$;
revoke all on function public.admin_list() from public, anon;
grant execute on function public.admin_list() to authenticated;

-- إضافة أدمن (أو تغيير كلمة سر أدمن موجود)
create or replace function public.admin_add(admin_email text, admin_password text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'not_admin';
  end if;
  return private.upsert_admin_user(admin_email, admin_password);
end;
$$;
revoke all on function public.admin_add(text, text) from public, anon;
grant execute on function public.admin_add(text, text) to authenticated;

-- شيل أدمن: قاعدة حماية بدل دالة — أدمن بيقدر يشيل غيره، بس مش حاله
create policy "admins: admin removes others" on public.admins
  for delete to authenticated
  using ((select private.is_admin()) and user_id <> (select auth.uid()));
