import { ArrowLeft, ArrowRight, Copy, Eye, EyeOff, Package, Plus, Search, Star, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import { Button, EmptyState, PageHeader, Pill, TextInput, errorText, useToast } from '../../components/admin/ui'
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

  const shownCount = products?.filter((p) => p.active !== false).length ?? 0

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        icon={Package}
        title="المنتجات"
        description={products ? `${products.length} منتج · ${shownCount} ظاهر للزبائن` : 'لحظة...'}
        actions={
          <Link to="/admin/products/new" className="inline-flex items-center gap-2 rounded-full bg-olive px-5 py-2.5 text-sm font-medium text-parchment hover:bg-olive-deep">
            <Plus className="size-4" /> منتج جديد
          </Link>
        }
      />

      {/* بحث وفلترة */}
      <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-sand-deep/40 bg-parchment/70 p-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute inset-y-0 right-3 my-auto size-4 text-cocoa/40" />
          <TextInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ابحث بالاسم..." className="ps-9" />
        </div>
        <div className="flex gap-1.5 overflow-x-auto">
          {[{ id: '', name: 'الكل' }, ...categories].map((c) => (
            <button
              key={c.id || 'all'}
              type="button"
              onClick={() => setCategory(c.id)}
              className={`shrink-0 rounded-full px-3.5 py-2 text-sm transition ${category === c.id ? 'bg-olive text-parchment' : 'text-cocoa-deep/70 hover:bg-sand/50'}`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {!products ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="aspect-[3/4] animate-pulse rounded-3xl bg-sand/40" />)}</div>
      ) : shown.length === 0 ? (
        <EmptyState title="ما في منتجات" text="ضيف أول صينية أو علبة — بتاخد دقيقتين." action={<Link to="/admin/products/new" className="rounded-full bg-olive px-5 py-2.5 text-sm text-parchment">ضيف منتج</Link>} />
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
          {shown.map((p) => {
            const index = products.indexOf(p)
            const hidden = p.active === false
            return (
              <li key={p.id} className={`group flex flex-col overflow-hidden rounded-3xl border border-sand-deep/40 bg-parchment transition hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-28px_rgb(92_59_47/0.6)] ${hidden ? 'opacity-60' : ''}`}>
                <Link to={`/admin/products/${p.id}`} className="relative block">
                  {p.images[0] ? (
                    <img src={p.images[0]} alt="" className="aspect-[4/5] w-full object-cover object-[center_62%] transition duration-700 group-hover:scale-105" />
                  ) : (
                    <span className="grid aspect-[4/5] w-full place-items-center bg-sand/50 text-xs text-cocoa/50">بدون صورة</span>
                  )}
                  <span className="absolute top-2 right-2 flex flex-col items-end gap-1">
                    {hidden && <Pill>مخفي</Pill>}
                    {p.featured && <Pill tone="caramel">⭐ بالرئيسية</Pill>}
                  </span>
                  <span className="absolute bottom-2 left-2 rounded-full bg-parchment/95 px-2.5 py-1 text-xs font-semibold text-cocoa shadow">من {formatPrice(p.price)}</span>
                </Link>
                <div className="flex flex-1 flex-col p-3">
                  <Link to={`/admin/products/${p.id}`} className="font-display line-clamp-1 text-xl text-olive hover:text-cocoa">{p.name}</Link>
                  <p className="text-xs text-cocoa/55">{catName(p.categoryId)} · {p.sizes.length} أحجام</p>
                  <div className="mt-auto flex flex-wrap items-center justify-between gap-1 border-t border-sand/60 pt-2">
                    <div className="flex">
                      <IconBtn label={p.featured ? 'شيله من الرئيسية' : 'حطه بالرئيسية'} onClick={() => update(p, { featured: !p.featured })} active={p.featured}>
                        <Star className={`size-4 ${p.featured ? 'fill-caramel text-caramel' : ''}`} />
                      </IconBtn>
                      <IconBtn label={hidden ? 'أظهره' : 'اخفيه'} onClick={() => update(p, { active: hidden })}>
                        {hidden ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </IconBtn>
                      <IconBtn label="نسخة" onClick={() => duplicate(p)}><Copy className="size-4" /></IconBtn>
                      <IconBtn label="حذف" onClick={() => remove(p)}><Trash2 className="size-4" /></IconBtn>
                    </div>
                    {canMove && (
                      <div className="flex">
                        <IconBtn label="لقدام" onClick={() => move(index, -1)} disabled={index === 0}><ArrowRight className="size-4" /></IconBtn>
                        <IconBtn label="لورا" onClick={() => move(index, 1)} disabled={index === products.length - 1}><ArrowLeft className="size-4" /></IconBtn>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
      <p className="mt-6 text-xs text-cocoa/50">⭐ بيطلع بالرئيسية · 👁 ظاهر للزبائن · الأسهم بتغيّر ترتيبه بالموقع</p>
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
