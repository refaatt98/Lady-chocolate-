import { AlertTriangle, Boxes, CheckCircle2, Minus, PackageX, Plus, Search } from 'lucide-react'
import { motion } from 'motion/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'
import { EmptyState, PageHeader, StatCard, TextInput, Toggle, errorText, useToast } from '../../components/admin/ui'
import { adminListProducts, adminSetStock } from '../../lib/api'
import { LOW_STOCK } from '../../lib/stock'
import type { Product } from '../../types'

type Filter = 'all' | 'tracked' | 'low' | 'out'

const stateOf = (p: Product) => (!p.trackStock ? 'off' : (p.stock ?? 0) === 0 ? 'out' : (p.stock ?? 0) <= LOW_STOCK ? 'low' : 'ok')

export function AdminStock() {
  const toast = useToast()
  const [products, setProducts] = useState<Product[] | null>(null)
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const load = useCallback(async () => {
    try {
      setProducts(await adminListProducts())
    } catch (e) {
      toast(errorText(e), 'error')
    }
  }, [toast])

  useEffect(() => {
    load()
    const t = timers.current
    return () => Object.values(t).forEach(clearTimeout)
  }, [load])

  const patchLocal = (id: string, change: Partial<Product>) =>
    setProducts((list) => list?.map((p) => (p.id === id ? { ...p, ...change } : p)) ?? null)

  const toggle = async (p: Product, on: boolean) => {
    patchLocal(p.id, { trackStock: on })
    try {
      await adminSetStock(p.id, { trackStock: on })
      toast(on ? `صرنا نتتبّع كمية ${p.name}` : `${p.name} صار بدون حد للكمية`)
    } catch (e) {
      toast(errorText(e), 'error')
      load()
    }
  }

  /** تعديل الكمية — بيحفظ لحاله بعد ما توقف كبس */
  const setStock = (p: Product, value: number) => {
    const stock = Math.max(0, Math.min(99999, Math.floor(Number.isFinite(value) ? value : 0)))
    patchLocal(p.id, { stock })
    clearTimeout(timers.current[p.id])
    timers.current[p.id] = setTimeout(async () => {
      try {
        await adminSetStock(p.id, { stock })
        toast(stock === 0 ? `${p.name} صار «نفذت الكمية» بالموقع` : `انحفظت الكمية: ${p.name} · ${stock}`)
      } catch (e) {
        toast(errorText(e), 'error')
        load()
      }
    }, 700)
  }

  const counts = useMemo(() => {
    const list = products ?? []
    return {
      tracked: list.filter((p) => p.trackStock).length,
      low: list.filter((p) => stateOf(p) === 'low').length,
      out: list.filter((p) => stateOf(p) === 'out').length,
    }
  }, [products])

  const shown = useMemo(
    () =>
      (products ?? []).filter((p) => {
        const s = stateOf(p)
        if (filter === 'tracked' && s === 'off') return false
        if (filter === 'low' && s !== 'low') return false
        if (filter === 'out' && s !== 'out') return false
        return !query.trim() || p.name.includes(query.trim())
      }),
    [products, filter, query],
  )

  const filters: { id: Filter; label: string; n?: number }[] = [
    { id: 'all', label: 'الكل', n: products?.length },
    { id: 'tracked', label: 'عليها كمية', n: counts.tracked },
    { id: 'low', label: 'قرّبت تخلص', n: counts.low },
    { id: 'out', label: 'نفذت', n: counts.out },
  ]

  return (
    <div className="space-y-6">
      <PageHeader icon={Boxes} title="المخزون" description="حط كمية للمنتج اللي بدك — بتنقص لحالها لما تأكد الطلب، ولما تخلص بيطلع عالموقع «نفذت الكمية»." />

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="عليها كمية" value={counts.tracked} icon={Boxes} tone="olive" />
        <StatCard label="قرّبت تخلص" value={counts.low} hint={`${LOW_STOCK} وأقل`} icon={AlertTriangle} tone="caramel" />
        <StatCard label="نفذت" value={counts.out} icon={PackageX} tone="cocoa" />
      </div>

      <div className="rounded-2xl border border-dashed border-olive/30 bg-olive/5 px-4 py-3 text-sm leading-relaxed text-cocoa-deep/80">
        <b className="text-olive">كيف بتشتغل؟</b> الطلب الجديد ما بينقص شي. لما تغيّر حالته لـ <b>مؤكَّد · قيد التحضير</b> (أو جاهز / انسلّم) الكمية بتنقص مرة وحدة.
        إذا لغيت الطلب أو رجعته «جديد»، الكمية بترجع. والزبون ما بيقدر يطلب أكتر من الموجود.
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm transition ${filter === f.id ? 'bg-olive text-parchment' : 'bg-parchment text-cocoa-deep/75 hover:bg-sand/50'}`}
            >
              {f.label}
              {f.n !== undefined && <span className={`font-latin rounded-full px-1.5 text-xs ${filter === f.id ? 'bg-parchment/20' : 'bg-sand/70'}`}>{f.n}</span>}
            </button>
          ))}
        </div>
        <div className="relative sm:w-64">
          <Search className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-cocoa/40" aria-hidden />
          <TextInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder="دوّر على منتج" className="pr-9" />
        </div>
      </div>

      {!products ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-sand/40" />
          ))}
        </div>
      ) : shown.length === 0 ? (
        <EmptyState title="ما في منتجات هون" text={filter === 'out' ? 'ولا منتج نفذ — يعطيك العافية 🤍' : 'جرّب فلتر تاني'} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {shown.map((p, i) => (
            <StockRow key={p.id} product={p} index={i} onToggle={(on) => toggle(p, on)} onStock={(n) => setStock(p, n)} />
          ))}
        </div>
      )}
    </div>
  )
}

function StockRow({ product: p, index, onToggle, onStock }: { product: Product; index: number; onToggle: (on: boolean) => void; onStock: (n: number) => void }) {
  const state = stateOf(p)
  const stock = p.stock ?? 0
  const badge = {
    off: { text: 'بدون حد', cls: 'bg-sand/70 text-cocoa-deep/70' },
    ok: { text: 'متوفر', cls: 'bg-olive/12 text-olive' },
    low: { text: 'قرّبت تخلص', cls: 'bg-caramel/30 text-cocoa' },
    out: { text: 'نفذت الكمية', cls: 'bg-cocoa text-parchment' },
  }[state]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 8) * 0.04 }}
      className={`relative overflow-hidden rounded-2xl border bg-parchment/80 p-4 transition-colors ${state === 'out' ? 'border-cocoa/30' : 'border-sand-deep/40'}`}
    >
      <div className="flex items-start gap-3">
        <Link to={`/admin/products/${p.id}`} className="relative h-20 w-16 shrink-0 overflow-hidden rounded-t-full rounded-b-lg bg-cream ring-1 ring-sand-deep/60">
          {p.images[0] && <img src={p.images[0]} alt="" className={`size-full object-cover ${state === 'out' ? 'grayscale-[0.7] sepia-[0.35]' : ''}`} />}
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="font-display truncate text-xl text-olive">{p.name}</p>
            <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-xs ${badge.cls}`}>
              {state === 'ok' && <CheckCircle2 className="size-3" aria-hidden />}
              {badge.text}
            </span>
          </div>
          {p.active === false && <p className="mt-0.5 text-xs text-cocoa/50">مخفي عن الموقع</p>}
          <div className="mt-2">
            <Toggle checked={!!p.trackStock} onChange={onToggle} label="تتبّع الكمية" hint={p.trackStock ? undefined : 'الزبون بيقدر يطلب قد ما بده'} />
          </div>
        </div>
      </div>

      {p.trackStock && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 flex flex-wrap items-center gap-3 border-t border-sand/70 pt-4">
          <div className="flex items-center rounded-full border border-sand-deep/70 bg-parchment">
            <button type="button" onClick={() => onStock(stock + 1)} aria-label="زيادة" className="grid size-10 place-items-center text-olive">
              <Plus className="size-4" />
            </button>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={stock}
              onChange={(e) => onStock(e.target.valueAsNumber)}
              aria-label={`كمية ${p.name}`}
              className="font-latin w-16 bg-transparent text-center text-lg text-cocoa-deep outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <button type="button" onClick={() => onStock(stock - 1)} disabled={stock <= 0} aria-label="إنقاص" className="grid size-10 place-items-center text-olive disabled:opacity-30">
              <Minus className="size-4" />
            </button>
          </div>
          <div className="flex gap-1.5">
            {[5, 10].map((n) => (
              <button key={n} type="button" onClick={() => onStock(stock + n)} className="font-latin rounded-full bg-sand/60 px-3 py-1.5 text-xs text-cocoa-deep/80 transition hover:bg-sand">
                +{n}
              </button>
            ))}
            {stock > 0 && (
              <button type="button" onClick={() => onStock(0)} className="rounded-full px-3 py-1.5 text-xs text-cocoa/70 transition hover:bg-cocoa/10">
                خلصت
              </button>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
