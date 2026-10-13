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
  sort?: number
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
  /** مفتاح إنجليزي (name, date...) — بيستعمله TrayPreviewSpec */
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
  /** مخفي عن الزبائن إذا false (بيضل بلوحة التحكم) */
  active?: boolean
  sort?: number
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
  /** ملاحظة بتطلع بصفحة الطلب عن التوصيل */
  deliveryNote: string
  /** مدن مقترحة لخانة المدينة (الزبون بيقدر يكتب غيرها) */
  deliveryCities: string[]
  /** كم يوم لازم الطلب يكون قبل الموعد */
  minLeadDays: number
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
  /** ملاحظة الزبون على هالمنتج بالذات (ألوان، ترتيب، طلب خاص...) */
  note?: string
}

/** معلومات الزبون والتوصيل — بتنحفظ بالجهاز عشان ما يعبيها كل مرة */
export interface CheckoutInfo {
  name: string
  phone: string
  method: 'delivery' | 'pickup'
  city: string
  address: string
  /** رقم اللي بيستلم الطلبية إذا غير رقم الزبون */
  receiverPhone: string
  date: string
  time: string
  isGift: boolean
  giftMessage: string
  notes: string
}

/* ---------------- لوحة التحكم ---------------- */

export type OrderStatus = 'new' | 'preparing' | 'ready' | 'delivered' | 'cancelled'

/** طلب محفوظ بقاعدة البيانات */
export interface OrderRecord {
  id: string
  reference: string
  items: OrderItem[]
  info: CheckoutInfo
  total: number
  status: OrderStatus
  adminNote: string
  createdAt: string
}

/** شو بيبعت الأدمن لما يحفظ منتج (السعر بينحسب من أرخص حجم) */
export type ProductInput = Omit<Product, 'id' | 'price'> & { id?: string }
