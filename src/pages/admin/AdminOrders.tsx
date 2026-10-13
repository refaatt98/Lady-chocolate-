import { ChevronDown, Gift, MessageCircle, Phone, RefreshCw, ShoppingBag, Trash2 } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useState } from 'react'
import { Button, PageHeader, TextArea, errorText, useToast } from '../../components/admin/ui'
import { adminDeleteOrder, adminListOrders, adminUpdateOrder } from '../../lib/api'
import { formatPrice, whatsappLink } from '../../lib/format'
import { timeSlots } from '../../lib/order'
import type { OrderRecord, OrderStatus } from '../../types'

export const statuses: { id: OrderStatus; label: string; cls: string }[] = [
  { id: 'new', label: 'جديد', cls: 'bg-caramel/25 text-cocoa' },
  { id: 'preparing', label: 'قيد التحضير', cls: 'bg-sand text-cocoa-deep' },
  { id: 'ready', label: 'جاهز', cls: 'bg-olive-soft/30 text-olive-deep' },
  { id: 'delivered', label: 'انسلّم', cls: 'bg-olive text-parchment' },
  { id: 'cancelled', label: 'ملغي', cls: 'bg-cocoa/10 text-cocoa/60 line-through' },
]
const statusOf = (id: OrderStatus) => statuses.find((s) => s.id === id) ?? statuses[0]

/** رقم فلسطيني محلي (05...) → دولي لواتساب (970...) */
const toWhatsapp = (phone: string) => {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('00')) return digits.slice(2)
  if (digits.startsWith('0')) return `970${digits.slice(1)}`
  return digits
}

const dateFmt = new Intl.DateTimeFormat('ar', { dateStyle: 'medium', timeStyle: 'short' })

