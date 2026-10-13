/** قسم = نوع من أنواع الشوكولا البلجيكية */
export interface Category {
  id: string
  slug: string
  name: string
  /** اسم إنجليزي قصير للزينة تحت الاسم العربي */
  latinName: string
  description: string
  /** لون الكرت المعلق (أي لون من tokens) */
  tone: 'milk' | 'dark' | 'white' | 'caramel' | 'olive'
}

/** حجم أو خيار للمنتج، بسعره */
export interface ProductSize {
  id: string
  label: string
  pieces: number
  price: number
}

/** حقل تخصيص (اسم، تاريخ، عبارة...) بينضاف لرسالة الواتساب */
export interface CustomizationField {
  id: string
  label: string
  placeholder: string
  maxLength?: number
}

/**
 * معاينة الاسم على القرص: صورة مربعة للصينية، ومكان القرص فيها بالنسبة المئوية.
 * top/main/bottom = أي حقل تخصيص بينكتب فوق / بالنص (كبير) / تحت.
 */
export interface TrayPreviewSpec {
  image: string
  disc: { cx: number; cy: number; w: number; h: number }
  /** إذا القرص فيه رسمة بالنص التحتاني، منغطي بس الجزء الفوقاني لحد هالنسبة */
  coverTo?: number
  top?: string
  main: string
  bottom?: string
}

export interface Product {
  id: string
  slug: string
  name: string
  categoryId: string
  shortDescription: string
  description: string
  /** السعر الأساسي بالشيكل (أصغر حجم) */
  price: number
  images: string[]
  sizes: ProductSize[]
  ingredients: string[]
  customization?: CustomizationField[]
  preview?: TrayPreviewSpec
  featured: boolean
  badge?: string
}

export interface SiteInfo {
  name: string
  latinName: string
  tagline: string
  /** رقم واتساب بصيغة دولية بدون + أو أصفار، مثال: 970599000000 */
  whatsapp: string
  phoneDisplay: string
  instagram: string
  address: string
  hours: string
}

/** سطر بالطلبية (السلة) — بينبعت كله برسالة واتساب وحدة */
export interface OrderItem {
  key: string
  productId: string
  slug: string
  name: string
  image: string
  sizeLabel: string
  pieces: number
  unitPrice: number
  qty: number
  /** نصوص التخصيص: [اسم الحقل، القيمة] */
  details: [string, string][]
  eventDate?: string
}
