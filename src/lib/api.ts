/**
 * طبقة جلب البيانات — كل الموقع (ولوحة التحكم) بيحكي مع البيانات من هون بس.
 * إذا Supabase مربوط (supabase != null) منجيب منه، وإذا لا منرجع للبيانات الوهمية بـ src/data.
 */
import { categories as mockCategories } from '../data/categories'
import { products as mockProducts } from '../data/products'
import { mergeContent } from '../data/content'
import { site as mockSite } from '../data/site'
import type {
  AppliedPromo,
  Category,
  CheckoutInfo,
  CustomizationField,
  OrderItem,
  OrderRecord,
  OrderStatus,
  Product,
  ProductInput,
  DeliveryZone,
  ProductSize,
  PromoCode,
  SiteContent,
  SiteInfo,
  TrayPreviewSpec,
} from '../types'
import { supabase } from './supabase'

export const isBackendConnected = () => supabase !== null

/* ================================================================== */
/* تحويل صفوف قاعدة البيانات لأنواع الموقع                             */
/* ================================================================== */

interface CategoryRow {
  id: string
  slug: string
  name: string
  latin_name: string
  description: string
  tone: Category['tone']
  color: string | null
  sort: number
}

interface SizeRow {
  id: string
  label: string
  pieces: number
  price: number | string
  sort: number
}

interface FieldRow {
  id: string
  key: string
  label: string
  placeholder: string
  max_length: number | null
  sort: number
}

interface ProductRow {
  id: string
  slug: string
  name: string
  category_id: string | null
  short_description: string
  description: string
  images: string[]
  ingredients: string[]
  badge: string | null
  featured: boolean
  active: boolean
  sort: number
  preview: TrayPreviewSpec | null
  storage_note: string | null
  customization_enabled: boolean | null
  product_sizes?: SizeRow[]
  product_fields?: FieldRow[]
}

interface SettingsRow {
  name: string
  latin_name: string
  tagline: string
  whatsapp: string
  phone_display: string
  instagram: string
  address: string
  hours: string
  delivery_note: string
  delivery_cities: string[]
  min_lead_days: number
  content: unknown
}

interface OrderRow {
  id: string
  reference: string
  items: unknown
  info: unknown
  total: number | string
  status: OrderStatus
  admin_note: string
  created_at: string
  promo_code: string | null
  discount: number | string
  delivery_fee: number | string
}

const bySort = <T extends { sort: number }>(a: T, b: T) => a.sort - b.sort

const toCategory = (r: CategoryRow): Category => ({
  id: r.id,
  slug: r.slug,
  name: r.name,
  latinName: r.latin_name,
  description: r.description,
  tone: r.tone,
  color: r.color ?? undefined,
  sort: r.sort,
})

const toProduct = (r: ProductRow): Product => {
  const sizes: ProductSize[] = [...(r.product_sizes ?? [])].sort(bySort).map((s) => ({
    id: s.id,
    label: s.label,
    pieces: s.pieces,
    price: Number(s.price),
  }))
  const fields: CustomizationField[] = [...(r.product_fields ?? [])].sort(bySort).map((f) => ({
    id: f.key,
    label: f.label,
    placeholder: f.placeholder,
    maxLength: f.max_length ?? undefined,
  }))
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    categoryId: r.category_id ?? '',
    shortDescription: r.short_description,
    description: r.description,
    price: sizes.length ? Math.min(...sizes.map((s) => s.price)) : 0,
    images: r.images,
    sizes,
    ingredients: r.ingredients,
    customization: fields.length ? fields : undefined,
    preview: r.preview ?? undefined,
    featured: r.featured,
    badge: r.badge ?? undefined,
    active: r.active,
    sort: r.sort,
    storageNote: r.storage_note ?? undefined,
    customizationEnabled: r.customization_enabled ?? true,
  }
}

const toSite = (r: SettingsRow): SiteInfo => ({
  name: r.name,
  latinName: r.latin_name,
  tagline: r.tagline,
  whatsapp: r.whatsapp,
  phoneDisplay: r.phone_display,
  instagram: r.instagram,
  address: r.address,
  hours: r.hours,
  deliveryNote: r.delivery_note,
  deliveryCities: r.delivery_cities,
  minLeadDays: r.min_lead_days,
  content: mergeContent(r.content),
})

