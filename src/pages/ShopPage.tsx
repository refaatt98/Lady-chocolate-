import { ArrowDownWideNarrow } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { ChocolatePetal } from '../components/ChocolatePetal'
import { DripRibbon } from '../components/DripRibbon'
import { ProductCard } from '../components/ProductCard'
import { getCategories, getProducts } from '../lib/api'
import { useAsync } from '../lib/useAsync'

type Sort = 'default' | 'price-asc' | 'price-desc'

const sorts: { id: Sort; label: string }[] = [
  { id: 'default', label: 'المختارة' },
  { id: 'price-asc', label: 'الأرخص أول' },
  { id: 'price-desc', label: 'الأغلى أول' },
]

export function ShopPage() {
  const [params, setParams] = useSearchParams()
  const categorySlug = params.get('category') ?? ''
  const sort = (params.get('sort') as Sort) || 'default'

  const { data: categories } = useAsync(getCategories)
  const { data: products, loading } = useAsync(() => getProducts({ categorySlug: categorySlug || undefined }), [categorySlug])
  const current = categories?.find((c) => c.slug === categorySlug)

  const sorted = useMemo(() => {
    if (!products) return []
    if (sort === 'price-asc') return [...products].sort((a, b) => a.price - b.price)
    if (sort === 'price-desc') return [...products].sort((a, b) => b.price - a.price)
    return products
  }, [products, sort])

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  return (
    <>
      {/* رأس الصفحة */}
      <section className="relative overflow-hidden pt-10 pb-12 text-center md:pt-16">
        <div aria-hidden className="absolute inset-x-0 top-0 text-center text-olive/[0.06]">
          <span className="calligraphy-outline block text-[34vw] whitespace-nowrap md:text-[20vw]">التشكيلة</span>
        </div>
        <div className="relative mx-auto max-w-2xl px-4">
          <p dir="ltr" className="font-latin text-xs tracking-[0.4em] text-cocoa/60 uppercase">
            The Collection
          </p>
          <AnimatePresence mode="wait">
            <motion.h1
              key={current?.id ?? 'all'}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="font-display mt-3 text-5xl text-olive md:text-7xl"
            >
              {current?.name ?? 'كل التشكيلة'}
            </motion.h1>
          </AnimatePresence>
          <p className="mx-auto mt-4 max-w-md leading-loose text-cocoa-deep/70">
            {current?.description ?? 'كل اللي بنعمله، بمكان واحد. اختار نوع الشوكولا اللي بتحبه.'}
          </p>
        </div>
      </section>

      {/* الفلاتر */}
      <div className="sticky top-20 z-20 border-y border-sand bg-parchment/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
          <div className="-mx-1 flex flex-1 gap-2 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {[{ slug: '', name: 'الكل' }, ...(categories ?? [])].map((c) => {
              const active = c.slug === categorySlug
              return (
                <button
                  key={c.slug || 'all'}
                  type="button"
                  onClick={() => setParam('category', c.slug)}
                  aria-pressed={active}
                  className={`relative shrink-0 rounded-full px-4 py-2 text-sm whitespace-nowrap transition ${active ? 'text-cream' : 'text-cocoa/80 hover:text-cocoa'}`}
                >
                  {active && <motion.span layoutId="shop-filter" className="absolute inset-0 rounded-full bg-olive" transition={{ type: 'spring', stiffness: 300, damping: 30 }} />}
                  <span className="relative">{c.name}</span>
                </button>
              )
            })}
          </div>
          <label className="flex shrink-0 items-center gap-1.5 text-sm text-cocoa/70">
            <ArrowDownWideNarrow className="size-4" aria-hidden />
            <span className="sr-only">الترتيب</span>
            <select value={sort} onChange={(e) => setParam('sort', e.target.value === 'default' ? '' : e.target.value)} className="cursor-pointer bg-transparent py-1 focus:outline-none">
              {sorts.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* المنتجات */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-20">
        {loading ? (
          <div className="grid grid-cols-3 gap-x-3 gap-y-8 sm:gap-x-6 sm:gap-y-14 lg:gap-x-10">
            {[0, 1, 2].map((i) => (
              <div key={i} className="aspect-[4/5] animate-pulse rounded-t-[999px] rounded-b-2xl bg-sand/40" />
            ))}
          </div>
        ) : sorted.length ? (
          <>
            <p className="mb-10 text-sm text-cocoa/60">{sorted.length} {sorted.length === 1 ? 'منتج' : 'منتجات'}</p>
            <div className="grid grid-cols-3 gap-x-3 gap-y-8 sm:gap-x-6 sm:gap-y-14 lg:gap-x-10">
              {sorted.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </>
        ) : (
          <EmptyCategory name={current?.name} onReset={() => setParam('category', '')} />
        )}
      </section>

      <DripRibbon />
      <div className="h-16" />
    </>
  )
}

/** قسم لسا ما فيه منتجات — بتلات بتتجمّع على مهل كأنها عم تنعمل */
function EmptyCategory({ name, onReset }: { name?: string; onReset: () => void }) {
  return (
    <div className="flex flex-col items-center py-10 text-center">
      <div className="relative size-40">
        {Array.from({ length: 10 }, (_, i) => (
          <motion.div
            key={i}
            className="absolute top-1/2 left-1/2 w-7 origin-bottom"
            style={{ rotate: i * 36, x: '-50%', y: '-100%' }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 1, 0], scale: [0, 1, 1, 0.8] }}
            transition={{ duration: 3, repeat: Infinity, delay: i * 0.15, times: [0, 0.2, 0.8, 1] }}
          >
            <ChocolatePetal tone={i % 2 ? 'milk' : 'dark'} className="w-full" />
          </motion.div>
        ))}
      </div>
      <h2 className="font-display mt-6 text-4xl text-olive">{name ? `${name} — قريبًا` : 'قريبًا'}</h2>
      <p className="mt-3 max-w-sm leading-loose text-cocoa-deep/70">عم نحضّر هالقسم بإيدينا. بس الطلبات الخاصة دايمًا مفتوحة على الواتساب.</p>
      <button type="button" onClick={onReset} className="mt-6 rounded-full border border-olive px-6 py-2.5 text-olive transition hover:bg-olive hover:text-cream">
        شوف كل التشكيلة
      </button>
    </div>
  )
}