export function AdminOrders() {
  const toast = useToast()
  const [filter, setFilter] = useState<OrderStatus | ''>('')
  const [orders, setOrders] = useState<OrderRecord[] | null>(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setOrders(await adminListOrders())
    } catch (e) {
      toast(errorText(e), 'error')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    load()
  }, [load])

  const shown = (orders ?? []).filter((o) => !filter || o.status === filter)
  const patch = (id: string, change: Partial<OrderRecord>) => setOrders((list) => list?.map((o) => (o.id === id ? { ...o, ...change } : o)) ?? null)

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        icon={ShoppingBag}
        title="الطلبات"
        description="كل طلب بينبعت على الواتساب بينحفظ هون — أكّده، حضّره، وسلّمه."
        actions={
          <Button variant="secondary" onClick={load} loading={loading}>
            {!loading && <RefreshCw className="size-4" />} تحديث
          </Button>
        }
      />

      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {[{ id: '' as const, label: 'الكل' }, ...statuses].map((s) => {
          const n = s.id ? (orders ?? []).filter((o) => o.status === s.id).length : (orders ?? []).length
          return (
            <button
              key={s.id || 'all'}
              type="button"
              onClick={() => setFilter(s.id)}
              className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm transition ${filter === s.id ? 'bg-olive text-parchment' : 'bg-parchment text-cocoa-deep/75 hover:bg-sand/50'}`}
            >
              {s.label}
              <span className={`grid min-w-5 place-items-center rounded-full px-1 text-xs ${filter === s.id ? 'bg-parchment/20' : 'bg-sand/70'}`}>{n}</span>
            </button>
          )
        })}
      </div>

      {!orders ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-sand/40" />)}</div>
      ) : shown.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-sand-deep/60 px-6 py-16 text-center">
          <p className="font-display text-3xl text-olive">ما في طلبات {filter ? `"${statusOf(filter).label}"` : 'لسا'}</p>
          <p className="mt-2 text-sm text-cocoa/60">أول ما حدا يطلب من الموقع، بيطلع هون.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {shown.map((order) => (
            <OrderRow
              key={order.id}
              order={order}
              onChange={async (change) => {
                const before = order
                patch(order.id, change)
                try {
                  await adminUpdateOrder(order.id, change)
                  if (change.status) toast(`الطلب ${order.reference}: ${statusOf(change.status).label}`)
                } catch (e) {
                  patch(order.id, before)
                  toast(errorText(e), 'error')
                }
              }}
              onDelete={async () => {
                if (!confirm(`متأكد بدك تحذف الطلب ${order.reference}؟`)) return
                try {
                  await adminDeleteOrder(order.id)
                  setOrders((list) => list?.filter((o) => o.id !== order.id) ?? null)
                  toast('انحذف الطلب')
                } catch (e) {
                  toast(errorText(e), 'error')
                }
              }}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

function OrderRow({ order, onChange, onDelete }: { order: OrderRecord; onChange: (c: { status?: OrderStatus; adminNote?: string }) => void; onDelete: () => void }) {
  const [open, setOpen] = useState(order.status === 'new')
  const [note, setNote] = useState(order.adminNote)
  const { info } = order
  const status = statusOf(order.status)
  const time = timeSlots.find((t) => t.id === info.time)?.label

  return (
    <li className="overflow-hidden rounded-2xl border border-sand-deep/40 bg-parchment">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full flex-wrap items-center gap-x-4 gap-y-2 px-4 py-4 text-right sm:px-5">
        <span dir="ltr" className="font-latin text-sm font-semibold text-cocoa">{order.reference}</span>
        <span className={`rounded-full px-2.5 py-0.5 text-xs ${status.cls}`}>{status.label}</span>
        <span className="min-w-0 flex-1 truncate text-cocoa-deep">
          {info.name} · {info.method === 'delivery' ? info.city || 'توصيل' : 'استلام'}
          {info.date && <span className="text-cocoa/60"> · {info.date}</span>}
        </span>
        <span className="font-semibold text-cocoa">{formatPrice(order.total)}</span>
        <ChevronDown className={`size-4 text-cocoa/50 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="grid gap-6 border-t border-sand/70 px-4 py-5 sm:px-5 md:grid-cols-2">
              {/* المنتجات */}
              <div>
                <h3 className="mb-3 text-xs font-semibold tracking-wide text-cocoa/60">المنتجات</h3>
                <ul className="space-y-3">
                  {order.items.map((item, i) => (
                    <li key={i} className="flex gap-3">
                      {item.image && <img src={item.image} alt="" className="size-14 shrink-0 rounded-lg object-cover object-[center_62%]" />}
                      <div className="min-w-0 text-sm">
                        <p className="font-medium text-cocoa-deep">
                          {item.name} <span className="text-cocoa/60">× {item.qty}</span>
                        </p>
                        <p className="text-xs text-cocoa/60">
                          {item.sizeLabel} · {item.pieces} قطعة · {formatPrice(item.unitPrice * item.qty)}
                        </p>
                        {item.details.filter(([, v]) => v).map(([k, v]) => (
                          <p key={k} className="text-xs">
                            <span className="text-cocoa/60">{k}:</span> <span className="font-display text-base">{v}</span>
                          </p>
                        ))}
                        {item.note && <p className="mt-1 rounded-lg bg-caramel/15 px-2 py-1 text-xs">📝 {item.note}</p>}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* الزبون والتوصيل */}
              <div className="space-y-3 text-sm">
                <h3 className="text-xs font-semibold tracking-wide text-cocoa/60">الزبون والتوصيل</h3>
                <p>
                  <span className="text-cocoa/60">الاسم:</span> {info.name}
                </p>
                <p className="flex flex-wrap items-center gap-2">
                  <span className="text-cocoa/60">الرقم:</span>
                  <a href={`tel:${info.phone}`} dir="ltr" className="text-olive underline-offset-2 hover:underline">{info.phone}</a>
                </p>
                {info.method === 'delivery' ? (
                  <>
                    <p><span className="text-cocoa/60">التوصيل:</span> {info.city} — {info.address}</p>
                    {info.receiverPhone && (
                      <p>
                        <span className="text-cocoa/60">رقم المستلم:</span> <a href={`tel:${info.receiverPhone}`} dir="ltr" className="text-olive">{info.receiverPhone}</a>
                      </p>
                    )}
                  </>
                ) : (
                  <p><span className="text-cocoa/60">الاستلام:</span> من المحل</p>
                )}
                {info.date && <p><span className="text-cocoa/60">الموعد:</span> {info.date}{time ? ` — ${time}` : ''}</p>}
                {info.isGift && (
                  <p className="flex items-start gap-1.5"><Gift className="mt-0.5 size-4 text-cocoa" /> هدية{info.giftMessage && <>: <span className="font-display text-base">"{info.giftMessage}"</span></>}</p>
                )}
                {info.notes && <p className="rounded-lg bg-caramel/15 px-3 py-2">📝 {info.notes}</p>}
                {(order.discount > 0 || order.deliveryFee > 0) && (
                  <div className="space-y-1 rounded-lg bg-cream/70 px-3 py-2 text-xs">
                    {order.discount > 0 && (
                      <p className="flex justify-between"><span>🏷️ كود {order.promoCode}</span><span>−{formatPrice(order.discount)}</span></p>
                    )}
                    {order.deliveryFee > 0 && (
                      <p className="flex justify-between"><span>🚚 التوصيل</span><span>{formatPrice(order.deliveryFee)}</span></p>
                    )}
                    <p className="flex justify-between font-semibold"><span>المجموع</span><span>{formatPrice(order.total)}</span></p>
                  </div>
                )}
                <p className="text-xs text-cocoa/50">انطلب {dateFmt.format(new Date(order.createdAt))}</p>
              </div>
            </div>

            {/* إجراءات */}
            <div className="space-y-4 border-t border-sand/70 bg-cream/40 px-4 py-4 sm:px-5">
              <div className="flex flex-wrap gap-2">
                {statuses.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => onChange({ status: s.id })}
                    className={`rounded-full border px-3.5 py-1.5 text-sm transition ${order.status === s.id ? 'border-olive bg-olive text-parchment' : 'border-sand-deep/60 bg-parchment hover:border-olive'}`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                <TextArea rows={1} value={note} onChange={(e) => setNote(e.target.value)} placeholder="ملاحظة داخلية (ما بيشوفها الزبون)" />
                {note !== order.adminNote && (
                  <Button variant="secondary" onClick={() => onChange({ adminNote: note })}>
                    حفظ الملاحظة
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <a
                  href={whatsappLink(toWhatsapp(info.phone), `مرحبا ${info.name} 🤍\nبخصوص طلبك رقم ${order.reference} من الليدي شوكولات:\n`)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-olive px-4 py-2.5 text-sm text-parchment hover:bg-olive-deep"
                >
                  <MessageCircle className="size-4" /> راسل الزبون
                </a>
                <a href={`tel:${info.phone}`} className="inline-flex items-center gap-2 rounded-full border border-sand-deep/70 px-4 py-2.5 text-sm hover:border-olive">
                  <Phone className="size-4" /> اتصال
                </a>
                <Button variant="ghost" className="ms-auto" onClick={onDelete}>
                  <Trash2 className="size-4" /> حذف
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  )
}
