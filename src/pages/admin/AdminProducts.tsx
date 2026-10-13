import { ArrowDown, ArrowUp, Copy, Eye, EyeOff, Pencil, Plus, Star, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import { Button, TextInput, errorText, useToast } from '../../components/admin/ui'
import { adminDeleteProduct, adminListProducts, adminSaveProduct, adminUpdateProduct, getCategories } from '../../lib/api'
import { formatPrice } from '../../lib/format'
import type { Category, Product } from '../../types'

export function AdminProducts() {
  const toast = useToast()
  const navigate = useNavigate()
  const [products, setProducts] = useState<Product[] | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')

  const load = useCallback(async () => {
    try {
      const [p, c] = await Promise.all([adminListProducts(), getCategories()])
      setProducts(p)
      setCategories(c)
    } catch (e) {
      toast(errorText(e), 'error')
    }
  }, [toast])

  useEffect(() => {
    load()
  }, [load])

  const shown = useMemo(
    () =>
      (products ?? []).filter(
        (p) => (!category || p.categoryId === category) && (!query.trim() || p.name.includes(query.trim()) || p.slug.includes(query.trim().toLowerCase())),
      ),
    [products, category, query],
  )

  const update = async (p: Product, change: { active?: boolean; featured?: boolean }) => {
    setProducts((list) => list?.map((x) => (x.id === p.id ? { ...x, ...change } : x)) ?? null)
    try {
      await adminUpdateProduct(p.id, change)
      if (change.active !== undefined) toast(change.active ? `${p.name} صار ظاهر بالموقع` : `${p.name} انخفى عن الموقع`)
      if (change.featured !== undefined) toast(change.featured ? `${p.name} صار بالرئيسية` : `${p.name} انشال من الرئيسية`)
    } catch (e) {
      toast(errorText(e), 'error')
      load()
    }
  }

  /** تحريك منتج لفوق/تحت بالترتيب */
  const move = async (index: number, dir: -1 | 1) => {
    if (!products) return
    const list = [...products]
    const j = index + dir
    if (j < 0 || j >= list.length) return
    ;[list[index], list[j]] = [list[j], list[index]]
    const withSort = list.map((p, i) => ({ ...p, sort: i + 1 }))
    setProducts(withSort)
    try {
      // منحفظ الترتيب لكل اللي تغيّر رقمه (المنتجات الجديدة بتبلش كلها sort = 0)
      await Promise.all(withSort.filter((p) => products.find((x) => x.id === p.id)?.sort !== p.sort).map((p) => adminUpdateProduct(p.id, { sort: p.sort })))
    } catch (e) {
      toast(errorText(e), 'error')
      load()
    }
  }

  const duplicate = async (p: Product) => {
    try {
      const { id: _id, price: _price, ...rest } = p
      void _id
      void _price
      const id = await adminSaveProduct({ ...rest, name: `${p.name} (نسخة)`, slug: `${p.slug}-copy-${Date.now().toString(36).slice(-4)}`, active: false })
      toast('انعملت نسخة (مخفية) — عدّلها')
      navigate(`/admin/products/${id}`)
    } catch (e) {
      toast(errorText(e), 'error')
    }
  }

  const remove = async (p: Product) => {
    if (!confirm(`متأكد بدك تحذف "${p.name}" نهائيًا؟\nإذا بدك بس تخفيه عن الزبائن، استعمل زر الإخفاء.`)) return
    try {
      await adminDeleteProduct(p.id)
      setProducts((list) => list?.filter((x) => x.id !== p.id) ?? null)
      toast('انحذف المنتج')
    } catch (e) {
      toast(errorText(e), 'error')
    }
  }

  const catName = (id: string) => categories.find((c) => c.id === id)?.name ?? '—'
  const canMove = !query && !category

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl text-olive">المنتجات</h1>
          <p className="mt-1 text-sm text-cocoa/60">{products ? `${products.length} منتج · ${products.filter((p) => p.active !== false).length} ظاهر` : '...'}</p>
        </div>
        <Link to="/admin/products/new" className="inline-flex items-center gap-2 rounded-full bg-olive px-5 py-2.5 text-sm font-medium text-parchment hover:bg-olive-deep">
          <Plus className="size-4" /> منتج جديد
        </Link>
      </div>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <TextInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ابحث بالاسم..." className="sm:max-w-xs" />
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-xl border border-sand-deep/60 bg-parchment px-3.5 py-2.5 text-sm">
          <option value="">كل الأقسام</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {!products ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-sand/40" />)}</div>
      ) : shown.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-sand-deep/60 px-6 py-16 text-center">
          <p className="font-display text-3xl text-olive">ما في منتجات</p>
          <Link to="/admin/products/new" className="mt-4 inline-block text-sm text-olive underline">ضيف أول منتج</Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {shown.map((p) => {
            const index = products.indexOf(p)
            const hidden = p.active === false
            return (
              <li key={p.id} className={`flex flex-wrap items-center gap-4 rounded-2xl border border-sand-deep/40 bg-parchment p-3 sm:flex-nowrap ${hidden ? 'opacity-60' : ''}`}>
                <Link to={`/admin/products/${p.id}`} className="flex min-w-0 basis-full items-center gap-4 sm:basis-auto sm:flex-1">
                  {p.images[0] ? (
                    <img src={p.images[0]} alt="" className="size-16 shrink-0 rounded-t-full rounded-b-lg object-cover object-[center_62%]" />
                  ) : (
                    <span className="grid size-16 shrink-0 place-items-center rounded-lg bg-sand/50 text-xs text-cocoa/50">بدون صورة</span>
                  )}
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-display text-xl text-olive">{p.name}</span>
                      {hidden && <span className="rounded-full bg-sand px-2 py-0.5 text-[0.65rem]">مخفي</span>}
                      {p.featured && <span className="rounded-full bg-caramel/25 px-2 py-0.5 text-[0.65rem] text-cocoa">بالرئيسية</span>}
                    </span>
                    <span className="block text-xs text-cocoa/60">
                      {catName(p.categoryId)} · {p.sizes.length} أحجام · من {formatPrice(p.price)}
                    </span>
                  </span>
                </Link>
                <div className="flex w-full items-center justify-end gap-0.5 border-t border-sand/60 pt-2 sm:w-auto sm:border-0 sm:pt-0">
                  {canMove && (
                    <>
                      <IconBtn label="لفوق" onClick={() => move(index, -1)} disabled={index === 0}><ArrowUp className="size-4" /></IconBtn>
                      <IconBtn label="لتحت" onClick={() => move(index, 1)} disabled={index === products.length - 1}><ArrowDown className="size-4" /></IconBtn>
                    </>
                  )}
                  <IconBtn label={p.featured ? 'شيله من الرئيسية' : 'حطه بالرئيسية'} onClick={() => update(p, { featured: !p.featured })} active={p.featured}>
                    <Star className={`size-4 ${p.featured ? 'fill-caramel text-caramel' : ''}`} />
                  </IconBtn>
                  <IconBtn label={hidden ? 'أظهره' : 'اخفيه'} onClick={() => update(p, { active: hidden })}>
                    {hidden ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </IconBtn>
                  <IconBtn label="نسخة" onClick={() => duplicate(p)}><Copy className="size-4" /></IconBtn>
                  <IconBtn label="تعديل" onClick={() => navigate(`/admin/products/${p.id}`)}><Pencil className="size-4" /></IconBtn>
                  <IconBtn label="حذف" onClick={() => remove(p)}><Trash2 className="size-4" /></IconBtn>
                </div>
              </li>
            )
          })}
        </ul>
      )}
      <p className="mt-6 text-xs text-cocoa/50">⭐ = بيطلع بالرئيسية · 👁 = ظاهر للزبائن · الأسهم بتغيّر الترتيب بالموقع</p>
    </div>
  )
}

function IconBtn({ label, onClick, disabled, active, children }: { label: string; onClick: () => void; disabled?: boolean; active?: boolean; children: ReactNode }) {
  return (
    <Button variant="ghost" aria-label={label} title={label} onClick={onClick} disabled={disabled} className={`size-9 !p-0 ${active ? 'text-cocoa' : ''}`}>
      {children}
    </Button>
  )
}
