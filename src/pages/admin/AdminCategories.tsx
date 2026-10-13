import { ArrowDown, ArrowUp, ExternalLink, Flower2, Plus, Save, Trash2 } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, ColorPicker, Drawer, EmptyState, Field, PageHeader, Pill, TextArea, TextInput, errorText, useToast } from '../../components/admin/ui'
import { PETAL_PATH, PETAL_RIDGES } from '../../components/ChocolatePetal'
import { adminDeleteCategory, adminListProducts, adminSaveCategory, getCategories } from '../../lib/api'
import type { Category } from '../../types'

/** ألوان الـ tone القديمة كـ hex (للأقسام اللي ما إلها لون حر) */
const toneHex: Record<Category['tone'], string> = {
  olive: '#626a46',
  milk: '#9c7262',
  dark: '#5a3d33',
  white: '#e7e0d1',
  caramel: '#b8977a',
}
const colorOf = (c: Pick<Category, 'color' | 'tone'>) => c.color || toneHex[c.tone]

type Draft = Omit<Category, 'id'> & { id?: string }
const blank = (): Draft => ({ slug: '', name: '', latinName: '', description: '', tone: 'milk', color: '#9c7262' })

/** بتلة SVG بلون معيّن */
function Petal({ color, className = '' }: { color: string; className?: string }) {
  return (
    <svg viewBox="-2 -2 44 100" aria-hidden className={className}>
      <path d={PETAL_PATH} fill={color} stroke="rgb(0 0 0 / 0.12)" strokeWidth="1" />
      {PETAL_RIDGES.map((d) => (
        <path key={d} d={d} fill="none" stroke="#000" strokeOpacity="0.16" strokeWidth="1" />
      ))}
      <path d="M14,20 C10,40 9,60 11,78" fill="none" stroke="#fff" strokeOpacity="0.35" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  )
}

/** معاينة صغيرة لزهرة الأقسام — البتلة المختارة بتطلع لبرا */
function MiniFlower({ items, activeIndex }: { items: { color: string; name: string }[]; activeIndex: number }) {
  const n = Math.max(items.length, 1)
  return (
    <svg viewBox="0 0 200 200" className="w-full max-w-[13rem]">
      <circle cx="100" cy="100" r="96" fill="var(--color-cream)" />
      <circle cx="100" cy="100" r="92" fill="none" stroke="var(--color-sand-deep)" strokeDasharray="2 5" />
      {items.map((it, i) => {
        const active = i === activeIndex
        return (
          <g key={i} transform={`translate(100 100) rotate(${(360 / n) * i})`}>
            <motion.g animate={{ y: active ? -8 : 0 }} transition={{ type: 'spring', stiffness: 260, damping: 18 }}>
              <g transform="translate(-12 -88) scale(0.6)">
                <path d={PETAL_PATH} fill={it.color} stroke={active ? 'var(--color-cocoa-deep)' : 'rgb(0 0 0 / 0.12)'} strokeWidth={active ? 2 : 1} />
                {PETAL_RIDGES.map((d) => (
                  <path key={d} d={d} fill="none" stroke="#000" strokeOpacity="0.15" />
                ))}
              </g>
            </motion.g>
          </g>
        )
      })}
      <circle cx="100" cy="100" r="34" fill="#fbf8f2" stroke="var(--color-sand-deep)" />
      <text x="100" y="105" textAnchor="middle" fontFamily="var(--font-display)" fontSize="15" fill="var(--color-cocoa)">
        {items[activeIndex]?.name || 'قسم'}
      </text>
    </svg>
  )
}

