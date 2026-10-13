import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { AppliedPromo, CheckoutInfo, OrderItem } from '../types'

/**
 * "طلبيتي": سلة بسيطة محفوظة بالمتصفح، مع معلومات الزبون والتوصيل.
 * ما في دفع — بالآخر كل إشي بينبعت برسالة واتساب وحدة مرتبة.
 * لما نربط Supabase منحفظ الطلبيات هناك كمان (createOrder بـ api.ts).
 */

const ITEMS_KEY = 'lady-order'
const INFO_KEY = 'lady-checkout'
const PROMO_KEY = 'lady-promo'

export const emptyCheckout: CheckoutInfo = {
  name: '',
  phone: '',
  method: 'delivery',
  city: '',
  address: '',
  receiverPhone: '',
  date: '',
  time: '',
  isGift: false,
  giftMessage: '',
  notes: '',
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback
  } catch {
    return fallback
  }
}

function readItems(): OrderItem[] {
  try {
    const raw = localStorage.getItem(ITEMS_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* التخزين مش متاح — بتضل البيانات للجلسة بس */
  }
}

interface OrderContextValue {
  items: OrderItem[]
  count: number
  total: number
  open: boolean
  setOpen: (open: boolean) => void
  add: (item: Omit<OrderItem, 'key'>) => void
  setQty: (key: string, qty: number) => void
  setNote: (key: string, note: string) => void
  remove: (key: string) => void
  clear: () => void
  info: CheckoutInfo
  setInfo: (patch: Partial<CheckoutInfo>) => void
  /** كود الخصم المطبّق (الخصم محسوب على المجموع وقت التطبيق) */
  promo: AppliedPromo | null
  setPromo: (promo: AppliedPromo | null) => void
}

const OrderContext = createContext<OrderContextValue | null>(null)

export function OrderProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<OrderItem[]>(readItems)
  const [info, setInfoState] = useState<CheckoutInfo>(() => read(INFO_KEY, emptyCheckout))
  const [open, setOpen] = useState(false)
  const [promo, setPromo] = useState<AppliedPromo | null>(() => {
    try {
      const raw = localStorage.getItem(PROMO_KEY)
      return raw ? (JSON.parse(raw) as AppliedPromo) : null
    } catch {
      return null
    }
  })

  useEffect(() => write(ITEMS_KEY, items), [items])
  useEffect(() => write(INFO_KEY, info), [info])
  useEffect(() => write(PROMO_KEY, promo), [promo])

  const add = useCallback((item: Omit<OrderItem, 'key'>) => {
    // نفس المنتج بنفس الحجم والتخصيص والملاحظة = منزيد الكمية بدل سطر جديد
    const key = `${item.productId}|${item.sizeLabel}|${JSON.stringify(item.details)}|${item.note ?? ''}`
    setItems((prev) => {
      const found = prev.find((i) => i.key === key)
      if (found) return prev.map((i) => (i.key === key ? { ...i, qty: i.qty + item.qty } : i))
      return [...prev, { ...item, key }]
    })
  }, [])

  const setQty = useCallback((key: string, qty: number) => {
    setItems((prev) => (qty <= 0 ? prev.filter((i) => i.key !== key) : prev.map((i) => (i.key === key ? { ...i, qty } : i))))
  }, [])

  const setNote = useCallback((key: string, note: string) => {
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, note } : i)))
  }, [])

  const remove = useCallback((key: string) => setItems((prev) => prev.filter((i) => i.key !== key)), [])
  const clear = useCallback(() => {
    setItems([])
    setPromo(null)
  }, [])
  const setInfo = useCallback((patch: Partial<CheckoutInfo>) => setInfoState((prev) => ({ ...prev, ...patch })), [])

  const value = useMemo(
    () => ({
      items,
      count: items.reduce((n, i) => n + i.qty, 0),
      total: items.reduce((n, i) => n + i.qty * i.unitPrice, 0),
      open,
      setOpen,
      add,
      setQty,
      setNote,
      remove,
      clear,
      info,
      setInfo,
      promo,
      setPromo,
    }),
    [items, open, add, setQty, setNote, remove, clear, info, setInfo, promo],
  )

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>
}

export function useOrder() {
  const ctx = useContext(OrderContext)
  if (!ctx) throw new Error('useOrder لازم يكون جوّا OrderProvider')
  return ctx
}

/* ------------------------------------------------------------------ */

/** رقم فلسطيني أو دولي معقول: ٩ أرقام وأكثر بعد ما نشيل الفراغات والشرطات */
export const isValidPhone = (phone: string) => /^\+?\d{9,15}$/.test(phone.replace(/[\s-]/g, ''))

