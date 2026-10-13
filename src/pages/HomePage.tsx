import { ArrowLeft, MessageCircle, PenLine, ShoppingBag } from 'lucide-react'
import { motion, useScroll, useTransform } from 'motion/react'
import { useRef } from 'react'
import { Link } from 'react-router'
import { BrandPattern } from '../components/BrandPattern'
import { CategoryFlower } from '../components/CategoryFlower'
import { ChocolateFountain } from '../components/ChocolateFountain'
import { ChocolatePetal } from '../components/ChocolatePetal'
import { DripRibbon } from '../components/DripRibbon'
import { Journey } from '../components/Journey'
import { NameOnTray } from '../components/NameOnTray'
import { ProductCard } from '../components/ProductCard'
import { RotatingSeal } from '../components/RotatingSeal'
import { SectionHeading } from '../components/SectionHeading'
import { getCategories, getFeaturedProducts } from '../lib/api'
import { whatsappLink } from '../lib/format'
import { useSite } from '../lib/site-context'
import { useAsync } from '../lib/useAsync'

const ease = [0.22, 1, 0.36, 1] as const

export function HomePage() {
  return (
    <>
      <Hero />
      <DripRibbon />
      <Categories />
      <FeaturedProducts />
      <Journey />
      <NameOnTray />
      <HowToOrder />
    </>
  )
}

/* ------------------------------------------------------------------ */

/** بتلات شوكولا طايرة حوالين القوس — كل وحدة بسرعة مختلفة مع السكرول */
const floating = [
  { cls: 'top-[8%] -right-4 w-9 rotate-[24deg] md:-right-10 md:w-12', depth: -80, tone: 'milk' as const, dur: 6 },
  { cls: 'top-[38%] -left-5 w-7 -rotate-[30deg] md:-left-12 md:w-10', depth: -140, tone: 'dark' as const, dur: 7 },
  { cls: 'bottom-[22%] -right-6 w-8 rotate-[150deg] md:-right-14 md:w-11', depth: -60, tone: 'dark' as const, dur: 5.5 },
  { cls: '-top-4 left-[18%] w-6 -rotate-[60deg] md:w-8', depth: -110, tone: 'milk' as const, dur: 6.5 },
]

