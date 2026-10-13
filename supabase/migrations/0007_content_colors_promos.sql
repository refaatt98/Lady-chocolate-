-- ============================================================
-- محتوى الموقع من لوحة التحكم + لون البتلة الحر + أكواد الخصم
-- ============================================================

-- لون حر لبتلة القسم (إذا فاضي منستعمل tone)
alter table public.categories add column if not exists color text
  check (color is null or color ~ '^#[0-9a-fA-F]{6}$');

-- نصوص الصفحة الرئيسية (العناوين والأوصاف...) — اللي مش موجود بياخد القيمة الافتراضية من الكود
alter table public.site_settings add column if not exists content jsonb not null default '{}'::jsonb;

-- ---------- أكواد الخصم ----------
create table if not exists public.promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z0-9_-]{3,30}$'),
  kind text not null default 'percent' check (kind in ('percent', 'fixed')),
  value numeric(10, 2) not null check (value > 0),
  min_total numeric(10, 2) not null default 0 check (min_total >= 0),
  max_uses int check (max_uses is null or max_uses > 0),
  uses int not null default 0,
  starts_at timestamptz,
  expires_at timestamptz,
  active boolean not null default true,
  note text not null default '',
  created_at timestamptz not null default now(),
  constraint promo_percent_range check (kind <> 'percent' or value <= 100)
);
alter table public.promo_codes enable row level security;

-- الزوار ما بيشوفوا الأكواد أبدًا — بيتحققوا منها عبر check_promo بس
create policy "promos: admin reads" on public.promo_codes
  for select to authenticated using ((select private.is_admin()));
create policy "promos: admin inserts" on public.promo_codes
  for insert to authenticated with check ((select private.is_admin()));
create policy "promos: admin updates" on public.promo_codes
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "promos: admin deletes" on public.promo_codes
  for delete to authenticated using ((select private.is_admin()));

-- حساب الخصم (منطق واحد بيستعمله التحقق والطلب)
create or replace function private.promo_discount(promo_code text, subtotal numeric)
returns table (code text, kind text, value numeric, discount numeric, error text)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  p public.promo_codes;
begin
  select * into p from public.promo_codes c where c.code = upper(trim(promo_code));
  if p.id is null or not p.active then
    return query select null::text, null::text, null::numeric, 0::numeric, 'promo_invalid'::text;
    return;
  end if;
  if (p.starts_at is not null and p.starts_at > now()) or (p.expires_at is not null and p.expires_at < now()) then
    return query select null::text, null::text, null::numeric, 0::numeric, 'promo_expired'::text;
    return;
  end if;
  if p.max_uses is not null and p.uses >= p.max_uses then
    return query select null::text, null::text, null::numeric, 0::numeric, 'promo_used_up'::text;
    return;
  end if;
  if subtotal < p.min_total then
    return query select null::text, null::text, null::numeric, 0::numeric, ('promo_min_total:' || p.min_total)::text;
    return;
  end if;
  return query select
    p.code,
    p.kind,
    p.value,
    least(subtotal, round(case when p.kind = 'percent' then subtotal * p.value / 100 else p.value end, 2)),
    null::text;
end;
$$;
revoke all on function private.promo_discount(text, numeric) from public, anon, authenticated;

-- التحقق من الكود بالسلة (الزائر بيعرف بس إذا كوده صالح وكم الخصم)
create or replace function public.check_promo(promo_code text, subtotal numeric)
returns table (code text, kind text, value numeric, discount numeric, error text)
language sql
stable
security definer
set search_path = ''
as $$
  select * from private.promo_discount(promo_code, subtotal);
$$;
revoke all on function public.check_promo(text, numeric) from public;
grant execute on function public.check_promo(text, numeric) to anon, authenticated;

-- الطلبات: الكود والخصم — السيرفر هو اللي بيحسب الخصم (ما منثق بالمتصفح)
alter table public.orders add column if not exists promo_code text;
alter table public.orders add column if not exists discount numeric(10, 2) not null default 0 check (discount >= 0);

create or replace function private.orders_apply_promo()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  subtotal numeric := new.total + coalesce(new.discount, 0);
  r record;
begin
  if new.promo_code is null or trim(new.promo_code) = '' then
    new.promo_code := null;
    new.discount := 0;
    new.total := subtotal;
    return new;
  end if;

  select * into r from private.promo_discount(new.promo_code, subtotal);
  if r.error is not null then
    new.promo_code := null;
    new.discount := 0;
    new.total := subtotal;
  else
    new.promo_code := r.code;
    new.discount := r.discount;
    new.total := subtotal - r.discount;
    update public.promo_codes set uses = uses + 1 where code = r.code;
  end if;
  return new;
end;
$$;

create trigger orders_apply_promo before insert on public.orders
  for each row execute function private.orders_apply_promo();
