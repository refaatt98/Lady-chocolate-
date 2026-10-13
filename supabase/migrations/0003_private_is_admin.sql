-- is_admin بمخطط private: قواعد الحماية بتستعملها، بس ما بتنكشف كـ RPC عبر الـ API.
create schema if not exists private;
grant usage on schema private to anon, authenticated;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins where user_id = (select auth.uid()));
$$;
revoke all on function private.is_admin() from public;
grant execute on function private.is_admin() to anon, authenticated;

alter policy "admins: admin reads" on public.admins using ((select private.is_admin()));

alter policy "categories: admin inserts" on public.categories with check ((select private.is_admin()));
alter policy "categories: admin updates" on public.categories using ((select private.is_admin())) with check ((select private.is_admin()));
alter policy "categories: admin deletes" on public.categories using ((select private.is_admin()));

alter policy "products: everyone reads active" on public.products using (active or (select private.is_admin()));
alter policy "products: admin inserts" on public.products with check ((select private.is_admin()));
alter policy "products: admin updates" on public.products using ((select private.is_admin())) with check ((select private.is_admin()));
alter policy "products: admin deletes" on public.products using ((select private.is_admin()));

alter policy "sizes: everyone reads" on public.product_sizes using (
  exists (select 1 from public.products p where p.id = product_id and (p.active or (select private.is_admin())))
);
alter policy "sizes: admin inserts" on public.product_sizes with check ((select private.is_admin()));
alter policy "sizes: admin updates" on public.product_sizes using ((select private.is_admin())) with check ((select private.is_admin()));
alter policy "sizes: admin deletes" on public.product_sizes using ((select private.is_admin()));

alter policy "fields: everyone reads" on public.product_fields using (
  exists (select 1 from public.products p where p.id = product_id and (p.active or (select private.is_admin())))
);
alter policy "fields: admin inserts" on public.product_fields with check ((select private.is_admin()));
alter policy "fields: admin updates" on public.product_fields using ((select private.is_admin())) with check ((select private.is_admin()));
alter policy "fields: admin deletes" on public.product_fields using ((select private.is_admin()));

alter policy "settings: admin updates" on public.site_settings using ((select private.is_admin())) with check ((select private.is_admin()));

alter policy "orders: admin reads" on public.orders using ((select private.is_admin()));
alter policy "orders: admin updates" on public.orders using ((select private.is_admin())) with check ((select private.is_admin()));
alter policy "orders: admin deletes" on public.orders using ((select private.is_admin()));

alter policy "product-images: admin uploads" on storage.objects with check (bucket_id = 'product-images' and (select private.is_admin()));
alter policy "product-images: admin updates" on storage.objects using (bucket_id = 'product-images' and (select private.is_admin()));
alter policy "product-images: admin deletes" on storage.objects using (bucket_id = 'product-images' and (select private.is_admin()));

-- الدالة القديمة: منسحب صلاحية تشغيلها (حذفها كان بيعلّق على قفل بالسيرفر)
revoke all on function public.is_admin() from public, anon, authenticated;

-- دالة Supabase التلقائية (event trigger) — ما لازم تنكشف عبر الـ API
revoke all on function public.rls_auto_enable() from public, anon, authenticated;
