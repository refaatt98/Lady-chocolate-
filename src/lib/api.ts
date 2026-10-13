/**
 * طبقة جلب البيانات — كل الموقع (ولوحة التحكم) بيحكي مع البيانات من هون بس.
 * إذا Supabase مربوط (supabase != null) منجيب منه، وإذا لا منرجع للبيانات الوهمية بـ src/data.
 */
import { categories as mockCategories } from '../data/categories'
import { products as mockProducts } from '../data/products'
import { site as mockSite } from '../data/site'
import type {
  Category,
  CheckoutInfo,
  CustomizationField,
  OrderItem,
  OrderRecord,
  OrderStatus,
  Product,
  ProductInput,
  ProductSize,
  SiteInfo,
  TrayPreviewSpec,
} from '../types'
import { PRODUCT_IMAGES_BUCKET, supabase } from './supabase'

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
}

const bySort = <T extends { sort: number }>(a: T, b: T) => a.sort - b.sort

const toCategory = (r: CategoryRow): Category => ({
  id: r.id,
  slug: r.slug,
  name: r.name,
  latinName: r.latin_name,
  description: r.description,
  tone: r.tone,
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
export async function submitOrder(order: { items: OrderItem[]; info: CheckoutInfo; total: number }): Promise<{ reference: string }> {
  const reference = newReference()
  if (!supabase) {
    await delay()
    return { reference }
  }
  const { error } = await supabase.from('orders').insert({ reference, items: order.items, info: order.info, total: order.total })
  if (error) console.warn('ما انحفظ الطلب بقاعدة البيانات:', error.message)
  return { reference }
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
export async function adminUploadImage(file: Blob, name: string): Promise<string> {
  const sb = requireBackend()
  const ext = file.type === 'image/webp' ? 'webp' : file.type === 'image/png' ? 'png' : 'jpg'
  const safe = name.replace(/\.[^.]+$/, '').replace(/[^a-z0-9-]+/gi, '-').slice(0, 40) || 'image'
  const path = `${new Date().toISOString().slice(0, 7)}/${Date.now()}-${safe}.${ext}`
  check(await sb.storage.from(PRODUCT_IMAGES_BUCKET).upload(path, file, { contentType: file.type, cacheControl: '31536000' }))
  return sb.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(path).data.publicUrl
}

/** حذف صورة من التخزين (بس إذا كانت مرفوعة على Supabase) */
export async function adminDeleteImage(url: string) {
  const sb = requireBackend()
  const marker = `/object/public/${PRODUCT_IMAGES_BUCKET}/`
  const i = url.indexOf(marker)
  if (i === -1) return
  await sb.storage.from(PRODUCT_IMAGES_BUCKET).remove([decodeURIComponent(url.slice(i + marker.length))])
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
        delivery_note: s.deliveryNote,
        delivery_cities: s.deliveryCities,
        min_lead_days: s.minLeadDays,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 1),
  )
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
