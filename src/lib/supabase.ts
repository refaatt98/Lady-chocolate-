import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * اتصال Supabase. المفاتيح العامة بـ .env (أو متغيرات Netlify).
 * إذا مش موجودين، supabase = null والموقع بيرجع للبيانات الوهمية بـ src/data.
 */
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY) as string | undefined

export const supabase: SupabaseClient | null = url && key ? createClient(url, key) : null

export const PRODUCT_IMAGES_BUCKET = 'product-images'
