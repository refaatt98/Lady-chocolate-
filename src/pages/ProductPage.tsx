import { CalendarHeart, ChevronDown, Image as ImageIcon, MessageCircle, Minus, PenLine, Plus, Share2, ShoppingBag, Check } from 'lucide-react'
import { AnimatePresence, motion, useInView } from 'motion/react'
import { useMemo, useRef, useState, type MouseEvent, type ReactNode } from 'react'
import { Link, useParams } from 'react-router'
import { AnimatedPrice } from '../components/AnimatedPrice'
import { ComingSoon } from '../components/ComingSoon'
import { ProductCard } from '../components/ProductCard'
import { SizePicker } from '../components/SizePicker'
import { TrayPreview } from '../components/TrayPreview'
import { getCategories, getProductBySlug, getProducts } from '../lib/api'
import { CURRENCY, formatPrice, whatsappLink } from '../lib/format'
import { orderMessage, useOrder } from '../lib/order'
import { useSite } from '../lib/site-context'
import { useAsync } from '../lib/useAsync'
import type { Product } from '../types'

export function ProductPage() {
  const { slug = '' } = useParams()
  const { data: product, loading } = useAsync(() => getProductBySlug(slug), [slug])

  if (loading) return <ProductSkeleton />
  if (!product) return <ComingSoon title="المنتج مش موجود" note="يمكن انشال من التشكيلة، أو الرابط فيه غلطة." />
  // key: لما نتنقّل بين منتجين، منبلّش الحالة من جديد
  return <ProductView key={product.id} product={product} />
}

/* ------------------------------------------------------------------ */