export type CheckoutErrors = Partial<Record<keyof CheckoutInfo, string>>

export function validateCheckout(info: CheckoutInfo, minDate?: string): CheckoutErrors {
  const errors: CheckoutErrors = {}
  if (!info.name.trim()) errors.name = 'اكتب اسمك'
  if (!isValidPhone(info.phone)) errors.phone = 'اكتب رقم صحيح، مثلًا 0599123456'
  if (info.method === 'delivery') {
    if (!info.city.trim()) errors.city = 'وين بدك التوصيل؟'
    if (!info.address.trim()) errors.address = 'اكتب العنوان بالتفصيل'
    if (info.receiverPhone.trim() && !isValidPhone(info.receiverPhone)) errors.receiverPhone = 'الرقم مش صحيح'
  }
  if (!info.date) errors.date = 'اختار موعد التسليم'
  else if (minDate && info.date < minDate) errors.date = 'الموعد قريب كثير — اختار يوم أبعد'
  return errors
}

const timeLabels: Record<string, string> = {
  morning: 'الصبح (١٠–١٢)',
  noon: 'الظهر (١٢–٤)',
  evening: 'المسا (٤–٨)',
}
export const timeSlots = Object.entries(timeLabels).map(([id, label]) => ({ id, label }))

/** نص رسالة الواتساب: المنتجات + ملاحظاتها + معلومات التوصيل */
/**
 * deliveryFee: رقم = سعر التوصيل، null = بيتأكد على الواتساب، undefined = ما في توصيل/مش معروف لسا
 */
export function orderMessage(
  items: OrderItem[],
  total: number,
  currency: string,
  info?: CheckoutInfo,
  reference?: string,
  promo?: AppliedPromo | null,
  deliveryFee?: number | null,
) {
  const lines: string[] = ['مرحبا الليدي شوكولات 🍫', reference ? `طلب رقم: ${reference}` : '', 'حابب أطلب:', ''].filter((l, i) => l || i > 1)

  items.forEach((item, i) => {
    lines.push(`${i + 1}. ${item.name} — ${item.sizeLabel} (${item.pieces} قطعة) × ${item.qty} = ${item.unitPrice * item.qty} ${currency}`)
    item.details.filter(([, v]) => v.trim()).forEach(([k, v]) => lines.push(`   • ${k}: ${v}`))
    if (item.note?.trim()) lines.push(`   📝 ملاحظة: ${item.note.trim()}`)
  })

  const discount = promo && promo.discount > 0 ? promo.discount : 0
  const fee = info?.method === 'delivery' && typeof deliveryFee === 'number' ? deliveryFee : 0
  const extras = discount > 0 || fee > 0 || (info?.method === 'delivery' && deliveryFee !== undefined)
  if (extras) {
    lines.push('', `المنتجات: ${total} ${currency}`)
    if (discount > 0) lines.push(`🏷️ كود خصم ${promo!.code}: −${discount} ${currency}`)
    if (info?.method === 'delivery' && deliveryFee !== undefined) {
      lines.push(deliveryFee === null ? '🚚 التوصيل: بنتفق عليه' : `🚚 التوصيل: ${deliveryFee === 0 ? 'مجاني' : `${deliveryFee} ${currency}`}`)
    }
    lines.push(`💰 المجموع: ${Math.max(0, total - discount) + fee} ${currency}`)
  } else {
    lines.push('', `💰 المجموع التقريبي: ${total} ${currency}`)
  }

  if (info) {
    lines.push('', '— معلومات الطلب —', `👤 الاسم: ${info.name}`, `📞 الرقم: ${info.phone}`)
    if (info.method === 'delivery') {
      lines.push(`🚚 توصيل إلى: ${info.city}`, `📍 العنوان: ${info.address}`)
      if (info.receiverPhone.trim()) lines.push(`📞 رقم المستلم: ${info.receiverPhone}`)
    } else {
      lines.push('🏠 استلام من المحل')
    }
    if (info.date) lines.push(`📅 الموعد: ${info.date}${info.time ? ` — ${timeLabels[info.time] ?? info.time}` : ''}`)
    if (info.isGift) lines.push(`🎁 هدية${info.giftMessage.trim() ? ` — كرت: "${info.giftMessage.trim()}"` : ''}`)
    if (info.notes.trim()) lines.push('', `📝 ملاحظات: ${info.notes.trim()}`)
  }

  return lines.join('\n')
}