/*
 * الطلبات بيبعتها أي زائر، فما منثق بشكلها: منحوّل كل قيمة لنوعها الصحيح
 * عشان طلب ناقص أو مخرّب ما يكسر لوحة التحكم.
 */
const str = (v: unknown) => (typeof v === 'string' ? v : v == null ? '' : String(v)).slice(0, 2000)
const num = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0)
const obj = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {})
/** صور الطلب: بس روابط http(s) أو مسارات من موقعنا */
const safeImage = (v: unknown) => {
  const s = str(v)
  return /^(https?:\/\/|\/)/.test(s) ? s : ''
}

const toOrderItem = (raw: unknown): OrderItem => {
  const r = obj(raw)
  const details = Array.isArray(r.details)
    ? r.details.filter(Array.isArray).map((pair) => [str(pair[0]), str(pair[1])] as [string, string])
    : []
  return {
    key: str(r.key),
    productId: str(r.productId),
    slug: str(r.slug),
    name: str(r.name) || 'منتج',
    image: safeImage(r.image),
    sizeLabel: str(r.sizeLabel),
    pieces: num(r.pieces),
    unitPrice: num(r.unitPrice),
    qty: Math.max(1, num(r.qty)),
    details,
    note: str(r.note) || undefined,
  }
}

const toCheckoutInfo = (raw: unknown): CheckoutInfo => {
  const r = obj(raw)
  return {
    name: str(r.name),
    phone: str(r.phone),
    method: r.method === 'pickup' ? 'pickup' : 'delivery',
    city: str(r.city),
    address: str(r.address),
    receiverPhone: str(r.receiverPhone),
    date: str(r.date),
    time: str(r.time),
    isGift: r.isGift === true,
    giftMessage: str(r.giftMessage),
    notes: str(r.notes),
  }
}

const toOrder = (r: OrderRow): OrderRecord => ({
  id: r.id,
  reference: r.reference,
  items: Array.isArray(r.items) ? r.items.map(toOrderItem) : [],
  info: toCheckoutInfo(r.info),
  total: num(r.total),
  status: r.status,
  adminNote: r.admin_note,
  createdAt: r.created_at,
  promoCode: r.promo_code ?? undefined,
  discount: num(r.discount),
  deliveryFee: num(r.delivery_fee),
})

const PRODUCT_SELECT = '*, product_sizes(*), product_fields(*)'

/** بيرمي الغلط بشكل مفهوم */
function check<T>(result: { data: T | null; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message)
  return result.data as T
}

/** تأخير بسيط للبيانات الوهمية عشان نحاكي الشبكة */
const delay = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms))

/* ================================================================== */
/* الموقع العام                                                         */
/* ================================================================== */

export async function getSiteInfo(): Promise<SiteInfo> {
  if (!supabase) return mockSite
  try {
    const row = check(await supabase.from('site_settings').select('*').eq('id', 1).maybeSingle()) as SettingsRow | null
    return row ? toSite(row) : mockSite
  } catch {
    return mockSite
  }
}

export async function getCategories(): Promise<Category[]> {
  if (!supabase) {
    await delay()
    return mockCategories
  }
  const rows = check(await supabase.from('categories').select('*').order('sort')) as CategoryRow[]
  return rows.map(toCategory)
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const all = await getCategories()
  return all.find((c) => c.slug === slug) ?? null
}

export async function getProducts(options: { categorySlug?: string } = {}): Promise<Product[]> {
  if (!supabase) {
    await delay()
    if (!options.categorySlug) return mockProducts
    const category = mockCategories.find((c) => c.slug === options.categorySlug)
    return category ? mockProducts.filter((p) => p.categoryId === category.id) : []
  }
  let query = supabase.from('products').select(PRODUCT_SELECT).eq('active', true).order('sort').order('created_at')
  if (options.categorySlug) {
    const category = await getCategoryBySlug(options.categorySlug)
    if (!category) return []
    query = query.eq('category_id', category.id)
  }
  const rows = check(await query) as ProductRow[]
  return rows.map(toProduct)
}