export function AdminCategories() {
  const toast = useToast()
  const [list, setList] = useState<Category[] | null>(null)
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [draft, setDraft] = useState<Draft | null>(null)
  const [saving, setSaving] = useState(false)
  const [isDesktop, setIsDesktop] = useState(() => window.matchMedia('(min-width: 1024px)').matches)

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const on = () => setIsDesktop(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  const load = useCallback(async () => {
    try {
      const [cats, products] = await Promise.all([getCategories(), adminListProducts()])
      setList(cats)
      setCounts(products.reduce<Record<string, number>>((acc, p) => ({ ...acc, [p.categoryId]: (acc[p.categoryId] ?? 0) + 1 }), {}))
      return cats
    } catch (e) {
      toast(errorText(e), 'error')
      return []
    }
  }, [toast])

  useEffect(() => {
    load().then((cats) => isDesktop && cats[0] && setDraft({ ...cats[0], color: colorOf(cats[0]) }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load])

  // معاينة الزهرة: الأقسام المحفوظة مع التعديل الحالي (أو القسم الجديد بالآخر)
  const previewItems = useMemo(() => {
    const base = (list ?? []).map((c) => ({ id: c.id, color: colorOf(c), name: c.name }))
    if (!draft) return base
    if (!draft.id) return [...base, { id: 'new', color: draft.color || toneHex[draft.tone], name: draft.name || 'جديد' }]
    return base.map((b) => (b.id === draft.id ? { ...b, color: draft.color || toneHex[draft.tone], name: draft.name } : b))
  }, [list, draft])
  const activeIndex = draft ? previewItems.findIndex((p) => p.id === (draft.id ?? 'new')) : -1

  if (!list) return <div className="mx-auto max-w-6xl space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-3xl bg-sand/40" />)}</div>

  const select = (c: Category) => setDraft({ ...c, color: colorOf(c) })
  const set = (patch: Partial<Draft>) => setDraft((d) => (d ? { ...d, ...patch } : d))

  const save = async () => {
    if (!draft) return
    if (!draft.name.trim()) return toast('اكتب اسم القسم', 'error')
    if (!/^[a-z0-9-]+$/.test(draft.slug)) return toast('الرابط بالإنجليزي الصغير وشرطات بس، مثلًا: dark', 'error')
    setSaving(true)
    try {
      const sort = draft.id ? (list.findIndex((c) => c.id === draft.id) + 1) : list.length + 1
      await adminSaveCategory({ ...draft, sort })
      toast(`انحفظ "${draft.name}"`)
      const cats = await load()
      const saved = cats.find((c) => c.slug === draft.slug)
      if (saved) setDraft(isDesktop ? { ...saved, color: colorOf(saved) } : null)
    } catch (e) {
      toast(errorText(e), 'error')
    } finally {
      setSaving(false)
    }
  }

  const move = async (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= list.length) return
    const copy = [...list]
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
    setList(copy)
    try {
      await Promise.all(copy.map((c, k) => adminSaveCategory({ ...c, sort: k + 1 })))
    } catch (e) {
      toast(errorText(e), 'error')
      load()
    }
  }

  const remove = async () => {
    if (!draft?.id) return setDraft(null)
    const n = counts[draft.id] ?? 0
    if (!confirm(n ? `بالقسم "${draft.name}" في ${n} منتجات — رح يضلوا بس بدون قسم. متأكد؟` : `تحذف القسم "${draft.name}"؟`)) return
    try {
      await adminDeleteCategory(draft.id)
      toast('انحذف القسم')
      setDraft(null)
      load()
    } catch (e) {
      toast(errorText(e), 'error')
    }
  }

  const editor = draft && (
    <div className="space-y-5">
      <div className="flex flex-col items-center rounded-3xl bg-gradient-to-b from-cream to-parchment px-4 py-5">
        <MiniFlower items={previewItems} activeIndex={activeIndex} />
        <p className="mt-2 text-xs text-cocoa/50">هيك بتطلع بزهرة الأقسام بالرئيسية</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="الاسم">
          <TextInput value={draft.name} onChange={(e) => set({ name: e.target.value })} placeholder="داكنة" />
        </Field>
        <Field label="الاسم بالإنجليزي" hint="بيطلع صغير تحت الاسم">
          <TextInput dir="ltr" value={draft.latinName} onChange={(e) => set({ latinName: e.target.value })} placeholder="Dark" />
        </Field>
        <Field label="الرابط" hint={`/shop?category=${draft.slug || '...'}`} className="sm:col-span-2">
          <TextInput dir="ltr" value={draft.slug} onChange={(e) => set({ slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} placeholder="dark" />
        </Field>
        <Field label="الوصف" hint="بيطلع جنب الزهرة لما الزبون يختار البتلة" className="sm:col-span-2">
          <TextArea rows={3} value={draft.description} onChange={(e) => set({ description: e.target.value })} />
        </Field>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium text-cocoa-deep/80">لون البتلة</p>
        <ColorPicker value={draft.color || toneHex[draft.tone]} onChange={(color) => set({ color })} />
      </div>
    </div>
  )

  const editorFooter = draft && (
    <div className="flex items-center gap-2">
      <Button onClick={save} loading={saving} className="px-6">
        <Save className="size-4" /> {draft.id ? 'حفظ التعديلات' : 'ضيف القسم'}
      </Button>
      {draft.id && (
        <a href={`/shop?category=${draft.slug}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 px-2 text-sm text-cocoa/60 hover:text-olive">
          <ExternalLink className="size-4" /> شوفه
        </a>
      )}
      <Button variant="ghost" className="ms-auto" onClick={remove}>
        <Trash2 className="size-4" /> {draft.id ? 'حذف' : 'إلغاء'}
      </Button>
    </div>
  )

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        icon={Flower2}
        title="الأقسام"
        description="كل قسم = بتلة بزهرة الأقسام بالرئيسية، وفلتر بصفحة التشكيلة."
        actions={
          <Button onClick={() => setDraft(blank())}>
            <Plus className="size-4" /> قسم جديد
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_26rem]">
        {/* القائمة */}
        <div>
          {list.length === 0 ? (
            <EmptyState title="ما في أقسام" text="ضيف أول قسم، وبيطلع كبتلة بالرئيسية." />
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              <AnimatePresence initial={false}>
                {list.map((c, i) => {
                  const active = draft?.id === c.id
                  const color = active && draft ? draft.color || toneHex[draft.tone] : colorOf(c)
                  return (
                    <motion.li key={c.id} layout initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => select(c)}
                        onKeyDown={(e) => e.key === 'Enter' && select(c)}
                        className={`group relative flex h-full cursor-pointer items-center gap-4 overflow-hidden rounded-3xl border p-4 transition ${
                          active ? 'border-olive bg-parchment shadow-[0_18px_40px_-24px_rgb(98_106_70/0.8)]' : 'border-sand-deep/40 bg-parchment/70 hover:border-sand-deep hover:bg-parchment'
                        }`}
                      >
                        <span aria-hidden className="absolute -top-8 -left-8 size-28 rounded-full opacity-25 blur-2xl" style={{ background: color }} />
                        <span className="relative grid h-20 w-14 shrink-0 place-items-center rounded-2xl bg-cream/80">
                          <Petal color={color} className="h-16 w-8 drop-shadow-sm transition-transform duration-500 group-hover:-rotate-12" />
                        </span>
                        <span className="relative min-w-0 flex-1">
                          <span className="font-display block text-2xl leading-tight text-olive">{active && draft ? draft.name || '—' : c.name}</span>
                          <span dir="ltr" className="font-latin block text-right text-[0.65rem] tracking-[0.25em] text-cocoa/50 uppercase">{c.latinName || '—'}</span>
                          <span className="mt-2 flex flex-wrap gap-1.5">
                            <Pill tone="olive">{counts[c.id] ?? 0} منتج</Pill>
                            <Pill>/{c.slug}</Pill>
                          </span>
                        </span>
                        <span className="relative flex flex-col gap-0.5" onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" aria-label="لفوق" className="size-8 !p-0" disabled={i === 0} onClick={() => move(i, -1)}>
                            <ArrowUp className="size-4" />
                          </Button>
                          <Button variant="ghost" aria-label="لتحت" className="size-8 !p-0" disabled={i === list.length - 1} onClick={() => move(i, 1)}>
                            <ArrowDown className="size-4" />
                          </Button>
                        </span>
                      </div>
                    </motion.li>
                  )
                })}
              </AnimatePresence>
            </ul>
          )}
          <p className="mt-4 text-xs text-cocoa/50">اكبس على أي قسم لتعدّله · الأسهم بتغيّر ترتيب البتلات</p>
        </div>

        {/* المحرر — كمبيوتر: لوحة ثابتة جنب القائمة */}
        {isDesktop && (
          <aside className="sticky top-6 self-start overflow-hidden rounded-3xl border border-sand-deep/40 bg-parchment shadow-[0_24px_50px_-30px_rgb(92_59_47/0.45)]">
            {draft ? (
              <>
                <div className="border-b border-sand px-6 py-4">
                  <p className="text-xs text-cocoa/50">{draft.id ? 'تعديل قسم' : 'قسم جديد'}</p>
                  <h2 className="font-display text-3xl text-olive">{draft.name || 'بدون اسم'}</h2>
                </div>
                <div className="max-h-[calc(100dvh-16rem)] overflow-y-auto px-6 py-5">{editor}</div>
                <div className="border-t border-sand bg-cream/50 px-6 py-4">{editorFooter}</div>
              </>
            ) : (
              <div className="p-10 text-center text-sm text-cocoa/55">اختار قسم من القائمة لتعدّله</div>
            )}
          </aside>
        )}
      </div>

      {/* المحرر — موبايل: درج */}
      {!isDesktop && (
        <Drawer open={!!draft} onClose={() => setDraft(null)} title={draft?.id ? 'تعديل قسم' : 'قسم جديد'} footer={editorFooter}>
          {editor}
        </Drawer>
      )}
    </div>
  )
}
