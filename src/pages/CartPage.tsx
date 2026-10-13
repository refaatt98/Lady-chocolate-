import { ArrowLeft, Check, ChevronDown, Gift, MessageCircle, Minus, PenLine, Plus, Store, Trash2, Truck } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useMemo, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import { ChocolatePetal } from '../components/ChocolatePetal'
import { submitOrder } from '../lib/api'
import { CURRENCY, formatPrice, whatsappLink } from '../lib/format'
import { orderMessage, timeSlots, useOrder, validateCheckout, type CheckoutErrors } from '../lib/order'
import { useSite } from '../lib/site-context'
import type { CheckoutInfo, OrderItem } from '../types'

/** تاريخ اليوم + أيام، بصيغة yyyy-mm-dd (للـ input type=date) */
const isoDate = (addDays: number) => {
  const d = new Date()
  d.setDate(d.getDate() + addDays)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function CartPage() {
  const { items, total, info, setInfo, clear } = useOrder()
  const site = useSite()
  const navigate = useNavigate()
  const [errors, setErrors] = useState<CheckoutErrors>({})
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState<{ reference: string; url: string } | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  const minDate = isoDate(site?.minLeadDays ?? 0)
  const message = useMemo(() => orderMessage(items, total, CURRENCY, info), [items, total, info])

  const update = (patch: Partial<CheckoutInfo>) => {
    setInfo(patch)
    // منشيل الغلط عن الخانة أول ما الزبون يصلّحها
    const keys = Object.keys(patch) as (keyof CheckoutInfo)[]
    if (keys.some((k) => errors[k])) setErrors((e) => Object.fromEntries(Object.entries(e).filter(([k]) => !keys.includes(k as keyof CheckoutInfo))))
  }

  const send = async () => {
    const found = validateCheckout(info, minDate)
    setErrors(found)
    const first = Object.keys(found)[0]
    if (first) {
      document.getElementById(`field-${first}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    if (!site) return
    // منفتح النافذة فورًا (قبل الـ await) عشان المتصفح ما يمنعها
    const win = window.open('', '_blank')
    setSending(true)
    try {
      const { reference } = await submitOrder({ items, info, total })
      const url = whatsappLink(site.whatsapp, orderMessage(items, total, CURRENCY, info, reference))
      if (win) win.location.href = url
      else window.location.href = url
      setSent({ reference, url })
    } catch {
      win?.close()
    } finally {
      setSending(false)
    }
  }

  if (!items.length && !sent) return <EmptyOrder />

  return (
    <div className="pb-16">
      <section className="mx-auto max-w-6xl px-4 pt-8 pb-10 text-center sm:px-6 md:pt-14">
        <p dir="ltr" className="font-latin text-xs tracking-[0.4em] text-cocoa/60 uppercase">
          Your Order
        </p>
        <h1 className="font-display mt-3 text-5xl text-olive md:text-6xl">طلبيتي</h1>
        <ol className="mx-auto mt-8 flex max-w-md items-center justify-between text-sm">
          {['المنتجات', 'التوصيل', 'الإرسال'].map((s, i) => (
            <li key={s} className="flex flex-1 items-center gap-2 last:flex-none">
              <span className="flex items-center gap-2 whitespace-nowrap text-cocoa/80">
                <span className="font-display grid size-8 place-items-center rounded-full bg-olive text-cream">{['١', '٢', '٣'][i]}</span>
                {s}
              </span>
              {i < 2 && <span className="mx-2 h-px flex-1 border-t border-dashed border-sand-deep" />}
            </li>
          ))}
        </ol>
      </section>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[1.35fr_1fr] lg:gap-12">
        <div className="space-y-12">
          {/* ١ المنتجات */}
          <Card title="المنتجات" n="١" action={<Link to="/shop" className="text-sm text-cocoa underline-offset-4 hover:underline">+ ضيف كمان</Link>}>
            <ul className="divide-y divide-sand">
              <AnimatePresence initial={false}>
                {items.map((item) => (
                  <ItemRow key={item.key} item={item} />
                ))}
              </AnimatePresence>
            </ul>
          </Card>

          {/* ٢ التوصيل */}
          <Card title="معلومات التوصيل" n="٢">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field id="name" label="الاسم" error={errors.name}>
                <input id="field-name" value={info.name} onChange={(e) => update({ name: e.target.value })} autoComplete="name" placeholder="اسمك الكريم" className={inputCls(errors.name)} />
              </Field>
              <Field id="phone" label="رقم الجوال" error={errors.phone}>
                <input
                  id="field-phone"
                  type="tel"
                  dir="ltr"
                  inputMode="tel"
                  autoComplete="tel"
                  value={info.phone}
                  onChange={(e) => update({ phone: e.target.value })}
                  placeholder="0599 123 456"
                  className={`${inputCls(errors.phone)} text-right`}
                />
              </Field>
            </div>

            {/* طريقة الاستلام */}
            <div role="radiogroup" aria-label="طريقة الاستلام" className="mt-6 grid grid-cols-2 gap-3">
              {(
                [
                  ['delivery', 'توصيل', 'لباب البيت أو القاعة', Truck],
                  ['pickup', 'استلام', site?.address ? `من المحل — ${site.address}` : 'من المحل', Store],
                ] as const
              ).map(([id, label, sub, Icon]) => {
                const active = info.method === id
                return (
                  <button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => update({ method: id })}
                    className={`relative flex flex-col items-start gap-1 rounded-2xl border p-4 text-right transition ${active ? 'border-olive bg-olive/[0.06]' : 'border-sand-deep/50 hover:border-sand-deep'}`}
                  >
                    <Icon className={`size-6 ${active ? 'text-olive' : 'text-cocoa/50'}`} aria-hidden />
                    <span className="font-display text-2xl text-cocoa-deep">{label}</span>
                    <span className="text-xs text-cocoa/60">{sub}</span>
                    {active && (
                      <motion.span layoutId="method-check" className="absolute top-3 left-3 grid size-6 place-items-center rounded-full bg-olive text-cream">
                        <Check className="size-3.5" />
                      </motion.span>
                    )}
                  </button>
                )
              })}
            </div>

            <AnimatePresence initial={false}>
              {info.method === 'delivery' && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="grid gap-5 pt-6 sm:grid-cols-2">
                    <Field id="city" label="المدينة / البلد" error={errors.city}>
                      <input id="field-city" list="cities" value={info.city} onChange={(e) => update({ city: e.target.value })} placeholder="مثلًا: رام الله" className={inputCls(errors.city)} />
                      <datalist id="cities">
                        {site?.deliveryCities.map((c) => <option key={c} value={c} />)}
                      </datalist>
                    </Field>
                    <Field id="receiverPhone" label="رقم المستلم (إذا غير رقمك)" error={errors.receiverPhone}>
                      <input
                        id="field-receiverPhone"
                        type="tel"
                        dir="ltr"
                        inputMode="tel"
                        value={info.receiverPhone}
                        onChange={(e) => update({ receiverPhone: e.target.value })}
                        placeholder="اختياري"
                        className={`${inputCls(errors.receiverPhone)} text-right`}
                      />
                    </Field>
                    <Field id="address" label="العنوان بالتفصيل" error={errors.address} className="sm:col-span-2">
                      <textarea
                        id="field-address"
                        rows={2}
                        value={info.address}
                        onChange={(e) => update({ address: e.target.value })}
                        placeholder="الحي، الشارع، اسم البناية أو القاعة، وعلامة مميزة قريبة"
                        className={`${inputCls(errors.address)} resize-none`}
                      />
                    </Field>
                  </div>
                  {site?.deliveryNote && <p className="mt-3 rounded-xl bg-cream px-4 py-3 text-xs leading-relaxed text-cocoa/70">🚚 {site.deliveryNote}</p>}
                </motion.div>
              )}
            </AnimatePresence>

            {/* الموعد */}
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <Field id="date" label={info.method === 'delivery' ? 'موعد التوصيل' : 'موعد الاستلام'} error={errors.date} hint={site?.minLeadDays ? `منحتاج ${site.minLeadDays} أيام على الأقل للتحضير` : undefined}>
                <input id="field-date" type="date" min={minDate} value={info.date} onChange={(e) => update({ date: e.target.value })} className={inputCls(errors.date)} />
              </Field>
              <div>
                <span className="mb-2 block text-sm text-cocoa/70">الوقت المفضّل</span>
                <div className="flex flex-wrap gap-2">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot.id}
                      type="button"
                      aria-pressed={info.time === slot.id}
                      onClick={() => update({ time: info.time === slot.id ? '' : slot.id })}
                      className={`rounded-full border px-3.5 py-2 text-sm transition ${info.time === slot.id ? 'border-olive bg-olive text-cream' : 'border-sand-deep/60 text-cocoa/80 hover:border-sand-deep'}`}
                    >
                      {slot.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* ٣ ملاحظات وهدية */}
          <Card title="ملاحظات الطلب" n="٣">
            <Field id="notes" label="كيف بدك الطلبية؟" hint="أي تفصيلة بتفرق: ألوان، ترتيب، حساسية، وقت المناسبة، أو تعليمات للمندوب">
              <textarea
                id="field-notes"
                rows={4}
                maxLength={600}
                value={info.notes}
                onChange={(e) => update({ notes: e.target.value })}
                placeholder="مثلًا: المناسبة الساعة ٧ المسا، بدي الصينية توصل قبل بساعة. لما يوصل المندوب يتصل على رقم المستلم..."
                className={`${inputCls()} resize-none`}
              />
            </Field>

            <label className="mt-5 flex cursor-pointer items-center gap-3 rounded-2xl border border-sand-deep/50 p-4 transition hover:border-sand-deep">
              <input type="checkbox" checked={info.isGift} onChange={(e) => update({ isGift: e.target.checked })} className="size-5 accent-olive" />
              <Gift className="size-5 text-cocoa" aria-hidden />
              <span>
                <span className="block text-cocoa-deep">هاي هدية</span>
                <span className="text-xs text-cocoa/60">منحط معها كرت بخط إيد، وما منحط فيها السعر</span>
              </span>
            </label>
            <AnimatePresence initial={false}>
              {info.isGift && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="pt-4">
                    <Field id="giftMessage" label="شو نكتب على الكرت؟">
                      <textarea
                        id="field-giftMessage"
                        rows={2}
                        maxLength={150}
                        value={info.giftMessage}
                        onChange={(e) => update({ giftMessage: e.target.value })}
                        placeholder="ألف مبروك يا أحلى عرسان 🤍"
                        className={`${inputCls()} font-display resize-none text-xl`}
                      />
                    </Field>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </div>

        {/* الملخص */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="relative overflow-hidden rounded-[2rem] bg-olive-deep p-6 text-sand sm:p-8">
            <h2 className="font-display text-3xl text-cream">الملخص</h2>
            <ul className="mt-5 space-y-2 text-sm">
              {items.map((i) => (
                <li key={i.key} className="flex justify-between gap-3">
                  <span className="truncate">
                    {i.name} <span className="text-sand/60">× {i.qty}</span>
                  </span>
                  <span className="shrink-0">{formatPrice(i.unitPrice * i.qty)}</span>
                </li>
              ))}
              <li className="flex justify-between gap-3 text-sand/70">
                <span>{info.method === 'delivery' ? 'التوصيل' : 'الاستلام'}</span>
                <span>{info.method === 'delivery' ? 'منأكده معك' : 'مجاني'}</span>
              </li>
            </ul>
            <div className="mt-5 flex items-end justify-between border-t border-sand/20 pt-5">
              <span className="text-sand/70">المجموع التقريبي</span>
              <span className="font-display text-4xl text-cream">{formatPrice(total)}</span>
            </div>

            <button
              type="button"
              onClick={send}
              disabled={sending}
              className="group relative mt-6 flex w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-caramel py-4 text-lg text-cocoa-deep shadow-[0_15px_35px_-15px_rgb(184_135_95/0.9)] transition hover:bg-cream disabled:opacity-70"
            >
              <MessageCircle className="size-5" aria-hidden />
              {sending ? 'لحظة...' : 'ابعت الطلب على واتساب'}
            </button>
            {Object.keys(errors).length > 0 && <p className="mt-3 text-center text-sm text-caramel">في كم خانة ناقصة فوق — صلّحها وجرّب كمان مرة</p>}

            <button type="button" onClick={() => setShowPreview((v) => !v)} className="mt-5 flex w-full items-center justify-center gap-1 text-xs text-sand/60 hover:text-sand">
              شوف شكل الرسالة
              <ChevronDown className={`size-4 transition-transform ${showPreview ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence initial={false}>
              {showPreview && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  {/* فقاعة متل واتساب */}
                  <div className="mt-4 rounded-2xl rounded-tl-sm bg-[#dcf8c6] p-4 text-sm leading-relaxed whitespace-pre-line text-[#1f2c1a] shadow">{message}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <p className="mt-4 text-center text-xs leading-relaxed text-cocoa/60">ما في دفع هون. بعد ما توصلنا الرسالة، منأكد معك السعر النهائي والتوصيل وطريقة الدفع.</p>
        </aside>
      </div>

      {/* بعد الإرسال */}
      <AnimatePresence>
        {sent && (
          <motion.div className="fixed inset-0 z-[80] grid place-items-center bg-cocoa-deep/50 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div
              role="dialog"
              aria-modal="true"
              className="w-full max-w-sm rounded-[2rem] bg-parchment p-8 text-center shadow-2xl"
              initial={{ scale: 0.85, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 220, damping: 20 }}
            >
              <motion.div
                className="mx-auto grid size-24 place-items-center rounded-full border-4 border-double border-cocoa text-cocoa"
                initial={{ scale: 2, rotate: -30, opacity: 0 }}
                animate={{ scale: 1, rotate: -8, opacity: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 15 }}
              >
                <span className="font-display text-xl leading-tight">
                  تم
                  <br />
                  الطلب
                </span>
              </motion.div>
              <h2 className="font-display mt-6 text-3xl text-olive">شكرًا إلك 🤍</h2>
              <p className="mt-2 text-cocoa-deep/75">
                رقم طلبك <span dir="ltr" className="font-latin font-semibold text-cocoa">{sent.reference}</span>
              </p>
              <p className="mt-3 text-sm leading-relaxed text-cocoa/70">فتحنالك واتساب والرسالة جاهزة. بس اكبس إرسال هناك، ومنرد عليك بأقرب وقت.</p>
              <a href={sent.url} target="_blank" rel="noreferrer" className="mt-6 flex items-center justify-center gap-2 rounded-full border border-olive/40 py-3 text-olive transition hover:bg-olive/5">
                <MessageCircle className="size-4" aria-hidden />
                ما انفتح واتساب؟ افتحه من هون
              </a>
              <button
                type="button"
                onClick={() => {
                  clear()
                  setSent(null)
                  navigate('/')
                }}
                className="mt-3 w-full rounded-full bg-olive py-3.5 text-cream transition hover:bg-olive-deep"
              >
                بعتها — فضّي الطلبية
              </button>
              <button type="button" onClick={() => setSent(null)} className="mt-3 text-xs text-cocoa/60 underline-offset-4 hover:underline">
                لسا ما بعتها، رجّعني
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ------------------------------------------------------------------ */

const inputCls = (error?: string) =>
  `w-full rounded-xl border bg-cream/40 px-4 py-3 text-cocoa-deep placeholder:text-cocoa/35 transition focus:bg-parchment focus:outline-none ${
    error ? 'border-cocoa ring-2 ring-cocoa/15' : 'border-sand-deep/60 focus:border-olive'
  }`

function Field({ id, label, error, hint, className = '', children }: { id: string; label: string; error?: string; hint?: string; className?: string; children: ReactNode }) {
  return (
    <div className={className}>
      <label htmlFor={`field-${id}`} className="mb-2 block text-sm text-cocoa/70">
        {label}
      </label>
      {children}
      <AnimatePresence initial={false}>
        {error ? (
          <motion.p key="e" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-1.5 text-xs text-cocoa" role="alert">
            ● {error}
          </motion.p>
        ) : (
          hint && <p className="mt-1.5 text-xs text-cocoa/50">{hint}</p>
        )}
      </AnimatePresence>
    </div>
  )
}

function Card({ title, n, action, children }: { title: string; n: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section>
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-3">
          <span className="font-display grid size-9 place-items-center rounded-full bg-olive text-lg text-cream">{n}</span>
          <span className="font-display text-3xl text-olive">{title}</span>
        </h2>
        {action}
      </div>
      <div className="rounded-[1.75rem] border border-sand bg-parchment/70 p-5 shadow-[0_20px_40px_-30px_rgb(62_36_29/0.4)] sm:p-7">{children}</div>
    </section>
  )
}

function ItemRow({ item }: { item: OrderItem }) {
  const { setQty, remove, setNote } = useOrder()
  const [editing, setEditing] = useState(false)

  return (
    <motion.li layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden py-5 first:pt-0 last:pb-0">
      <div className="flex gap-4">
        <Link to={`/product/${item.slug}`} className="shrink-0">
          <img src={item.image} alt="" className="size-24 rounded-t-full rounded-b-xl object-cover object-[center_62%] sm:size-28" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <Link to={`/product/${item.slug}`} className="font-display text-2xl leading-tight text-olive hover:text-cocoa">
              {item.name}
            </Link>
            <button type="button" onClick={() => remove(item.key)} aria-label={`احذف ${item.name}`} className="p-1 text-cocoa/40 transition hover:text-cocoa">
              <Trash2 className="size-4" />
            </button>
          </div>
          <p className="mt-0.5 text-sm text-cocoa/70">
            {item.sizeLabel} · {item.pieces} قطعة · {formatPrice(item.unitPrice)}
          </p>
          {item.details
            .filter(([, v]) => v.trim())
            .map(([k, v]) => (
              <p key={k} className="text-sm text-cocoa/60">
                {k}: <span className="font-display text-base text-cocoa-deep">{v}</span>
              </p>
            ))}
          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="flex items-center rounded-full border border-sand-deep/60">
              <button type="button" onClick={() => setQty(item.key, item.qty + 1)} aria-label="زيادة" className="grid size-9 place-items-center text-olive">
                <Plus className="size-3.5" />
              </button>
              <span className="w-6 text-center tabular-nums">{item.qty}</span>
              <button type="button" onClick={() => setQty(item.key, item.qty - 1)} aria-label="إنقاص" className="grid size-9 place-items-center text-olive">
                <Minus className="size-3.5" />
              </button>
            </div>
            <span className="font-semibold text-cocoa">{formatPrice(item.unitPrice * item.qty)}</span>
          </div>
        </div>
      </div>

      {/* ملاحظة على المنتج */}
      {editing ? (
        <textarea
          autoFocus
          rows={2}
          maxLength={300}
          value={item.note ?? ''}
          onChange={(e) => setNote(item.key, e.target.value)}
          onBlur={() => setEditing(false)}
          placeholder="ملاحظة على هالصينية بالذات..."
          className="mt-3 w-full resize-none rounded-xl border border-sand-deep/60 bg-cream/40 px-4 py-3 text-sm focus:border-olive focus:outline-none"
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="mt-3 flex w-full items-start gap-2 rounded-xl border border-dashed border-sand-deep/70 px-4 py-2.5 text-right text-sm text-cocoa/70 transition hover:border-olive hover:text-olive"
        >
          <PenLine className="mt-0.5 size-4 shrink-0" aria-hidden />
          {item.note ? <span className="text-cocoa-deep">{item.note}</span> : 'ضيف ملاحظة على هالصينية'}
        </button>
      )}
    </motion.li>
  )
}

function EmptyOrder() {
  return (
    <section className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <div className="relative size-36">
        {Array.from({ length: 12 }, (_, i) => (
          <div key={i} className="absolute top-1/2 left-1/2 w-6" style={{ transform: `translate(-50%, -100%) rotate(${i * 30}deg)`, transformOrigin: '50% 100%' }}>
            <ChocolatePetal tone={i % 2 ? 'milk' : 'dark'} className="w-full opacity-25" />
          </div>
        ))}
      </div>
      <h1 className="font-display mt-6 text-4xl text-olive">الطلبية فاضية</h1>
      <p className="mt-3 leading-loose text-cocoa-deep/70">اختار صينية من التشكيلة، وخصّصها بأساميكم، وبعدين ارجع لهون تكمّل.</p>
      <Link to="/shop" className="group mt-8 inline-flex items-center gap-2 rounded-full bg-olive px-7 py-3.5 text-cream">
        تصفّح التشكيلة
        <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" aria-hidden />
      </Link>
    </section>
  )
}