export async function getFeaturedProducts(): Promise<Product[]> {
  if (!supabase) {
    await delay()
    return mockProducts.filter((p) => p.featured)
  }
  const rows = check(
    await supabase.from('products').select(PRODUCT_SELECT).eq('active', true).eq('featured', true).order('sort'),
  ) as ProductRow[]
  return rows.map(toProduct)
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (!supabase) {
    await delay()
    return mockProducts.find((p) => p.slug === slug) ?? null
  }
  const row = check(await supabase.from('products').select(PRODUCT_SELECT).eq('slug', slug).maybeSingle()) as ProductRow | null
  return row ? toProduct(row) : null
}

const newReference = () => {
  const stamp = Date.now().toString(36).slice(-4).toUpperCase()
  const rand = Math.random().toString(36).slice(2, 4).toUpperCase()
  return `LC-${stamp}${rand}`
}

/**
 * تسجيل طلبية بجدول orders، وبيرجع رقم الطلب (بينكتب برسالة الواتساب).
 * إذا الحفظ فشل، ما منوقف الزبون — الطلب بيوصل على الواتساب بكل الأحوال.
 */
export async function submitOrder(order: {
  items: OrderItem[]
  info: CheckoutInfo
  /** المجموع النهائي: المنتجات − الخصم + التوصيل */
  total: number
  promo?: AppliedPromo | null
  deliveryFee?: number
}): Promise<{ reference: string }> {
  const reference = newReference()
  if (!supabase) {
    await delay()
    return { reference }
  }
  // السيرفر بيعيد حساب الخصم (trigger) — ما منثق بالرقم من المتصفح
  const { error } = await supabase.from('orders').insert({
    reference,
    items: order.items,
    info: order.info,
    total: order.total,
    discount: order.promo?.discount ?? 0,
    promo_code: order.promo?.code ?? null,
    delivery_fee: order.deliveryFee ?? 0,
  })
  if (error) console.warn('ما انحفظ الطلب بقاعدة البيانات:', error.message)
  return { reference }
}

/* ---------- مناطق التوصيل ---------- */

interface ZoneRow {
  id: string
  name: string
  price: number | string | null
  active: boolean
  sort: number
}
const toZone = (r: ZoneRow): DeliveryZone => ({ id: r.id, name: r.name, price: r.price === null ? null : Number(r.price), active: r.active, sort: r.sort })

/** مناطق التوصيل الفعّالة (للسلة) */
export async function getDeliveryZones(): Promise<DeliveryZone[]> {
  if (!supabase) return mockSite.deliveryCities.map((name, i) => ({ id: name, name, price: null, active: true, sort: i }))
  const rows = check(await supabase.from('delivery_zones').select('*').eq('active', true).order('sort')) as ZoneRow[]
  return rows.map(toZone)
}

/** التحقق من كود خصم بالسلة — بيرجع الخصم أو بيرمي غلط مفهوم */
export async function checkPromo(code: string, subtotal: number): Promise<AppliedPromo> {
  if (!supabase) throw new Error('أكواد الخصم بتشتغل لما يكون الموقع مربوط بقاعدة البيانات')
  const { data, error } = await supabase.rpc('check_promo', { promo_code: code, subtotal })
  if (error) throw new Error('ما قدرنا نتحقق من الكود — جرّب كمان مرة')
  const row = (Array.isArray(data) ? data[0] : data) as { code: string | null; kind: 'percent' | 'fixed'; value: number; discount: number; error: string | null } | undefined
  if (!row || row.error) {
    const e = row?.error ?? 'promo_invalid'
    if (e.startsWith('promo_min_total:')) throw new Error(`الكود بيشتغل على طلبات من ${Number(e.split(':')[1])} ₪ وفوق`)
    if (e === 'promo_expired') throw new Error('الكود منتهي أو لسا ما بلّش')
    if (e === 'promo_used_up') throw new Error('الكود خلص استعماله')
    throw new Error('الكود مش صحيح')
  }
  return { code: row.code!, kind: row.kind, value: Number(row.value), discount: Number(row.discount) }
}

/* ================================================================== */
/* لوحة التحكم — كل اللي تحت بيحتاج أدمن مسجّل دخول                     */
/* ================================================================== */

function requireBackend() {
  if (!supabase) throw new Error('Supabase مش مربوط — زيد المفاتيح بملف .env')
  return supabase
}

/* ---------- الدخول ---------- */

export async function getAdminSession(): Promise<{ email: string; isAdmin: boolean } | null> {
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  const user = data.session?.user
  if (!user) return null
  // جدول admins بيرجّع صف بس إذا المستخدم أدمن (قاعدة RLS)
  const { data: row } = await supabase.from('admins').select('user_id').eq('user_id', user.id).maybeSingle()
  return { email: user.email ?? '', isAdmin: !!row }
}