function Hero() {
  const site = useSite()
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const archY = useTransform(scrollYProgress, [0, 1], [0, 80])
  const textY = useTransform(scrollYProgress, [0, 1], [0, -40])
  const p0 = useTransform(scrollYProgress, [0, 1], [0, floating[0].depth])
  const p1 = useTransform(scrollYProgress, [0, 1], [0, floating[1].depth])
  const p2 = useTransform(scrollYProgress, [0, 1], [0, floating[2].depth])
  const p3 = useTransform(scrollYProgress, [0, 1], [0, floating[3].depth])
  const parallax = [p0, p1, p2, p3]

  return (
    <section ref={ref} className="relative -mt-20 overflow-hidden pt-20">
      {/* كاليغرافي ضخم مفرّغ بالخلفية */}
      <div aria-hidden className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-olive/[0.07]">
        <span className="calligraphy-outline block text-[42vw] whitespace-nowrap md:text-[30vw]">شوكولات</span>
      </div>

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pt-8 pb-16 sm:px-6 md:grid-cols-[1.1fr_1fr] md:gap-8 md:pt-12 md:pb-24">
        {/* النص */}
        <motion.div style={{ y: textY }} className="order-2 text-center md:order-1 md:text-right">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 1 }}
            className="flex items-center justify-center gap-3 md:justify-start"
          >
            <span className="h-px w-8 bg-cocoa/40" />
            <span dir="ltr" className="font-latin text-xs tracking-[0.45em] text-cocoa/70 uppercase">
              Belgian Chocolate
            </span>
          </motion.div>

          <h1 className="font-display mt-5 text-[3.6rem] leading-[1.12] text-olive sm:text-7xl md:text-[5.6rem]">
            <motion.span
              className="block"
              initial={{ opacity: 0, y: 40, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ delay: 0.3, duration: 1.1, ease }}
            >
              شوكولا بلجيكية،
            </motion.span>
            <motion.span
              className="relative inline-block text-cocoa"
              initial={{ opacity: 0, y: 40, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ delay: 0.55, duration: 1.1, ease }}
            >
              بروح زمان
              {/* خط شوكولا بينرسم تحت الكلمة وبينقط */}
              <svg aria-hidden viewBox="0 0 300 40" className="absolute -bottom-6 left-0 w-full overflow-visible" preserveAspectRatio="none">
                <motion.path
                  d="M296,14 C220,30 120,6 4,22"
                  fill="none"
                  stroke="var(--color-caramel)"
                  strokeWidth="5"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 1.3, duration: 1.1, ease: [0.65, 0, 0.35, 1] }}
                />
                <motion.path
                  d="M120,17 C119,26 117,30 120,34 C123,30 121,26 120,17 Z"
                  fill="var(--color-caramel)"
                  initial={{ scaleY: 0, opacity: 0 }}
                  animate={{ scaleY: 1, opacity: 1 }}
                  transition={{ delay: 2.2, duration: 0.8 }}
                  style={{ originY: 0 }}
                />
              </svg>
            </motion.span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.8, ease }}
            className="mx-auto mt-8 max-w-md text-lg leading-loose text-cocoa-deep/75 md:mx-0"
          >
            صواني وهدايا بتنرتب باليد بتلة بتلة، وبتنكتب عليها أساميكم وتواريخكم الحلوة.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.8, ease }}
            className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:justify-center md:justify-start"
          >
            <Link
              to="/shop"
              className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-cocoa px-8 py-4 text-cream shadow-[0_12px_30px_-12px_rgb(139_90_71/0.45)] sm:w-auto"
            >
              {/* شوكولا غامقة بتعبي الزر من تحت */}
              <span className="absolute inset-0 translate-y-full rounded-[50%_50%_0_0] bg-cocoa-deep transition-transform duration-500 ease-[var(--ease-soft)] group-hover:translate-y-0 group-hover:rounded-none" />
              <span className="relative">اكتشف التشكيلة</span>
              <ArrowLeft className="relative size-4 transition-transform group-hover:-translate-x-1" aria-hidden />
            </Link>
            {site && (
              <a
                href={whatsappLink(site.whatsapp, 'مرحبا، حابب أستفسر عن صواني الشوكولا 🍫')}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-olive/40 px-8 py-4 text-olive transition hover:border-olive hover:bg-olive/5 sm:w-auto"
              >
                <MessageCircle className="size-4" aria-hidden />
                اسألنا على واتساب
              </a>
            )}
          </motion.div>

          <motion.ul
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4, duration: 1 }}
            className="mt-10 flex items-center justify-center gap-4 text-sm text-cocoa/70 md:justify-start"
          >
            {['بلجيكية ١٠٠٪', 'شغل إيد', 'بأساميكم'].map((t, i) => (
              <li key={t} className="flex items-center gap-4">
                {i > 0 && <span className="size-1 rounded-full bg-caramel" />}
                {t}
              </li>
            ))}
          </motion.ul>
        </motion.div>

        {/* شبّاك المحل: قوس عتيق والنافورة جوّاه */}
        <motion.div style={{ y: archY }} className="relative order-1 mx-auto w-full max-w-[18.5rem] sm:max-w-sm md:order-2 md:max-w-[26rem]">
          <motion.div
            initial={{ clipPath: 'inset(100% 0 0 0 round 999px 999px 0 0)' }}
            animate={{ clipPath: 'inset(0% 0 0 0 round 999px 999px 0 0)' }}
            transition={{ duration: 1.4, ease: [0.76, 0, 0.24, 1] }}
            className="relative aspect-[4/5] overflow-hidden rounded-t-full bg-sage shadow-[0_40px_60px_-30px_rgb(106_122_82/0.45)]"
          >
            <BrandPattern className="text-olive/[0.06]" />
            <div aria-hidden className="absolute inset-x-[10%] bottom-[8%] h-2/3 rounded-full bg-caramel/35 blur-3xl" />
            <span aria-hidden className="absolute inset-3 rounded-t-full border border-olive/20" />
            <span aria-hidden className="absolute inset-5 rounded-t-full border border-dashed border-olive/15" />
            <ChocolateFountain className="absolute inset-x-[4%] bottom-[3%] w-[92%]" />
          </motion.div>
          {/* عتبة الشباك */}
          <div aria-hidden className="relative -mx-4 h-4 rounded-sm bg-gradient-to-b from-sand to-sand-deep shadow-[0_10px_20px_-10px_rgb(92_59_47/0.25)]" />

          <motion.div
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 1.6, type: 'spring', stiffness: 120, damping: 12 }}
            className="absolute -bottom-10 -left-6 md:-left-12"
          >
            <RotatingSeal className="size-24 md:size-32" />
          </motion.div>

          {floating.map((f, i) => (
            <motion.div key={i} aria-hidden style={{ y: parallax[i] }} className={`absolute ${f.cls}`}>
              <motion.div
                animate={{ y: [0, -10, 0], rotate: [0, 6, 0] }}
                transition={{ duration: f.dur, repeat: Infinity, ease: 'easeInOut' }}
              >
                <ChocolatePetal tone={f.tone} className="w-full drop-shadow-[0_8px_8px_rgb(92_59_47/0.25)]" />
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */

function Categories() {
  const { data: categories } = useAsync(getCategories)

  return (
    <section id="categories" className="relative scroll-mt-20 overflow-hidden pt-16 pb-20 md:pt-24 md:pb-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading eyebrow="Our Chocolate" title="زهرة الأقسام" description="متل صوانينا: كل بتلة نوع. اختار البتلة اللي بتشبهك." />
        {categories ? <CategoryFlower categories={categories} /> : <div className="mx-auto aspect-square max-w-md animate-pulse rounded-full bg-sand/30" />}
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */

function FeaturedProducts() {
  const { data: products, loading } = useAsync(getFeaturedProducts)

  return (
    <section className="relative bg-cream/60 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading eyebrow="Signature" title="هدايا ملفوفة إلك" description="كل صينية بتوصلك ملفوفة بورق الليدي — وهون كمان. استنى لحظة وبتنفتح." />

        {loading ? (
          <div className="grid gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="aspect-[4/5] animate-pulse rounded-t-[999px] rounded-b-2xl bg-sand/40" />
            ))}
          </div>
        ) : (
          <div className="mx-auto grid max-w-sm gap-x-10 gap-y-16 sm:max-w-none sm:grid-cols-2 lg:mx-auto lg:max-w-4xl">
            {products?.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
        )}

        <div className="mt-16 text-center">
          <Link to="/shop" className="group inline-flex items-center gap-2 border-b border-cocoa/40 pb-1 text-cocoa transition hover:border-cocoa">
            شوف كل التشكيلة
            <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */

const steps = [
  { icon: ShoppingBag, title: 'اختار', text: 'اختار الصينية أو العلبة والحجم اللي بيناسبك.' },
  { icon: PenLine, title: 'خصّص', text: 'اكتب الاسم أو التاريخ أو العبارة اللي بدك ياها.' },
  { icon: MessageCircle, title: 'ابعت', text: 'بنفتحلك واتساب برسالة جاهزة، وإحنا بنكمل معك.' },
]

function HowToOrder() {
  return (
    <section id="how-to-order" className="scroll-mt-20 py-20 md:py-28">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <SectionHeading eyebrow="How to order" title="كيف تطلب؟" description="ثلاث خطوات وبس — بدون حسابات ولا تعقيد." />

        <ol className="relative grid gap-10 md:grid-cols-3 md:gap-6">
          {/* خط شوكولا بيوصل بين الخطوات */}
          <svg aria-hidden viewBox="0 0 100 4" preserveAspectRatio="none" className="absolute inset-x-[16%] top-8 hidden h-4 w-[68%] md:block">
            <motion.path
              d="M100,2 C75,4 60,0 50,2 C40,4 25,0 0,2"
              fill="none"
              stroke="var(--color-caramel)"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
              strokeDasharray="6 6"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.6, ease: [0.65, 0, 0.35, 1] }}
            />
          </svg>
          {steps.map(({ icon: Icon, title, text }, i) => (
            <motion.li
              key={title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ delay: 0.3 + i * 0.35, duration: 0.7, ease }}
              className="relative flex flex-col items-center text-center"
            >
              <span className="relative grid size-[4.5rem] place-items-center rounded-full bg-parchment text-olive ring-1 ring-sand-deep">
                <Icon className="size-6" aria-hidden />
                <span className="absolute -top-1 -right-1 grid size-7 place-items-center rounded-full bg-cocoa text-sm text-cream">{i + 1}</span>
              </span>
              <h3 className="font-display mt-5 text-3xl text-olive">{title}</h3>
              <p className="mt-2 max-w-60 leading-relaxed text-cocoa-deep/70">{text}</p>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  )
}