function ProductView({ product }: { product: Product }) {
  const site = useSite()
  const order = useOrder()
  const { data: categories } = useAsync(getCategories)
  const category = categories?.find((c) => c.id === product.categoryId)

  const [sizeId, setSizeId] = useState(product.sizes[0]?.id ?? '')
  const size = product.sizes.find((s) => s.id === sizeId) ?? product.sizes[0]
  const [qty, setQty] = useState(1)
  const [values, setValues] = useState<Record<string, string>>({})
  const [eventDate, setEventDate] = useState('')
  const [view, setView] = useState<'photo' | 'preview'>('photo')
  const [added, setAdded] = useState(false)
  const [flight, setFlight] = useState<{ from: DOMRect; to: DOMRect } | null>(null)

  const unitPrice = size?.price ?? product.price
  const fields = product.customization ?? []
  const details: [string, string][] = fields.map((f) => [f.label, values[f.id] ?? ''])

  const item = {
    productId: product.id,
    slug: product.slug,
    name: product.name,
    image: product.images[0],
    sizeLabel: size?.label ?? '',
    pieces: size?.pieces ?? 0,
    unitPrice,
    qty,
    details,
    eventDate: eventDate || undefined,
  }

  // زر الإضافة الأساسي — لما يختفي عن الشاشة بنطلّع شريط ثابت تحت (موبايل)
  const addRef = useRef<HTMLDivElement>(null)
  const addVisible = useInView(addRef, { margin: '0px 0px -40px 0px' })

  const handleAdd = (e: MouseEvent<HTMLButtonElement>) => {
    order.add(item)
    const bag = document.getElementById('order-bag')
    if (bag) setFlight({ from: e.currentTarget.getBoundingClientRect(), to: bag.getBoundingClientRect() })
    setAdded(true)
    setTimeout(() => setAdded(false), 2600)
  }

  const directMessage = orderMessage([{ ...item, key: 'direct' }], unitPrice * qty, CURRENCY)

  const share = async () => {
    const data = { title: product.name, text: product.shortDescription, url: window.location.href }
    try {
      if (navigator.share) await navigator.share(data)
      else await navigator.clipboard.writeText(data.url)
    } catch {
      /* المستخدم لغى المشاركة */
    }
  }

  return (
    <div className="pb-24 md:pb-0">
      {/* مسار الصفحة */}
      <nav aria-label="مسار الصفحة" className="mx-auto max-w-6xl px-4 pt-4 text-sm text-cocoa/60 sm:px-6">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link to="/" className="hover:text-olive">الرئيسية</Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link to="/shop" className="hover:text-olive">التشكيلة</Link>
          </li>
          {category && (
            <>
              <li aria-hidden>/</li>
              <li>
                <Link to={`/shop?category=${category.slug}`} className="hover:text-olive">{category.name}</Link>
              </li>
            </>
          )}
        </ol>
      </nav>

      <section className="mx-auto grid max-w-6xl gap-10 px-4 pt-6 pb-16 sm:px-6 md:grid-cols-2 md:gap-14 md:pt-10">
        {/* ---------------- المعرض ---------------- */}
        <div className="md:sticky md:top-24 md:self-start">
          <Gallery product={product} view={view} setView={setView} values={values} />
        </div>

        {/* ---------------- التفاصيل ---------------- */}
        <div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div className="flex items-center justify-between gap-3">
              {category && (
                <span className="rounded-full border border-sand-deep/60 px-3 py-1 text-xs text-cocoa/70">
                  {category.name} · <span dir="ltr" className="font-latin tracking-widest uppercase">{category.latinName}</span>
                </span>
              )}
              <button type="button" onClick={share} aria-label="شارك المنتج" className="grid size-10 place-items-center rounded-full text-cocoa/60 transition hover:bg-sand/40 hover:text-cocoa">
                <Share2 className="size-4" />
              </button>
            </div>
            <h1 className="font-display mt-4 text-5xl leading-tight text-olive md:text-6xl">{product.name}</h1>
            <p className="mt-4 text-lg leading-loose text-cocoa-deep/75">{product.shortDescription}</p>
            <div className="mt-5 flex items-baseline gap-3">
              <AnimatedPrice value={unitPrice * qty} className="font-display text-4xl text-cocoa" />
              {qty > 1 && <span className="text-sm text-cocoa/60">({formatPrice(unitPrice)} للوحدة)</span>}
            </div>
          </motion.div>

          <div className="mt-10 space-y-10">
            {/* ١ الحجم */}
            <Step n="١" title="اختار الحجم">
              <SizePicker sizes={product.sizes} value={sizeId} onChange={setSizeId} />
            </Step>

            {/* ٢ التخصيص */}
            {fields.length > 0 && (
              <Step n="٢" title="خصّصها" hint="اكتب وشوف النتيجة على الصينية فورًا">
                <div className="space-y-5">
                  {fields.map((f) => (
                    <label key={f.id} className="block">
                      <span className="flex items-center justify-between text-sm text-cocoa/70">
                        {f.label}
                        {f.maxLength && (
                          <span className="font-latin text-xs text-cocoa/40" dir="ltr">
                            {(values[f.id] ?? '').length}/{f.maxLength}
                          </span>
                        )}
                      </span>
                      <input
                        value={values[f.id] ?? ''}
                        maxLength={f.maxLength}
                        placeholder={f.placeholder}
                        onFocus={() => product.preview && setView('preview')}
                        onChange={(e) => setValues((v) => ({ ...v, [f.id]: e.target.value }))}
                        className="font-display mt-1 w-full border-b border-sand-deep/60 bg-transparent py-2 text-2xl text-cocoa-deep placeholder:text-cocoa/25 focus:border-olive focus:outline-none"
                      />
                    </label>
                  ))}
                  <label className="block">
                    <span className="flex items-center gap-2 text-sm text-cocoa/70">
                      <CalendarHeart className="size-4" aria-hidden />
                      موعد المناسبة (اختياري)
                    </span>
                    <input
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="mt-1 w-full border-b border-sand-deep/60 bg-transparent py-2 text-lg text-cocoa-deep focus:border-olive focus:outline-none"
                    />
                  </label>
                </div>
              </Step>
            )}

            {/* ٣ الكمية والطلب */}
            <Step n={fields.length ? '٣' : '٢'} title="الكمية">
              <div ref={addRef} className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center rounded-full border border-sand-deep/70">
                    <button type="button" onClick={() => setQty((q) => q + 1)} aria-label="زيادة" className="grid size-12 place-items-center text-olive">
                      <Plus className="size-4" />
                    </button>
                    <span className="w-8 text-center text-lg tabular-nums">{qty}</span>
                    <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="إنقاص" className="grid size-12 place-items-center text-olive disabled:opacity-30" disabled={qty <= 1}>
                      <Minus className="size-4" />
                    </button>
                  </div>
                  <AddButton onClick={handleAdd} added={added} className="flex-1" />
                </div>
                {site && (
                  <a
                    href={whatsappLink(site.whatsapp, directMessage)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-full border border-olive/40 py-3.5 text-olive transition hover:border-olive hover:bg-olive/5"
                  >
                    <MessageCircle className="size-4" aria-hidden />
                    أو اطلبها هلأ مباشرة على واتساب
                  </a>
                )}
                <p className="text-center text-xs text-cocoa/50">بتنعمل على الطلب — السعر النهائي وموعد التسليم منأكدهم معك.</p>
              </div>
            </Step>
          </div>

          {/* معلومات إضافية */}
          <div className="mt-12 divide-y divide-sand border-y border-sand">
            <Accordion title="عن الصينية" defaultOpen>
              <p className="leading-loose text-cocoa-deep/75">{product.description}</p>
            </Accordion>
            <Accordion title="المكوّنات">
              <ul className="flex flex-wrap gap-2">
                {product.ingredients.map((ing) => (
                  <li key={ing} className="rounded-full bg-cream px-3 py-1.5 text-sm text-cocoa">{ing}</li>
                ))}
              </ul>
            </Accordion>
            <Accordion title="الحفظ والتقديم">
              <p className="leading-loose text-cocoa-deep/75">
                احفظها بمكان بارد وناشف، بعيد عن الشمس والريحة القوية. الأفضل ما تنحط بالثلاجة، ولو اضطريت، طلّعها قبل التقديم بشوي.
              </p>
            </Accordion>
          </div>
        </div>
      </section>

      <Related product={product} />

      {/* شريط ثابت تحت — موبايل */}
      <AnimatePresence>
        {!addVisible && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-x-0 bottom-0 z-30 border-t border-sand bg-parchment/95 px-4 py-3 backdrop-blur md:hidden"
          >
            <div className="flex items-center gap-3">
              <div className="min-w-0">
                <p className="truncate text-xs text-cocoa/60">{product.name} · {size?.label}</p>
                <AnimatedPrice value={unitPrice * qty} className="font-display text-2xl text-cocoa" />
              </div>
              <AddButton onClick={handleAdd} added={added} className="flex-1" compact />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* نقطة شوكولا بتطير للشنطة */}
      <AnimatePresence>
        {flight && (
          <motion.span
            key={flight.from.x + flight.from.y}
            className="pointer-events-none fixed z-[90] block size-5"
            initial={{ left: flight.from.x + flight.from.width / 2 - 10, top: flight.from.y + flight.from.height / 2 - 10, scale: 1, opacity: 1 }}
            animate={{
              left: flight.to.x + flight.to.width / 2 - 10,
              top: [flight.from.y + flight.from.height / 2 - 10, Math.min(flight.from.y, flight.to.y) - 120, flight.to.y + flight.to.height / 2 - 10],
              scale: [1, 1.4, 0.4],
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: [0.45, 0, 0.2, 1] }}
            onAnimationComplete={() => setFlight(null)}
          >
            <svg viewBox="0 0 12 16" className="size-full fill-cocoa drop-shadow">
              <path d="M6 0C3 5 0 8 0 11a6 6 0 0 0 12 0c0-3-3-6-6-11z" />
            </svg>
          </motion.span>
        )}
      </AnimatePresence>

      {/* تأكيد صغير */}
      <AnimatePresence>
        {added && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full bg-olive-deep px-5 py-3 text-sm whitespace-nowrap text-cream shadow-xl md:top-24 md:bottom-auto"
          >
            <Check className="size-4 text-caramel" />
            انضافت للطلبية
            <button type="button" onClick={() => order.setOpen(true)} className="underline underline-offset-4">
              شوف الطلبية
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ------------------------------------------------------------------ */

/** المعرض: صورة مع عدسة تكبير، أو معاينة الاسم على الصينية — بينقلبوا متل الكرت */
function Gallery({
  product,
  view,
  setView,
  values,
}: {
  product: Product
  view: 'photo' | 'preview'
  setView: (v: 'photo' | 'preview') => void
  values: Record<string, string>
}) {
  const [index, setIndex] = useState(0)
  const preview = product.preview
  const fieldLabel = (id?: string) => product.customization?.find((f) => f.id === id)

  return (
    <div>
      {preview && (
        <div role="tablist" className="mb-4 inline-flex rounded-full border border-sand-deep/60 p-1 text-sm">
          {(
            [
              ['photo', 'الصورة', ImageIcon],
              ['preview', 'جرّب اسمك', PenLine],
            ] as const
          ).map(([id, label, Icon]) => (
            <button
              key={id}
              role="tab"
              aria-selected={view === id}
              type="button"
              onClick={() => setView(id)}
              className={`relative flex items-center gap-1.5 rounded-full px-4 py-2 transition ${view === id ? 'text-cream' : 'text-cocoa/70 hover:text-cocoa'}`}
            >
              {view === id && <motion.span layoutId="gallery-tab" className="absolute inset-0 rounded-full bg-olive" transition={{ type: 'spring', stiffness: 300, damping: 30 }} />}
              <Icon className="relative size-4" aria-hidden />
              <span className="relative">{label}</span>
            </button>
          ))}
        </div>
      )}

      <div className="[perspective:1400px]">
        <AnimatePresence mode="wait" initial={false}>
          {view === 'photo' || !preview ? (
            <motion.div
              key="photo"
              initial={{ rotateY: -90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: 90, opacity: 0 }}
              transition={{ duration: 0.35 }}
            >
              <Magnifier src={product.images[index]} alt={product.name} />
            </motion.div>
          ) : (
            <motion.div
              key="preview"
              initial={{ rotateY: -90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: 90, opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="relative"
            >
              <div className="vintage-frame overflow-hidden rounded-[2rem]">
                <TrayPreview
                  spec={preview}
                  top={preview.top ? values[preview.top] || fieldLabel(preview.top)?.placeholder.replace('مثلًا: ', '') : undefined}
                  main={values[preview.main] || fieldLabel(preview.main)?.placeholder.replace('مثلًا: ', '') || ''}
                  bottom={preview.bottom ? values[preview.bottom] || fieldLabel(preview.bottom)?.placeholder.replace('مثلًا: ', '') : undefined}
                  alt={`معاينة ${product.name} مع النص اللي كتبته`}
                />
              </div>
              <span className="font-display absolute -top-3 -left-2 -rotate-6 rounded-full bg-caramel px-4 py-1 text-cocoa-deep shadow-lg">معاينة مباشرة</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {view === 'photo' && product.images.length > 1 && (
        <div className="mt-4 flex gap-3">
          {product.images.map((img, i) => (
            <button
              key={img}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`صورة ${i + 1}`}
              className={`size-20 overflow-hidden rounded-t-full rounded-b-lg border-2 transition ${i === index ? 'border-olive' : 'border-transparent opacity-60 hover:opacity-100'}`}
            >
              <img src={img} alt="" className="size-full object-cover object-[center_62%]" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/** صورة بقوس عتيق، ومع الماوس بتطلع عدسة تكبير دائرية متل عدسة الصايغ */
function Magnifier({ src, alt }: { src: string; alt: string }) {
  const [lens, setLens] = useState<{ x: number; y: number; w: number; h: number } | null>(null)
  const [natural, setNatural] = useState({ w: 9, h: 16 })
  const ZOOM = 2.4
  const SIZE = 170

  // الصورة معروضة object-cover ومركزها (50%, 62%) — منحسب حجمها الفعلي عشان العدسة تطابق
  let bg: { size: string; pos: string } | null = null
  if (lens) {
    const scale = Math.max(lens.w / natural.w, lens.h / natural.h)
    const rw = natural.w * scale
    const rh = natural.h * scale
    const offX = (rw - lens.w) * 0.5
    const offY = (rh - lens.h) * 0.62
    bg = {
      size: `${rw * ZOOM}px ${rh * ZOOM}px`,
      pos: `${-((lens.x + offX) * ZOOM - SIZE / 2)}px ${-((lens.y + offY) * ZOOM - SIZE / 2)}px`,
    }
  }

  return (
    <div
      className="vintage-frame relative cursor-zoom-in overflow-hidden rounded-t-[999px] rounded-b-[2rem] bg-cream"
      onPointerMove={(e) => {
        if (e.pointerType !== 'mouse') return
        const r = e.currentTarget.getBoundingClientRect()
        setLens({ x: e.clientX - r.left, y: e.clientY - r.top, w: r.width, h: r.height })
      }}
      onPointerLeave={() => setLens(null)}
    >
      <img
        src={src}
        alt={alt}
        onLoad={(e) => setNatural({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
        className="aspect-[4/5] w-full object-cover object-[center_62%]"
      />
      <AnimatePresence>
        {lens && bg && (
          <motion.div
            aria-hidden
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.4, opacity: 0 }}
            className="pointer-events-none absolute rounded-full border-4 border-parchment shadow-[0_15px_40px_-10px_rgb(62_36_29/0.7),inset_0_0_0_1px_var(--color-sand-deep)]"
            style={{
              width: SIZE,
              height: SIZE,
              left: lens.x - SIZE / 2,
              top: lens.y - SIZE / 2,
              backgroundImage: `url(${src})`,
              backgroundRepeat: 'no-repeat',
              backgroundSize: bg.size,
              backgroundPosition: bg.pos,
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function AddButton({ onClick, added, className = '', compact = false }: { onClick: (e: MouseEvent<HTMLButtonElement>) => void; added: boolean; className?: string; compact?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex items-center justify-center gap-2 overflow-hidden rounded-full bg-cocoa text-cream shadow-[0_12px_30px_-12px_rgb(107_62_51/0.8)] ${compact ? 'py-3.5' : 'py-4'} ${className}`}
    >
      <span className="absolute inset-0 translate-y-full rounded-[50%_50%_0_0] bg-cocoa-deep transition-transform duration-500 ease-[var(--ease-soft)] group-hover:translate-y-0 group-hover:rounded-none" />
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={added ? 'added' : 'add'}
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -16, opacity: 0 }}
          className="relative flex items-center gap-2"
        >
          {added ? <Check className="size-5" /> : <ShoppingBag className="size-5" />}
          {added ? 'انضافت!' : 'ضيف للطلبية'}
        </motion.span>
      </AnimatePresence>
    </button>
  )
}

function Step({ n, title, hint, children }: { n: string; title: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <span className="font-display grid size-9 place-items-center rounded-full bg-olive text-lg text-cream">{n}</span>
        <div>
          <h2 className="font-display text-2xl text-olive">{title}</h2>
          {hint && <p className="text-xs text-cocoa/60">{hint}</p>}
        </div>
      </div>
      {children}
    </div>
  )
}

function Accordion({ title, children, defaultOpen = false }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-center justify-between py-4 text-right">
        <span className="font-display text-xl text-cocoa-deep">{title}</span>
        <ChevronDown className={`size-5 text-cocoa/60 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="pb-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Related({ product }: { product: Product }) {
  const { data: all } = useAsync(() => getProducts(), [])
  const related = useMemo(() => all?.filter((p) => p.id !== product.id).slice(0, 3) ?? [], [all, product.id])
  if (!related.length) return null
  return (
    <section className="bg-cream/60 py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="font-display mb-12 text-center text-4xl text-olive">ممكن يعجبك كمان</h2>
        <div className="mx-auto grid max-w-sm gap-x-10 gap-y-16 sm:max-w-none sm:grid-cols-2 lg:grid-cols-3">
          {related.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}

function ProductSkeleton() {
  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-2">
      <div className="aspect-[4/5] animate-pulse rounded-t-[999px] rounded-b-[2rem] bg-sand/40" />
      <div className="space-y-4">
        <div className="h-12 w-2/3 animate-pulse rounded-lg bg-sand/40" />
        <div className="h-5 w-full animate-pulse rounded bg-sand/30" />
        <div className="h-5 w-4/5 animate-pulse rounded bg-sand/30" />
      </div>
    </div>
  )
}
