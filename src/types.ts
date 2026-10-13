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
