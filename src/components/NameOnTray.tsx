import { ArrowLeft, ShoppingBag } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { getProductBySlug } from '../lib/api'
import { formatPrice } from '../lib/format'
import { useOrder } from '../lib/order'
import { useAsync } from '../lib/useAsync'
import type { SiteContent } from '../types'
import { BrandPattern } from './BrandPattern'
import { TrayPreview } from './TrayPreview'

const stripExample = (s: string) => s.replace(/^مثلًا:\s*/, '')

/**
 * "جرّب اسمك": صينية من اختيار الأدمن (لوحة التحكم ← محتوى الموقع)،
 * الزبون بيكتب وبيشوف النص على القرص، وبعدين بيضيفها للطلبية (مش واتساب مباشرة).
 * الصورة ومكان القرص بيجوا من "معاينة الاسم" تبع المنتج نفسه.
 */
export function NameOnTray({ content }: { content: SiteContent['nameSection'] }) {
  const { data: product } = useAsync(() => getProductBySlug(content.productSlug), [content.productSlug])
  const order = useOrder()
  const navigate = useNavigate()
  const [values, setValues] = useState<Record<string, string>>({})
  const [occasion, setOccasion] = useState(content.occasions[0] ?? '')
  const [sizeId, setSizeId] = useState('')

  const fields = product?.customization ?? []
  const preview = product?.preview

  // أول ما ينزل المنتج: منعبّي الخانات بأمثلة عشان المعاينة تبين حلوة من الأول
  useEffect(() => {
    if (!product) return
    setValues(Object.fromEntries((product.customization ?? []).map((f) => [f.id, stripExample(f.placeholder)])))
    setSizeId(product.sizes[0]?.id ?? '')
  }, [product])

  // ما في منتج مناسب (محذوف أو بدون معاينة)؟ منخبّي السكشن
  if (!product || !preview) return null

  const size = product.sizes.find((s) => s.id === sizeId) ?? product.sizes[0]

  const addToOrder = () => {
    if (!size) return
    order.add({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.images[0] ?? preview.image,
      sizeLabel: size.label,
      pieces: size.pieces,
      unitPrice: size.price,
      qty: 1,
      details: [...(occasion ? ([['المناسبة', occasion]] as [string, string][]) : []), ...fields.map((f) => [f.label, values[f.id] ?? ''] as [string, string])],
    })
    navigate('/cart')
  }

  return (
    <section className="relative overflow-hidden bg-sage py-20 text-cocoa-deep md:py-28">
      <BrandPattern className="text-olive/[0.05]" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 md:grid-cols-2 md:gap-16">
        {/* الصورة مع القرص الحي */}
        <motion.div
          initial={{ opacity: 0, rotate: -6, scale: 0.92 }}
          whileInView={{ opacity: 1, rotate: -2, scale: 1 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto w-full max-w-md"
        >
          <div className="rounded-[2.5rem] border border-olive/20 bg-parchment/60 p-3">
            <TrayPreview
              spec={preview}
              top={preview.top ? values[preview.top] ?? '' : undefined}
              main={values[preview.main] ?? ''}
              bottom={preview.bottom ? values[preview.bottom] ?? '' : undefined}
              alt={`${product.name} مع النص اللي كتبته`}
              className="rounded-[2rem]"
            />
          </div>
          <span className="font-display absolute -top-4 -right-2 rotate-[8deg] rounded-full bg-caramel px-4 py-1.5 text-lg text-cocoa-deep shadow-lg">
            معاينة مباشرة
          </span>
        </motion.div>

        {/* الفورم */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          <p dir="ltr" className="font-latin text-center text-xs tracking-[0.4em] text-cocoa/60 uppercase md:text-right">
            {content.eyebrow}
          </p>
          <h2 className="font-display mt-3 text-center text-4xl leading-snug text-olive sm:text-5xl md:text-right">{content.title}</h2>
          <p className="mt-4 text-center leading-loose text-cocoa-deep/70 md:text-right">{content.description}</p>

          <div className="mt-8 space-y-6">
            {content.occasions.length > 0 && (
              <fieldset>
                <legend className="mb-3 text-sm text-cocoa/70">المناسبة</legend>
                <div className="flex flex-wrap gap-2">
                  {content.occasions.map((o) => (
                    <button
                      key={o}
                      type="button"
                      aria-pressed={occasion === o}
                      onClick={() => setOccasion(o)}
                      className={`rounded-full border px-4 py-2 text-sm transition ${
                        occasion === o ? 'border-olive bg-olive text-parchment' : 'border-olive/25 bg-parchment/60 text-cocoa-deep/80 hover:border-olive/50'
                      }`}
                    >
                      {o}
                    </button>
                  ))}
                </div>
              </fieldset>
            )}

            {fields.map((f) => (
              <label key={f.id} className="block">
                <span className="text-sm text-cocoa/70">{f.label}</span>
                <input
                  value={values[f.id] ?? ''}
                  maxLength={f.maxLength}
                  onChange={(e) => setValues((v) => ({ ...v, [f.id]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="font-display mt-1 w-full border-b border-olive/25 bg-transparent py-2 text-3xl text-cocoa-deep placeholder:text-cocoa/30 focus:border-olive focus:outline-none"
                />
              </label>
            ))}

            {product.sizes.length > 1 && (
              <fieldset>
                <legend className="mb-3 text-sm text-cocoa/70">الحجم</legend>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      aria-pressed={size?.id === s.id}
                      onClick={() => setSizeId(s.id)}
                      className={`rounded-full border px-4 py-2 text-sm transition ${
                        size?.id === s.id ? 'border-olive bg-olive text-parchment' : 'border-olive/25 bg-parchment/60 text-cocoa-deep/80 hover:border-olive/50'
                      }`}
                    >
                      {s.label} · {formatPrice(s.price)}
                    </button>
                  ))}
                </div>
              </fieldset>
            )}
          </div>

          <div className="mt-9 flex flex-col items-center gap-4 sm:flex-row md:items-center">
            <button
              type="button"
              onClick={addToOrder}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-olive px-8 py-4 text-parchment shadow-[0_15px_35px_-15px_rgb(106_122_82/0.9)] transition hover:bg-olive-deep sm:w-auto"
            >
              <ShoppingBag className="size-5" aria-hidden />
              {content.buttonText}
              {size && <span className="opacity-80">· {formatPrice(size.price)}</span>}
            </button>
            <Link to={`/product/${product.slug}`} className="inline-flex items-center gap-1.5 text-sm text-cocoa/70 hover:text-olive">
              تفاصيل {product.name}
              <ArrowLeft className="size-4" aria-hidden />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
