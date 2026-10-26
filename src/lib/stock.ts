import type { Product } from '../types'

/** من هالرقم وتحت منكتب "باقي كم قطعة" */
export const LOW_STOCK = 3

/** الكمية الباقية، أو null إذا المنتج ما عليه تتبّع كمية */
export const stockLeft = (p: Pick<Product, 'trackStock' | 'stock'>): number | null =>
  p.trackStock ? Math.max(0, p.stock ?? 0) : null

export const isSoldOut = (p: Pick<Product, 'trackStock' | 'stock'>) => stockLeft(p) === 0

export const isLowStock = (p: Pick<Product, 'trackStock' | 'stock'>) => {
  const n = stockLeft(p)
  return n !== null && n > 0 && n <= LOW_STOCK
}

const arabicDigits = new Intl.NumberFormat('ar')
/** "باقي ٢ بس" */
export const leftLabel = (n: number) => (n === 1 ? 'باقي وحدة بس' : `باقي ${arabicDigits.format(n)} بس`)
