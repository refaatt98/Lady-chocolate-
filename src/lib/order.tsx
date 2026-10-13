import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { OrderItem } from '../types'

/**
 * "طلبيتي": سلة بسيطة محفوظة بالمتصفح. ما في دفع — بالآخر بتنبعث كلها برسالة واتساب.
 * لما نربط Supabase ممكن نحفظ الطلبيات هناك كمان.
 */

const KEY = 'lady-order'

const load = (): OrderItem[] => {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as OrderItem[]) : []
  } catch {
    return []
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
  remove: (key: string) => void
  clear: () => void
}

const OrderContext = createContext<OrderContextValue | null>(null)

export function OrderProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<OrderItem[]>(load)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(items))
    } catch {
      /* التخزين مش متاح — بتضل الطلبية للجلسة بس */
    }
  }, [items])

  const add = useCallback((item: Omit<OrderItem, 'key'>) => {
    // نفس المنتج بنفس الحجم والتخصيص = منزيد الكمية بدل سطر جديد
    const key = `${item.productId}|${item.sizeLabel}|${JSON.stringify(item.details)}|${item.eventDate ?? ''}`
    setItems((prev) => {
      const found = prev.find((i) => i.key === key)
      if (found) return prev.map((i) => (i.key === key ? { ...i, qty: i.qty + item.qty } : i))
      return [...prev, { ...item, key }]
    })
  }, [])

  const setQty = useCallback((key: string, qty: number) => {
    setItems((prev) => (qty <= 0 ? prev.filter((i) => i.key !== key) : prev.map((i) => (i.key === key ? { ...i, qty } : i))))
  }, [])

  const remove = useCallback((key: string) => setItems((prev) => prev.filter((i) => i.key !== key)), [])
  const clear = useCallback(() => setItems([]), [])

  const value = useMemo(
    () => ({
      items,
      count: items.reduce((n, i) => n + i.qty, 0),
      total: items.reduce((n, i) => n + i.qty * i.unitPrice, 0),
      open,
      setOpen,
      add,
      setQty,
      remove,
      clear,
    }),
    [items, open, add, setQty, remove, clear],
  )

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>
}

export function useOrder() {
  const ctx = useContext(OrderContext)
  if (!ctx) throw new Error('useOrder لازم يكون جوّا OrderProvider')
  return ctx
}

/** نص رسالة الواتساب لطلبية كاملة */
export function orderMessage(items: OrderItem[], total: number, currency: string) {
  const lines = items.map((item, i) => {
    const extra = [
      ...item.details.filter(([, v]) => v.trim()).map(([k, v]) => `   ${k}: ${v}`),
      item.eventDate ? `   موعد المناسبة: ${item.eventDate}` : '',
    ].filter(Boolean)
    return [`${i + 1}. ${item.name} — ${item.sizeLabel} (${item.pieces} قطعة) × ${item.qty} = ${item.unitPrice * item.qty} ${currency}`, ...extra].join('\n')
  })
  return ['مرحبا الليدي شوكولات 🍫', 'حابب أطلب:', '', ...lines, '', `المجموع التقريبي: ${total} ${currency}`].join('\n')
}