export async function adminSignIn(email: string, password: string) {
  const sb = requireBackend()
  const { error } = await sb.auth.signInWithPassword({ email, password })
  if (error) throw new Error(error.message === 'Invalid login credentials' ? 'الإيميل أو كلمة السر غلط' : error.message)
}

export async function adminSignOut() {
  await supabase?.auth.signOut()
}

/** رسائل أغلاط دوال الأدمن بالعربي */
const adminErrors: Record<string, string> = {
  invalid_code: 'كود التفعيل غلط أو منتهي',
  invalid_email: 'الإيميل مش صحيح',
  weak_password: 'كلمة السر لازم تكون ٨ حروف أو أكثر',
  not_admin: 'ما عندك صلاحية',
}
const adminError = (message: string) => new Error(Object.entries(adminErrors).find(([k]) => message.includes(k))?.[1] ?? message)

/** أول أدمن: بكود التفعيل، وبعدها بيسجّل دخول فورًا */
export async function setupFirstAdmin(code: string, email: string, password: string) {
  const sb = requireBackend()
  const { error } = await sb.rpc('setup_first_admin', { setup_code: code, admin_email: email, admin_password: password })
  if (error) throw adminError(error.message)
  await adminSignIn(email, password)
}

export interface AdminAccount {
  userId: string
  email: string
  createdAt: string
  lastSignInAt: string | null
  isMe: boolean
}

export async function adminListAdmins(): Promise<AdminAccount[]> {
  const sb = requireBackend()
  const { data, error } = await sb.rpc('admin_list')
  if (error) throw adminError(error.message)
  return ((data ?? []) as { user_id: string; email: string; created_at: string; last_sign_in_at: string | null; is_me: boolean }[]).map((r) => ({
    userId: r.user_id,
    email: r.email,
    createdAt: r.created_at,
    lastSignInAt: r.last_sign_in_at,
    isMe: r.is_me,
  }))
}

/** إضافة أدمن جديد (أو تغيير كلمة سر أدمن موجود بنفس الإيميل) */
export async function adminAddAdmin(email: string, password: string) {
  const sb = requireBackend()
  const { error } = await sb.rpc('admin_add', { admin_email: email, admin_password: password })
  if (error) throw adminError(error.message)
}

export async function adminRemoveAdmin(userId: string) {
  const sb = requireBackend()
  check(await sb.from('admins').delete().eq('user_id', userId))
}

/** تغيير كلمة سر الأدمن المسجّل دخول */
export async function adminChangePassword(password: string) {
  const sb = requireBackend()
  if (password.length < 8) throw new Error('كلمة السر لازم تكون ٨ حروف أو أكثر')
  const { error } = await sb.auth.updateUser({ password })
  if (error) throw new Error(error.message)
}

export function onAuthChange(callback: () => void) {
  if (!supabase) return () => {}
  const { data } = supabase.auth.onAuthStateChange(() => callback())
  return () => data.subscription.unsubscribe()
}

/* ---------- المنتجات ---------- */

export async function adminListProducts(): Promise<Product[]> {
  const sb = requireBackend()
  const rows = check(await sb.from('products').select(PRODUCT_SELECT).order('sort').order('created_at')) as ProductRow[]
  return rows.map(toProduct)
}

export async function adminGetProduct(id: string): Promise<Product | null> {
  const sb = requireBackend()
  const row = check(await sb.from('products').select(PRODUCT_SELECT).eq('id', id).maybeSingle()) as ProductRow | null
  return row ? toProduct(row) : null
}

