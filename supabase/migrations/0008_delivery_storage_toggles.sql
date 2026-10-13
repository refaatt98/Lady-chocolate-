-- ============================================================
-- مناطق التوصيل بأسعارها + "الحفظ والتقديم" لكل منتج + إخفاء خطوة التخصيص
-- ============================================================

-- ---------- لكل منتج ----------
alter table public.products add column if not exists storage_note text not null
  default 'احفظها بمكان بارد وناشف، بعيد عن الشمس والريحة القوية. الأفضل ما تنحط بالثلاجة، ولو اضطريت، طلّعها قبل التقديم بشوي.';
alter table public.products add column if not exists customization_enabled boolean not null default true;

-- ---------- مناطق التوصيل ----------
create table if not exists public.delivery_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(trim(name)) between 1 and 60),
  -- null = السعر بيتأكد على الواتساب
  price numeric(10, 2) check (price is null or price >= 0),
  active boolean not null default true,
  sort int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.delivery_zones enable row level security;

create policy "zones: everyone reads active" on public.delivery_zones
  for select to anon, authenticated using (active or (select private.is_admin()));
create policy "zones: admin inserts" on public.delivery_zones
  for insert to authenticated with check ((select private.is_admin()));
create policy "zones: admin updates" on public.delivery_zones
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "zones: admin deletes" on public.delivery_zones
  for delete to authenticated using ((select private.is_admin()));

-- البداية: نفس المدن اللي كانت مقترحة، بدون سعر (بتحطه من لوحة التحكم)
insert into public.delivery_zones (name, sort)
select city, ord::int
from unnest((select delivery_cities from public.site_settings where id = 1)) with ordinality as t(city, ord)
on conflict (name) do nothing;

-- ---------- الطلبات: رسوم التوصيل (السيرفر بيحسبها من الجدول) ----------
alter table public.orders add column if not exists delivery_fee numeric(10, 2) not null default 0 check (delivery_fee >= 0);

create or replace function private.orders_apply_promo()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  -- المتصفح بيبعت: total = المنتجات − الخصم + التوصيل
  items_subtotal numeric := new.total + coalesce(new.discount, 0) - coalesce(new.delivery_fee, 0);
  fee numeric := 0;
  r record;
begin
  -- رسوم التوصيل من جدول المناطق (مش من المتصفح)
  if coalesce(new.info->>'method', 'delivery') = 'delivery' then
    select coalesce(z.price, 0) into fee
    from public.delivery_zones z
    where z.active and z.name = trim(coalesce(new.info->>'city', ''));
    fee := coalesce(fee, 0);
  end if;
  new.delivery_fee := fee;

  new.discount := 0;
  if new.promo_code is not null and trim(new.promo_code) <> '' then
    select * into r from private.promo_discount(new.promo_code, items_subtotal);
    if r.error is null then
      new.promo_code := r.code;
      new.discount := r.discount;
      update public.promo_codes set uses = uses + 1 where code = r.code;
    else
      new.promo_code := null;
    end if;
  else
    new.promo_code := null;
  end if;

  new.total := items_subtotal - new.discount + fee;
  return new;
end;
$$;
