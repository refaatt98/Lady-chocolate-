import { ArrowLeft, Gift, Hand, MessageCircle, PenLine, ShoppingBag, Sparkles } from 'lucide-react'
import { motion } from 'motion/react'
import { Link } from 'react-router'
import { BrandPattern } from '../components/BrandPattern'
import { CategoryTag } from '../components/CategoryTag'
import { ChocolateFountain } from '../components/ChocolateFountain'
import { ProductCard } from '../components/ProductCard'
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
      <Categories />
      <FeaturedProducts />
      <Story />
      <HowToOrder />
    </>
  )
}

/* ------------------------------------------------------------------ */

function Hero() {
  const site = useSite()

  return (
    <section className="relative -mt-20 overflow-hidden pt-20">
      {/* الكاليغرافي المفرّغ على الطرف متل الهوية */}
      <div aria-hidden className="absolute inset-y-0 -right-16 hidden items-center text-olive/[0.09] md:flex">
        <span className="calligraphy-outline block -rotate-90 text-[18rem] whitespace-nowrap">الليدي</span>
      </div>

      <div className="relative mx-auto grid max-w-6xl items-center gap-6 px-4 pt-6 pb-24 sm:px-6 md:grid-cols-[1.05fr_1fr] md:gap-10 md:pt-10 md:pb-28">
        <div className="order-2 text-center md:order-1 md:text-right">
          <motion.p
            dir="ltr"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 1 }}
            className="font-latin text-xs tracking-[0.45em] text-cocoa/70 uppercase md:text-right"
          >
            Belgian Chocolate
          </motion.p>

          <h1 className="font-display mt-4 text-[3.4rem] leading-[1.15] text-olive sm:text-7xl md:text-[5.2rem]">
            {['شوكولا بلجيكية،', 'بروح زمان'].map((line, i) => (
              <motion.span
                key={line}
                className={`block ${i === 1 ? 'text-cocoa' : ''}`}
                initial={{ opacity: 0, y: 30, filter: 'blur(6px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ delay: 0.3 + i * 0.25, duration: 1, ease }}
              >
                {line}
              </motion.span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.8, ease }}
            className="mx-auto mt-6 max-w-md text-lg leading-loose text-cocoa-deep/75 md:mx-0"
          >
            صواني وهدايا بتنرتب باليد قطعة قطعة، وبتنكتب عليها أساميكم وتواريخكم الحلوة.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.8, ease }}
            className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:justify-center md:justify-start"
          >
            <Link
              to="/shop"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-cocoa px-8 py-4 text-cream shadow-[0_12px_30px_-12px_rgb(107_62_51/0.8)] transition hover:bg-cocoa-deep sm:w-auto"
            >
              اكتشف التشكيلة
              <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" aria-hidden />
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
        </div>

        <div className="relative order-1 mx-auto w-full max-w-[19rem] sm:max-w-sm md:order-2 md:max-w-md">
          {/* هالة دافية ورا النافورة */}
          <div aria-hidden className="absolute inset-[12%] rounded-full bg-caramel/25 blur-3xl" />
          <ChocolateFountain className="relative w-full drop-shadow-[0_30px_30px_rgb(62_36_29/0.18)]" />
        </div>
      </div>

      {/* نقطة شوكولا بتنقط وبتوديك عالسكشن الجاي */}
      <a
        href="#categories"
        aria-label="انزل للأقسام"
        className="absolute bottom-4 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1 text-cocoa/70"
      >
        <span className="font-latin text-[0.6rem] tracking-[0.3em] uppercase" dir="ltr">
          Scroll
        </span>
        <span className="relative h-10 w-px bg-gradient-to-b from-cocoa/50 to-transparent">
          <motion.svg
            viewBox="0 0 12 16"
            className="absolute -left-[5px] w-[11px] fill-cocoa"
            animate={{ y: [0, 30], opacity: [0, 1, 0], scaleY: [0.7, 1.1, 0.8] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeIn', repeatDelay: 0.4 }}
          >
            <path d="M6 0C3 5 0 8 0 11a6 6 0 0 0 12 0c0-3-3-6-6-11z" />
          </motion.svg>
        </span>
      </a>
    </section>
  )
}

/* ------------------------------------------------------------------ */

function Categories() {
  const { data: categories } = useAsync(getCategories)

  return (
    <section id="categories" className="relative scroll-mt-20 py-20 md:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Our Chocolate"
          title="أقسامنا"
          description="كل نوع إله طعمه وقصته. اختار اللي بيشبهك، أو اللي بيشبه اللي بدك تهديه."
        />

        {/* على الموبايل الكروت بتنسحب أفقيًا، وعلى الكمبيوتر كلها ظاهرة */}
        <div className="-mx-4 overflow-x-auto px-4 pb-6 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
          <div className="relative mx-auto w-max">
            {/* الحبل اللي معلقة عليه الكروت */}
            <svg aria-hidden className="absolute -inset-x-6 top-0 h-6 w-[calc(100%+3rem)]" viewBox="0 0 100 6" preserveAspectRatio="none">
              <path d="M0,1 Q50,6 100,1" stroke="var(--color-caramel)" strokeWidth="0.35" fill="none" vectorEffect="non-scaling-stroke" />
            </svg>
            <div className="flex min-h-56 gap-4 pt-1 sm:gap-8">
              {categories?.map((category, i) => (
                <CategoryTag key={category.id} category={category} index={i} />
              ))}
            </div>
          </div>
        </div>
        <p className="mt-2 text-center text-xs text-cocoa/50 sm:hidden">← اسحب لتشوف كل الأقسام →</p>
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
        <SectionHeading eyebrow="Signature" title="من تشكيلتنا" description="قطع اختارتها الليدي إلك — كل وحدة بتنعمل على الطلب." />

        {loading ? (
          <div className="grid gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="aspect-[4/5] animate-pulse rounded-t-[999px] rounded-b-2xl bg-sand/40" />
            ))}
          </div>
        ) : (
          <div className="mx-auto grid max-w-sm gap-x-8 gap-y-16 sm:max-w-none sm:grid-cols-2 lg:grid-cols-3">
            {products?.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
        )}

        <div className="mt-16 text-center">
          <Link
            to="/shop"
            className="group inline-flex items-center gap-2 border-b border-cocoa/40 pb-1 text-cocoa transition hover:border-cocoa"
          >
            شوف كل التشكيلة
            <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */

const promises = [
  { icon: Sparkles, title: 'بلجيكية أصلية', text: 'شوكولا بلجيكية فاخرة بس، بدون بدائل.' },
  { icon: PenLine, title: 'بأساميكم', text: 'الاسم والتاريخ والعبارة اللي بدك ياها.' },
  { icon: Hand, title: 'شغل إيد', text: 'كل صينية بتترتب باليد قطعة قطعة.' },
]

function Story() {
  return (
    <section className="relative overflow-hidden bg-olive-deep py-20 text-sand md:py-28">
      <BrandPattern className="text-sand/[0.06]" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 sm:px-6 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, rotate: -2 }}
          whileInView={{ opacity: 1, scale: 1, rotate: -2 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 1, ease }}
          className="relative mx-auto w-full max-w-[19rem] sm:max-w-sm"
        >
          <div className="rounded-t-[999px] rounded-b-lg border border-sand/30 p-3">
            <img
              src="/images/products/tray-white-names.jpg"
              alt="صينية شوكولا مرتبة باليد"
              loading="lazy"
              className="aspect-[3/4] w-full rounded-t-[999px] rounded-b-md object-cover object-[center_60%]"
            />
          </div>
          <span className="font-display absolute -bottom-5 -left-3 rotate-[-8deg] rounded-full bg-cocoa px-5 py-2 text-lg text-cream shadow-lg">
            معمولة بحُب
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.9, ease }}
          className="text-center md:text-right"
        >
          <p dir="ltr" className="font-latin text-xs tracking-[0.4em] text-sand/60 uppercase md:text-right">
            Our Story
          </p>
          <h2 className="font-display mt-3 text-4xl leading-snug text-cream sm:text-5xl">
            حرفة قديمة،
            <br />
            بطعم بلجيكي
          </h2>
          <p className="mt-6 leading-loose text-sand/80">
            بالليدي شوكولات، منآمن إنه الهدية الحلوة بتنحكى قبل ما تنأكل. منختار أجود الشوكولا البلجيكية، ومنرتبها باليد
            على صواني بتذكرك بصواني الجدات بالأعياد — بس بلمسة اليوم.
          </p>

          <ul className="mt-10 grid gap-6 sm:grid-cols-3">
            {promises.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex flex-col items-center gap-2 md:items-start">
                <span className="grid size-11 place-items-center rounded-full border border-sand/30 text-caramel">
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className="font-display text-xl text-cream">{title}</span>
                <span className="text-sm leading-relaxed text-sand/70">{text}</span>
              </li>
            ))}
          </ul>
        </motion.div>
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
  const site = useSite()

  return (
    <section id="how-to-order" className="scroll-mt-20 py-20 md:py-28">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <SectionHeading eyebrow="How to order" title="كيف تطلب؟" description="ثلاث خطوات وبس — بدون حسابات ولا تعقيد." />

        <ol className="relative grid gap-10 md:grid-cols-3 md:gap-6">
          {/* خط منقّط بين الخطوات */}
          <span aria-hidden className="absolute inset-x-[16%] top-9 hidden border-t-2 border-dashed border-sand-deep/60 md:block" />
          {steps.map(({ icon: Icon, title, text }, i) => (
            <motion.li
              key={title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ delay: i * 0.15, duration: 0.7, ease }}
              className="relative flex flex-col items-center text-center"
            >
              <span className="relative grid size-[4.5rem] place-items-center rounded-full bg-parchment text-olive ring-1 ring-sand-deep">
                <Icon className="size-6" aria-hidden />
                <span className="absolute -top-1 -right-1 grid size-7 place-items-center rounded-full bg-cocoa text-sm text-cream">
                  {i + 1}
                </span>
              </span>
              <h3 className="font-display mt-5 text-3xl text-olive">{title}</h3>
              <p className="mt-2 max-w-60 leading-relaxed text-cocoa-deep/70">{text}</p>
            </motion.li>
          ))}
        </ol>

        {/* دعوة للطلب */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.8, ease }}
          className="relative mt-20 overflow-hidden rounded-[2rem] bg-sand px-6 py-12 text-center sm:px-12"
        >
          <BrandPattern className="text-olive/[0.08]" />
          <Gift className="relative mx-auto size-8 text-cocoa" aria-hidden />
          <p className="font-display relative mt-3 text-3xl text-olive sm:text-4xl">عندك مناسبة قريبة؟</p>
          <p className="relative mx-auto mt-3 max-w-md leading-loose text-cocoa-deep/75">
            احكيلنا عنها، ومنصممّلك صينية على ذوقك.
          </p>
          {site && (
            <a
              href={whatsappLink(site.whatsapp, 'مرحبا، عندي مناسبة وحابب صينية شوكولا مخصّصة 🍫')}
              target="_blank"
              rel="noreferrer"
              className="relative mt-7 inline-flex items-center gap-2 rounded-full bg-olive px-8 py-4 text-cream transition hover:bg-olive-deep"
            >
              <MessageCircle className="size-5" aria-hidden />
              احكي معنا على واتساب
            </a>
          )}
        </motion.div>
      </div>
    </section>
  )
}
