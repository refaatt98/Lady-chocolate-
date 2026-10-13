import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Button, Card, Field, TextArea, TextInput, errorText, useToast } from '../../components/admin/ui'
import { adminDeleteCategory, adminListProducts, adminSaveCategory, getCategories } from '../../lib/api'
import type { Category } from '../../types'

const tones: { id: Category['tone']; label: string; color: string }[] = [
  { id: 'olive', label: 'زيتي', color: 'var(--color-olive)' },
  { id: 'milk', label: 'بالحليب', color: 'var(--color-milk)' },
  { id: 'dark', label: 'داكن', color: 'var(--color-cocoa-deep)' },
  { id: 'white', label: 'أبيض', color: 'var(--color-cream)' },
  { id: 'caramel', label: 'كراميل', color: 'var(--color-caramel)' },
]

type Draft = Omit<Category, 'id'> & { id?: string }
const blank: Draft = { slug: '', name: '', latinName: '', description: '', tone: 'milk' }

export function AdminCategories() {
  const toast = useToast()
  const [list, setList] = useState<Draft[] | null>(null)
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [savingIndex, setSavingIndex] = useState<number | null>(null)

  const load = useCallback(async () => {
    try {
      const [cats, products] = await Promise.all([getCategories(), adminListProducts()])
      setList(cats)
      setCounts(products.reduce<Record<string, number>>((acc, p) => ({ ...acc, [p.categoryId]: (acc[p.categoryId] ?? 0) + 1 }), {}))
    } catch (e) {
      toast(errorText(e), 'error')
    }
  }, [toast])

  useEffect(() => {
    load()
  }, [load])

  if (!list) return <div className="mx-auto max-w-3xl space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-sand/40" />)}</div>

  const edit = (i: number, patch: Partial<Draft>) => setList((l) => l?.map((c, j) => (j === i ? { ...c, ...patch } : c)) ?? null)

  const save = async (i: number) => {
    const c = list[i]
    if (!c.name.trim()) return toast('اكتب اسم القسم', 'error')
    if (!/^[a-z0-9-]+$/.test(c.slug)) return toast('الرابط بالإنجليزي الصغير وشرطات بس، مثلًا: dark', 'error')
    setSavingIndex(i)
    try {
      await adminSaveCategory({ ...c, sort: i + 1 })
      toast(`انحفظ "${c.name}"`)
      await load()
    } catch (e) {
      toast(errorText(e), 'error')
    } finally {
      setSavingIndex(null)
    }
  }

  const move = async (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= list.length) return
    const copy = [...list]
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
    setList(copy)
    try {
      // منحفظ الترتيب بس للأقسام المحفوظة
      await Promise.all(copy.map((c, k) => (c.id ? adminSaveCategory({ ...c, sort: k + 1 }) : null)))
    } catch (e) {
      toast(errorText(e), 'error')
      load()
    }
  }

  const remove = async (i: number) => {
    const c = list[i]
    if (!c.id) return setList(list.filter((_, j) => j !== i))
    const n = counts[c.id] ?? 0
    if (!confirm(n ? `بالقسم "${c.name}" في ${n} منتجات — رح يضلوا بس بدون قسم. متأكد؟` : `تحذف القسم "${c.name}"؟`)) return
    try {
      await adminDeleteCategory(c.id)
      toast('انحذف القسم')
      load()
    } catch (e) {
      toast(errorText(e), 'error')
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl text-olive">الأقسام</h1>
          <p className="mt-1 text-sm text-cocoa/60">كل قسم = بتلة بزهرة الأقسام بالرئيسية، وفلتر بالتشكيلة.</p>
        </div>
        <Button onClick={() => setList([...list, { ...blank }])}>
          <Plus className="size-4" /> قسم جديد
        </Button>
      </div>

      <div className="space-y-4">
        {list.map((c, i) => (
          <Card key={c.id ?? `new-${i}`}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="الاسم">
                <TextInput value={c.name} onChange={(e) => edit(i, { name: e.target.value })} placeholder="داكنة" />
              </Field>
              <Field label="الاسم بالإنجليزي" hint="بيطلع صغير تحت الاسم">
                <TextInput dir="ltr" value={c.latinName} onChange={(e) => edit(i, { latinName: e.target.value })} placeholder="Dark" />
              </Field>
              <Field label="الرابط" hint={`/shop?category=${c.slug || '...'}`}>
                <TextInput dir="ltr" value={c.slug} onChange={(e) => edit(i, { slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} placeholder="dark" />
              </Field>
              <Field label="لون البتلة">
                <div className="flex flex-wrap gap-2">
                  {tones.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => edit(i, { tone: t.id })}
                      className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs ${c.tone === t.id ? 'border-olive ring-2 ring-olive/20' : 'border-sand-deep/50'}`}
                    >
                      <span className="size-4 rounded-full ring-1 ring-black/10" style={{ background: t.color }} />
                      {t.label}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="الوصف" className="sm:col-span-2">
                <TextArea rows={2} value={c.description} onChange={(e) => edit(i, { description: e.target.value })} />
              </Field>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-sand/70 pt-4">
              <Button onClick={() => save(i)} loading={savingIndex === i}>حفظ</Button>
              {c.id && <span className="text-xs text-cocoa/55">{counts[c.id] ?? 0} منتج</span>}
              <div className="ms-auto flex">
                <Button variant="ghost" aria-label="لفوق" className="size-9 !p-0" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp className="size-4" /></Button>
                <Button variant="ghost" aria-label="لتحت" className="size-9 !p-0" disabled={i === list.length - 1} onClick={() => move(i, 1)}><ArrowDown className="size-4" /></Button>
                <Button variant="ghost" aria-label="احذف" className="size-9 !p-0" onClick={() => remove(i)}><Trash2 className="size-4" /></Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
