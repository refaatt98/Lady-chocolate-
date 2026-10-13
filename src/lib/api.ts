/**
 * طبقة جلب البيانات.
 * كل الموقع بيجيب بياناته من هون بس. لما نربط Supabase، بنغيّر جسم هالدوال
 * ومنخلي التواقيع (الأسماء وأنواع الرجوع) زي ما هي.
 */
import { categories } from '../data/categories'
import { products } from '../data/products'
import { site } from '../data/site'
import type { Category, CheckoutInfo, OrderItem, Product, SiteInfo } from '../types'

/** تأخير بسيط عشان نحاكي الشبكة */
const delay = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms))

export async function getSiteInfo(): Promise<SiteInfo> {
  await delay(0)
  return site
}

export async function getCategories(): Promise<Category[]> {
  await delay()
  return categories
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  await delay()
  return categories.find((c) => c.slug === slug) ?? null
}

export async function getProducts(options: { categorySlug?: string } = {}): Promise<Product[]> {
  await delay()
  if (!options.categorySlug) return products
  const category = categories.find((c) => c.slug === options.categorySlug)
  return category ? products.filter((p) => p.categoryId === category.id) : []
}

export async function getFeaturedProducts(): Promise<Product[]> {
  await delay()
  return products.filter((p) => p.featured)
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  await delay()
  return products.find((p) => p.slug === slug) ?? null
}

/**
 * تسجيل طلبية. هلأ بس بيولّد رقم طلب (بينكتب برسالة الواتساب).
 * مع Supabase: insert بجدول orders ورجّع الـ id الحقيقي.
 */
export async function submitOrder(order: { items: OrderItem[]; info: CheckoutInfo; total: number }): Promise<{ reference: string }> {
  await delay()
  void order
  const stamp = Date.now().toString(36).slice(-4).toUpperCase()
  const rand = Math.random().toString(36).slice(2, 4).toUpperCase()
  return { reference: `LC-${stamp}${rand}` }
}