/** حفظ منتج كامل: البيانات + الأحجام + خانات التخصيص (الأحجام والخانات بتنستبدل كلها) */
export async function adminSaveProduct(input: ProductInput): Promise<string> {
  const sb = requireBackend()
  const row = {
    slug: input.slug,
    name: input.name,
    category_id: input.categoryId || null,
    short_description: input.shortDescription,
    description: input.description,
    images: input.images,
    ingredients: input.ingredients,
    badge: input.badge?.trim() || null,
    featured: input.featured,
    active: input.active ?? true,
    sort: input.sort ?? 0,
    preview: input.preview ?? null,
    customization_enabled: input.customizationEnabled ?? true,
    ...(input.storageNote !== undefined ? { storage_note: input.storageNote } : {}),
  }

  let id = input.id
  if (id) {
    check(await sb.from('products').update(row).eq('id', id))
  } else {
    const created = check(await sb.from('products').insert(row).select('id').single()) as { id: string }
    id = created.id
  }

  check(await sb.from('product_sizes').delete().eq('product_id', id))
  if (input.sizes.length) {
    check(
      await sb.from('product_sizes').insert(
        input.sizes.map((s, i) => ({ product_id: id, label: s.label, pieces: s.pieces, price: s.price, sort: i })),
      ),
    )
  }

  check(await sb.from('product_fields').delete().eq('product_id', id))
  const fields = input.customization ?? []
  if (fields.length) {
    check(
      await sb.from('product_fields').insert(
        fields.map((f, i) => ({
          product_id: id,
          key: f.id,
          label: f.label,
          placeholder: f.placeholder,
          max_length: f.maxLength ?? null,
          sort: i,
        })),
      ),
    )
  }
  return id!
}

export async function adminUpdateProduct(id: string, patch: { active?: boolean; featured?: boolean; sort?: number }) {
  const sb = requireBackend()
  check(await sb.from('products').update(patch).eq('id', id))
}

export async function adminDeleteProduct(id: string) {
  const sb = requireBackend()
  check(await sb.from('products').delete().eq('id', id))
}

/** رفع صورة منتج — بيرجّع الرابط العام */
const uploadErrors: Record<string, string> = {
  unsupported_type: 'نوع الصورة مش مدعوم — استعمل JPG أو PNG أو WEBP',
  too_large: 'الصورة كبيرة كثير (أكثر من 8 ميغا)',
  not_admin: 'ما عندك صلاحية',
  unauthorized: 'لازم تسجّل دخول من جديد',
  storage_not_configured: 'تخزين الصور مش مضبوط لسا',
}

/** نص الغلط من دالة r2-upload */
async function functionError(error: unknown): Promise<Error> {
  const ctx = (error as { context?: Response })?.context
  try {
    const body = ctx ? await ctx.json() : null
    if (body?.error) return new Error(uploadErrors[body.error] ?? body.error)
  } catch {
    /* مش JSON */
  }
  return new Error(error instanceof Error ? error.message : 'صار غلط بالرفع')
}

/** رفع صورة منتج على Cloudflare R2 (عبر دالة r2-upload) — بيرجّع الرابط العام */
export async function adminUploadImage(file: Blob, name: string): Promise<string> {
  const sb = requireBackend()
  const { data, error } = await sb.functions.invoke<{ url: string }>('r2-upload', {
    body: file,
    headers: { 'Content-Type': file.type || 'image/jpeg', 'x-file-name': encodeURIComponent(name) },
  })
  if (error || !data?.url) throw await functionError(error)
  return data.url
}

/** حذف صورة من R2 (الصور اللي مش على R2 بتنتجاهل) */
export async function adminDeleteImage(url: string) {
  const sb = requireBackend()
  await sb.functions.invoke('r2-upload', { body: { action: 'delete', url } })
}

/* ---------- الأقسام ---------- */

export async function adminSaveCategory(category: Omit<Category, 'id'> & { id?: string }): Promise<void> {
  const sb = requireBackend()
  const row = {
    slug: category.slug,
    name: category.name,
    latin_name: category.latinName,
    description: category.description,
    tone: category.tone,
    color: category.color || null,
    sort: category.sort ?? 0,
  }
  if (category.id) check(await sb.from('categories').update(row).eq('id', category.id))
  else check(await sb.from('categories').insert(row))
}

export async function adminDeleteCategory(id: string) {
  const sb = requireBackend()
  check(await sb.from('categories').delete().eq('id', id))
}

/* ---------- الإعدادات ---------- */

