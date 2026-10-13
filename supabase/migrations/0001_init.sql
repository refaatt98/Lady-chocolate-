-- ============================================================
-- الليدي شوكولات — قاعدة البيانات
-- الجداول، قواعد الحماية (RLS)، ومكان تخزين الصور.
-- القاعدة: الزبون بيقرأ بس (ومنتجات ظاهرة بس)، والأدمن بيعدّل كل إشي.
-- ============================================================

-- ---------- الأدمن ----------
create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;

-- security definer: بتقدر تقرأ admins حتى لو المستخدم ما إله صلاحية عليه
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins where user_id = (select auth.uid()));
$$;

create policy "admins: admin reads" on public.admins
  for select to authenticated using ((select public.is_admin()));

-- ---------- الأقسام ----------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null,
  latin_name text not null default '',
  description text not null default '',
  tone text not null default 'milk' check (tone in ('milk', 'dark', 'white', 'caramel', 'olive')),
  sort int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.categories enable row level security;

create policy "categories: everyone reads" on public.categories
  for select to anon, authenticated using (true);
create policy "categories: admin inserts" on public.categories
  for insert to authenticated with check ((select public.is_admin()));
create policy "categories: admin updates" on public.categories
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "categories: admin deletes" on public.categories
  for delete to authenticated using ((select public.is_admin()));

-- ---------- المنتجات ----------
create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null,
  category_id uuid references public.categories (id) on delete set null,
  short_description text not null default '',
  description text not null default '',
  images text[] not null default '{}',
  ingredients text[] not null default '{}',
  badge text,
  featured boolean not null default false,
  active boolean not null default true,
  sort int not null default 0,
  -- معاينة الاسم على القرص: {image, disc:{cx,cy,w,h}, coverTo?, top?, main, bottom?}
  preview jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_category_idx on public.products (category_id);
alter table public.products enable row level security;

create policy "products: everyone reads active" on public.products
  for select to anon, authenticated using (active or (select public.is_admin()));
create policy "products: admin inserts" on public.products
  for insert to authenticated with check ((select public.is_admin()));
create policy "products: admin updates" on public.products
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "products: admin deletes" on public.products
  for delete to authenticated using ((select public.is_admin()));

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();

-- ---------- الأحجام ----------
create table public.product_sizes (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  label text not null,
  pieces int not null default 0 check (pieces >= 0),
  price numeric(10, 2) not null check (price >= 0),
  sort int not null default 0
);
create index product_sizes_product_idx on public.product_sizes (product_id);
alter table public.product_sizes enable row level security;

create policy "sizes: everyone reads" on public.product_sizes
  for select to anon, authenticated using (
    exists (select 1 from public.products p where p.id = product_id and (p.active or (select public.is_admin())))
  );
create policy "sizes: admin inserts" on public.product_sizes
  for insert to authenticated with check ((select public.is_admin()));
create policy "sizes: admin updates" on public.product_sizes
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "sizes: admin deletes" on public.product_sizes
  for delete to authenticated using ((select public.is_admin()));

-- ---------- خانات التخصيص (اسم، تاريخ، عبارة...) ----------
create table public.product_fields (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  key text not null check (key ~ '^[a-z0-9_]+$'),
  label text not null,
  placeholder text not null default '',
  max_length int check (max_length is null or max_length > 0),
  sort int not null default 0,
  unique (product_id, key)
);
create index product_fields_product_idx on public.product_fields (product_id);
alter table public.product_fields enable row level security;

create policy "fields: everyone reads" on public.product_fields
  for select to anon, authenticated using (
    exists (select 1 from public.products p where p.id = product_id and (p.active or (select public.is_admin())))
  );
create policy "fields: admin inserts" on public.product_fields
  for insert to authenticated with check ((select public.is_admin()));
create policy "fields: admin updates" on public.product_fields
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "fields: admin deletes" on public.product_fields
  for delete to authenticated using ((select public.is_admin()));

-- ---------- إعدادات المحل (صف واحد) ----------
create table public.site_settings (
  id int primary key default 1 check (id = 1),
  name text not null default 'الليدي شوكولات',
  latin_name text not null default 'Lady Chocolate',
  tagline text not null default '',
  whatsapp text not null default '' check (whatsapp ~ '^[0-9]*$'),
  phone_display text not null default '',
  instagram text not null default '',
  address text not null default '',
  hours text not null default '',
  delivery_note text not null default '',
  delivery_cities text[] not null default '{}',
  min_lead_days int not null default 2 check (min_lead_days >= 0),
  updated_at timestamptz not null default now()
);
alter table public.site_settings enable row level security;

create policy "settings: everyone reads" on public.site_settings
  for select to anon, authenticated using (true);
create policy "settings: admin updates" on public.site_settings
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- ---------- الطلبات ----------
-- الزبون (بدون حساب) بيقدر يضيف طلب بس — ما بيقدر يقرأ ولا يعدّل طلبات.
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique check (char_length(reference) between 4 and 20),
  items jsonb not null check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) between 1 and 50),
  info jsonb not null check (jsonb_typeof(info) = 'object'),
  total numeric(10, 2) not null check (total >= 0),
  status text not null default 'new' check (status in ('new', 'preparing', 'ready', 'delivered', 'cancelled')),
  admin_note text not null default '',
  created_at timestamptz not null default now(),
  -- حماية بسيطة من الطلبات الضخمة
  constraint orders_size check (pg_column_size(items) + pg_column_size(info) < 60000)
);
create index orders_created_idx on public.orders (created_at desc);
alter table public.orders enable row level security;

create policy "orders: anyone places new" on public.orders
  for insert to anon, authenticated with check (status = 'new' and admin_note = '');
create policy "orders: admin reads" on public.orders
  for select to authenticated using ((select public.is_admin()));
create policy "orders: admin updates" on public.orders
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "orders: admin deletes" on public.orders
  for delete to authenticated using ((select public.is_admin()));

-- ---------- صور المنتجات ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 8388608, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do nothing;

create policy "product-images: admin uploads" on storage.objects
  for insert to authenticated with check (bucket_id = 'product-images' and (select public.is_admin()));
create policy "product-images: admin updates" on storage.objects
  for update to authenticated using (bucket_id = 'product-images' and (select public.is_admin()));
create policy "product-images: admin deletes" on storage.objects
  for delete to authenticated using (bucket_id = 'product-images' and (select public.is_admin()));
