-- ============================================================
-- المخزون: كمية لكل منتج (اختياري — الأدمن بيفعّله للمنتج اللي بده)
--   * الطلب الجديد ما بيحجز كمية
--   * لما الأدمن يأكد الطلب (قيد التحضير / جاهز / انسلّم) الكمية بتنقص مرة وحدة
--   * لما يلغيه أو يرجعه "جديد" الكمية بترجع
--   * الزبون ما بيقدر يطلب أكتر من الموجود
-- ============================================================

alter table public.products add column if not exists track_stock boolean not null default false;
alter table public.products add column if not exists stock int not null default 0 check (stock >= 0);
alter table public.orders add column if not exists stock_applied boolean not null default false;

-- الكميات المطلوبة من كل منتج بالطلب (productId → مجموع qty)
create or replace function private.order_quantities(items jsonb)
returns table (product_id text, qty int)
language sql
immutable
set search_path = ''
as $$
  select e->>'productId', sum(least((e->>'qty')::int, 1000))::int
  from jsonb_array_elements(items) e
  where e->>'productId' is not null and coalesce(e->>'qty', '') ~ '^[0-9]{1,6}$'
  group by 1;
$$;

-- قبل تسجيل الطلب: إذا منتج نفذ أو الكمية ما بتكفي → رفض
create or replace function private.orders_check_stock()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  short_name text;
begin
  new.stock_applied := false;
  select p.name into short_name
  from private.order_quantities(new.items) q
  join public.products p on p.id::text = q.product_id
  where p.track_stock and p.stock < q.qty
  limit 1;
  if short_name is not null then
    raise exception 'out_of_stock' using detail = short_name;
  end if;
  return new;
end;
$$;

create or replace trigger orders_check_stock before insert on public.orders
  for each row execute function private.orders_check_stock();

-- لما تتغير حالة الطلب: خصم أو إرجاع الكمية
create or replace function private.orders_apply_stock()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.stock_applied := old.stock_applied;

  if new.status in ('preparing', 'ready', 'delivered') and not old.stock_applied then
    update public.products p
    set stock = greatest(p.stock - q.qty, 0)
    from private.order_quantities(new.items) q
    where p.id::text = q.product_id and p.track_stock;
    new.stock_applied := true;
  elsif new.status in ('new', 'cancelled') and old.stock_applied then
    update public.products p
    set stock = p.stock + q.qty
    from private.order_quantities(new.items) q
    where p.id::text = q.product_id and p.track_stock;
    new.stock_applied := false;
  end if;

  return new;
end;
$$;

create or replace trigger orders_apply_stock before update on public.orders
  for each row execute function private.orders_apply_stock();