export async function adminSaveSettings(s: SiteInfo) {
  const sb = requireBackend()
  check(
    await sb
      .from('site_settings')
      .update({
        name: s.name,
        latin_name: s.latinName,
        tagline: s.tagline,
        whatsapp: s.whatsapp.replace(/\D/g, ''),
        phone_display: s.phoneDisplay,
        instagram: s.instagram,
        address: s.address,
        hours: s.hours,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 1),
  )
}

/** حفظ نصوص الصفحة الرئيسية */
export async function adminSaveContent(content: SiteContent) {
  const sb = requireBackend()
  check(await sb.from('site_settings').update({ content, updated_at: new Date().toISOString() }).eq('id', 1))
}

/* ---------- التوصيل (أدمن) ---------- */

export async function adminListZones(): Promise<DeliveryZone[]> {
  const sb = requireBackend()
  const rows = check(await sb.from('delivery_zones').select('*').order('sort').order('created_at')) as ZoneRow[]
  return rows.map(toZone)
}

export async function adminSaveZone(z: Omit<DeliveryZone, 'id'> & { id?: string }) {
  const sb = requireBackend()
  const row = { name: z.name.trim(), price: z.price, active: z.active, sort: z.sort }
  if (z.id) check(await sb.from('delivery_zones').update(row).eq('id', z.id))
  else check(await sb.from('delivery_zones').insert(row))
}

export async function adminDeleteZone(id: string) {
  const sb = requireBackend()
  check(await sb.from('delivery_zones').delete().eq('id', id))
}

/** ملاحظة التوصيل وأيام التحضير (من جدول الإعدادات) */
export async function adminSaveDeliverySettings(deliveryNote: string, minLeadDays: number) {
  const sb = requireBackend()
  check(await sb.from('site_settings').update({ delivery_note: deliveryNote, min_lead_days: minLeadDays, updated_at: new Date().toISOString() }).eq('id', 1))
}

/* ---------- أكواد الخصم ---------- */

interface PromoRow {
  id: string
  code: string
  kind: 'percent' | 'fixed'
  value: number | string
  min_total: number | string
  max_uses: number | null
  uses: number
  starts_at: string | null
  expires_at: string | null
  active: boolean
  note: string
}

const toPromo = (r: PromoRow): PromoCode => ({
  id: r.id,
  code: r.code,
  kind: r.kind,
  value: Number(r.value),
  minTotal: Number(r.min_total),
  maxUses: r.max_uses ?? undefined,
  uses: r.uses,
  startsAt: r.starts_at ?? undefined,
  expiresAt: r.expires_at ?? undefined,
  active: r.active,
  note: r.note,
})

export async function adminListPromos(): Promise<PromoCode[]> {
  const sb = requireBackend()
  const rows = check(await sb.from('promo_codes').select('*').order('created_at', { ascending: false })) as PromoRow[]
  return rows.map(toPromo)
}

export async function adminSavePromo(p: Omit<PromoCode, 'id' | 'uses'> & { id?: string }) {
  const sb = requireBackend()
  const row = {
    code: p.code.trim().toUpperCase(),
    kind: p.kind,
    value: p.value,
    min_total: p.minTotal || 0,
    max_uses: p.maxUses || null,
    starts_at: p.startsAt || null,
    expires_at: p.expiresAt || null,
    active: p.active,
    note: p.note,
  }
  if (p.id) check(await sb.from('promo_codes').update(row).eq('id', p.id))
  else check(await sb.from('promo_codes').insert(row))
}

export async function adminDeletePromo(id: string) {
  const sb = requireBackend()
  check(await sb.from('promo_codes').delete().eq('id', id))
}

/* ---------- الطلبات ---------- */

export async function adminListOrders(status?: OrderStatus): Promise<OrderRecord[]> {
  const sb = requireBackend()
  let query = sb.from('orders').select('*').order('created_at', { ascending: false }).limit(200)
  if (status) query = query.eq('status', status)
  const rows = check(await query) as OrderRow[]
  return rows.map(toOrder)
}

/** عدد الطلبات الجديدة (لعدّاد القائمة) */
export async function adminCountNewOrders(): Promise<number> {
  const sb = requireBackend()
  const { count, error } = await sb.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'new')
  if (error) throw new Error(error.message)
  return count ?? 0
}

export async function adminUpdateOrder(id: string, patch: { status?: OrderStatus; adminNote?: string }) {
  const sb = requireBackend()
  const row: Record<string, string> = {}
  if (patch.status) row.status = patch.status
  if (patch.adminNote !== undefined) row.admin_note = patch.adminNote
  check(await sb.from('orders').update(row).eq('id', id))
}

export async function adminDeleteOrder(id: string) {
  const sb = requireBackend()
  check(await sb.from('orders').delete().eq('id', id))
}
