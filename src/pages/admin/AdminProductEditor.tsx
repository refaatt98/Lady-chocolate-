import { ArrowLeft, ArrowRight, ExternalLink, ImagePlus, Loader2, Plus, Star, Trash2, X } from 'lucide-react'
import { useEffect, useRef, useState, type DragEvent, type PointerEvent, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { TrayPreview } from '../../components/TrayPreview'
import { Button, Card, Field, TagInput, TextArea, TextInput, Toggle, errorText, useToast } from '../../components/admin/ui'
import { adminDeleteImage, adminGetProduct, adminSaveProduct, adminUploadImage, getCategories } from '../../lib/api'
import { compressImage } from '../../lib/image'
import type { Category, CustomizationField, ProductInput, ProductSize, TrayPreviewSpec } from '../../types'

const emptyProduct: ProductInput = {
  slug: '',
  name: '',
  categoryId: '',
  shortDescription: '',
  description: '',
  images: [],
  sizes: [{ id: 'new-1', label: 'صغيرة', pieces: 0, price: 0 }],
  ingredients: [],
  customization: [],
  featured: false,
  active: true,
  sort: 0,
}

/** خانات تخصيص جاهزة بكبسة */
const fieldPresets: CustomizationField[] = [
  { id: 'name', label: 'الاسم', placeholder: 'مثلًا: توفيق', maxLength: 20 },
  { id: 'names', label: 'الأسماء', placeholder: 'مثلًا: منى ومحمود', maxLength: 30 },
  { id: 'date', label: 'التاريخ', placeholder: 'مثلًا: 25.9.26', maxLength: 12 },
  { id: 'phrase', label: 'العبارة', placeholder: 'مثلًا: ألف مبروك', maxLength: 40 },
]

const sizePreset: ProductSize[] = [
  { id: 'p1', label: 'صغيرة', pieces: 0, price: 0 },
  { id: 'p2', label: 'وسط', pieces: 0, price: 0 },
  { id: 'p3', label: 'كبيرة', pieces: 0, price: 0 },
]

const defaultPreview = (image: string, main: string): TrayPreviewSpec => ({ image, disc: { cx: 50, cy: 50, w: 26, h: 22 }, main })

let tempId = 0
const newId = () => `new-${Date.now()}-${tempId++}`

export function AdminProductEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [product, setProduct] = useState<ProductInput | null>(id ? null : emptyProduct)
  const [categories, setCategories] = useState<Category[]>([])
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {})
    if (!id) return
    adminGetProduct(id)
      .then((p) => {
        if (!p) {
          toast('المنتج مش موجود', 'error')
          navigate('/admin/products')
          return
        }
        const { price: _price, ...rest } = p
        void _price
        setProduct(rest)
      })
      .catch((e) => toast(errorText(e), 'error'))
  }, [id, navigate, toast])

  if (!product) return <div className="mx-auto max-w-4xl space-y-4">{[0, 1, 2].map((i) => <div key={i} className="h-40 animate-pulse rounded-2xl bg-sand/40" />)}</div>

  const set = (patch: Partial<ProductInput>) => {
    setProduct((p) => (p ? { ...p, ...patch } : p))
    const keys = Object.keys(patch)
    if (keys.some((k) => errors[k])) setErrors((e) => Object.fromEntries(Object.entries(e).filter(([k]) => !keys.includes(k))))
  }

  const fields = product.customization ?? []

  const validate = () => {
    const e: Record<string, string> = {}
    if (!product.name.trim()) e.name = 'اكتب اسم المنتج'
    if (!/^[a-z0-9-]+$/.test(product.slug)) e.slug = 'بالإنجليزي الصغير وأرقام وشرطات بس، مثلًا: royal-tray'
    if (!product.sizes.length) e.sizes = 'لازم حجم واحد على الأقل'
    else if (product.sizes.some((s) => !s.label.trim() || !(s.price > 0))) e.sizes = 'كل حجم لازم يكون إله اسم وسعر أكبر من صفر'
    const keys = fields.map((f) => f.id)
    if (fields.some((f) => !/^[a-z0-9_]+$/.test(f.id) || !f.label.trim())) e.customization = 'كل خانة لازم إلها اسم ومفتاح إنجليزي (مثلًا name)'
    else if (new Set(keys).size !== keys.length) e.customization = 'في خانتين بنفس المفتاح'
    if (product.preview) {
      if (!product.preview.image) e.preview = 'اختار صورة للمعاينة'
      else if (!keys.includes(product.preview.main)) e.preview = 'اختار أي خانة بتنكتب بنص القرص'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const save = async () => {
    if (!validate()) {
      toast('في كم إشي لازم يتصلّح', 'error')
      return
    }
    setSaving(true)
    try {
      const savedId = await adminSaveProduct(product)
      toast('انحفظ ✓')
      if (!id) navigate(`/admin/products/${savedId}`, { replace: true })
      else setProduct((p) => (p ? { ...p, id: savedId } : p))
    } catch (e) {
      toast(errorText(e), 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl pb-28">
      <Link to="/admin/products" className="mb-4 inline-flex items-center gap-1 text-sm text-cocoa/60 hover:text-olive">
        <ArrowRight className="size-4" /> كل المنتجات
      </Link>
      <h1 className="font-display mb-6 text-4xl text-olive">{id ? product.name || 'تعديل منتج' : 'منتج جديد'}</h1>

      <div className="space-y-6">
        {/* ---------- المعلومات ---------- */}
        <Card title="المعلومات">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="اسم المنتج" error={errors.name}>
              <TextInput value={product.name} onChange={(e) => set({ name: e.target.value })} placeholder="صينية الأبيض الملكي" />
            </Field>
            <Field label="الرابط (بالإنجليزي)" hint={`بيطلع هيك: /product/${product.slug || '...'}`} error={errors.slug}>
              <TextInput
                dir="ltr"
                value={product.slug}
                onChange={(e) => set({ slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                placeholder="royal-white-tray"
              />
            </Field>
            <Field label="القسم">
              <select value={product.categoryId} onChange={(e) => set({ categoryId: e.target.value })} className="w-full rounded-xl border border-sand-deep/60 bg-parchment px-3.5 py-2.5">
                <option value="">بدون قسم</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </Field>
            <Field label="شارة صغيرة (اختياري)" hint="بتطلع على الكرت، مثلًا: جديد، للأعراس، بالاسم">
              <TextInput value={product.badge ?? ''} onChange={(e) => set({ badge: e.target.value })} maxLength={20} />
            </Field>
            <Field label="وصف قصير" hint="سطر أو سطرين — بيطلع على الكرت" className="sm:col-span-2">
              <TextArea rows={2} value={product.shortDescription} onChange={(e) => set({ shortDescription: e.target.value })} maxLength={160} />
            </Field>
            <Field label="الوصف الكامل" hint="بيطلع بصفحة المنتج" className="sm:col-span-2">
              <TextArea rows={4} value={product.description} onChange={(e) => set({ description: e.target.value })} />
            </Field>
            <Field label="المكوّنات" hint="اكتب واكبس Enter بعد كل وحدة" className="sm:col-span-2">
              <TagInput value={product.ingredients} onChange={(v) => set({ ingredients: v })} placeholder="شوكولا بلجيكية بالحليب" />
            </Field>
          </div>
        </Card>

        {/* ---------- الصور ---------- */}
        <ImagesEditor
          images={product.images}
          onChange={(images) => set({ images })}
          onRemoved={(url) => {
            if (product.preview?.image === url) set({ preview: undefined })
          }}
        />

        {/* ---------- الأحجام ---------- */}
        <Card
          title="الأحجام والأسعار"
          description="الزبون بيختار وحدة منهم. أرخص سعر بيطلع على الكرت."
          action={
            product.sizes.length === 0 || (product.sizes.length === 1 && !product.sizes[0].price) ? (
              <Button variant="secondary" onClick={() => set({ sizes: sizePreset.map((s) => ({ ...s, id: newId() })) })}>صغيرة/وسط/كبيرة</Button>
            ) : undefined
          }
        >
          <div className="space-y-2">
            <div className="hidden grid-cols-[1fr_6rem_7rem_5.5rem] gap-2 px-1 text-xs text-cocoa/60 sm:grid">
              <span>الاسم</span>
              <span>عدد القطع</span>
              <span>السعر (₪)</span>
              <span />
            </div>
            {product.sizes.map((s, i) => (
              <div key={s.id} className="grid grid-cols-2 gap-2 rounded-xl bg-cream/50 p-2 sm:grid-cols-[1fr_6rem_7rem_5.5rem] sm:bg-transparent sm:p-0">
                <TextInput className="col-span-2 sm:col-span-1" value={s.label} placeholder="مثلًا: وسط" onChange={(e) => set({ sizes: product.sizes.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} />
                <TextInput type="number" min={0} inputMode="numeric" value={s.pieces || ''} placeholder="قطع" onChange={(e) => set({ sizes: product.sizes.map((x, j) => (j === i ? { ...x, pieces: Number(e.target.value) } : x)) })} />
                <TextInput type="number" min={0} step="0.5" inputMode="decimal" value={s.price || ''} placeholder="سعر" onChange={(e) => set({ sizes: product.sizes.map((x, j) => (j === i ? { ...x, price: Number(e.target.value) } : x)) })} />
                <RowActions
                  className="col-span-2 sm:col-span-1"
                  onUp={i > 0 ? () => set({ sizes: swap(product.sizes, i, i - 1) }) : undefined}
                  onDown={i < product.sizes.length - 1 ? () => set({ sizes: swap(product.sizes, i, i + 1) }) : undefined}
                  onRemove={() => set({ sizes: product.sizes.filter((_, j) => j !== i) })}
                />
              </div>
            ))}
            {errors.sizes && <p className="text-xs text-cocoa">● {errors.sizes}</p>}
            <Button variant="secondary" onClick={() => set({ sizes: [...product.sizes, { id: newId(), label: '', pieces: 0, price: 0 }] })}>
              <Plus className="size-4" /> ضيف حجم
            </Button>
          </div>
        </Card>

        {/* ---------- التخصيص ---------- */}
        <Card title="خانات التخصيص" description="شو بيكتب الزبون؟ (اسم، تاريخ، عبارة...) — بتنبعت مع الطلب، وبتنكتب على المعاينة.">
          <div className="space-y-3">
            {fields.map((f, i) => (
              <div key={i} className="grid gap-2 rounded-xl border border-sand-deep/40 p-3 sm:grid-cols-[1fr_1fr_6rem_auto]">
                <Field label="العنوان">
                  <TextInput value={f.label} onChange={(e) => set({ customization: fields.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} placeholder="الاسم" />
                </Field>
                <Field label="مثال بالخانة">
                  <TextInput value={f.placeholder} onChange={(e) => set({ customization: fields.map((x, j) => (j === i ? { ...x, placeholder: e.target.value } : x)) })} placeholder="مثلًا: منى ومحمود" />
                </Field>
                <Field label="أقصى حروف">
                  <TextInput type="number" min={1} value={f.maxLength ?? ''} onChange={(e) => set({ customization: fields.map((x, j) => (j === i ? { ...x, maxLength: Number(e.target.value) || undefined } : x)) })} />
                </Field>
                <div className="flex items-end gap-2">
                  <Field label="مفتاح" className="w-24">
                    <TextInput dir="ltr" value={f.id} onChange={(e) => set({ customization: fields.map((x, j) => (j === i ? { ...x, id: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') } : x)) })} />
                  </Field>
                  <Button variant="ghost" aria-label="احذف الخانة" className="mb-0.5 size-10 !p-0" onClick={() => set({ customization: fields.filter((_, j) => j !== i) })}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
            {errors.customization && <p className="text-xs text-cocoa">● {errors.customization}</p>}
            <div className="flex flex-wrap gap-2">
              {fieldPresets
                .filter((p) => !fields.some((f) => f.id === p.id))
                .map((p) => (
                  <Button key={p.id} variant="secondary" onClick={() => set({ customization: [...fields, p] })}>
                    <Plus className="size-4" /> {p.label}
                  </Button>
                ))}
              <Button variant="ghost" onClick={() => set({ customization: [...fields, { id: `field_${fields.length + 1}`, label: '', placeholder: '' }] })}>
                <Plus className="size-4" /> خانة ثانية
              </Button>
            </div>
          </div>
        </Card>

        {/* ---------- معاينة الاسم ---------- */}
        <PreviewEditor product={product} set={set} error={errors.preview} />

        {/* ---------- الظهور ---------- */}
        <Card title="الظهور">
          <div className="flex flex-col gap-5 sm:flex-row sm:gap-10">
            <Toggle checked={product.active !== false} onChange={(v) => set({ active: v })} label="ظاهر للزبائن" hint="اطفيه لتخبّي المنتج بدون ما تحذفه" />
            <Toggle checked={product.featured} onChange={(v) => set({ featured: v })} label="بالصفحة الرئيسية" hint="بيطلع بسكشن الهدايا الملفوفة" />
          </div>
        </Card>
      </div>

      {/* شريط الحفظ */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-sand-deep/40 bg-parchment/95 backdrop-blur md:right-60">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3 sm:px-6">
          <Button onClick={save} loading={saving} className="px-8">
            حفظ
          </Button>
          {id && product.slug && (
            <a href={`/product/${product.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-cocoa/70 hover:text-olive">
              <ExternalLink className="size-4" /> شوفه بالموقع
            </a>
          )}
          <Link to="/admin/products" className="ms-auto text-sm text-cocoa/60 hover:text-cocoa">إلغاء</Link>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */

function swap<T>(list: T[], a: number, b: number) {
  const copy = [...list]
  ;[copy[a], copy[b]] = [copy[b], copy[a]]
  return copy
}

function RowActions({ onUp, onDown, onRemove, className = '' }: { onUp?: () => void; onDown?: () => void; onRemove: () => void; className?: string }) {
  return (
    <div className={`flex items-center justify-end gap-0.5 ${className}`}>
      <Button variant="ghost" aria-label="لفوق" className="size-9 !p-0" disabled={!onUp} onClick={onUp}><ArrowRight className="size-4 rotate-90" /></Button>
      <Button variant="ghost" aria-label="لتحت" className="size-9 !p-0" disabled={!onDown} onClick={onDown}><ArrowLeft className="size-4 rotate-90" /></Button>
      <Button variant="ghost" aria-label="احذف" className="size-9 !p-0" onClick={onRemove}><X className="size-4" /></Button>
    </div>
  )
}

/* ---------------- الصور ---------------- */

function ImagesEditor({ images, onChange, onRemoved }: { images: string[]; onChange: (v: string[]) => void; onRemoved: (url: string) => void }) {
  const toast = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  // نسخة حيّة من الصور عشان الرفع المتوازي ما يمسح بعضه
  const latest = useRef(images)
  latest.current = images

  const upload = async (files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => f.type.startsWith('image/'))
    if (!list.length) return
    setUploading((n) => n + list.length)
    for (const file of list) {
      try {
        const blob = await compressImage(file)
        const url = await adminUploadImage(blob, file.name)
        latest.current = [...latest.current, url]
        onChange(latest.current)
      } catch (e) {
        toast(`${file.name}: ${errorText(e)}`, 'error')
      } finally {
        setUploading((n) => n - 1)
      }
    }
  }

  const remove = async (url: string) => {
    if (!confirm('تحذف هالصورة؟')) return
    onChange(images.filter((u) => u !== url))
    onRemoved(url)
    adminDeleteImage(url).catch(() => {})
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    upload(e.dataTransfer.files)
  }

  return (
    <Card title="الصور" description="أول صورة هي الرئيسية (بتطلع على الكرت). الصور بتصغر لحالها قبل الرفع.">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {images.map((url, i) => (
          <div key={url} className="group relative overflow-hidden rounded-xl border border-sand-deep/40 bg-cream">
            <img src={url} alt="" className="aspect-[4/5] w-full object-cover object-[center_62%]" />
            {i === 0 && <span className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-olive px-2 py-0.5 text-[0.65rem] text-parchment"><Star className="size-3" /> الرئيسية</span>}
            <div className="absolute inset-x-0 bottom-0 flex justify-between bg-gradient-to-t from-cocoa-deep/70 to-transparent p-1.5 pt-6">
              <div className="flex">
                <button type="button" aria-label="لقدام" disabled={i === 0} onClick={() => onChange(swap(images, i, i - 1))} className="grid size-8 place-items-center rounded-full text-parchment disabled:opacity-30 hover:bg-white/20">
                  <ArrowRight className="size-4" />
                </button>
                <button type="button" aria-label="لورا" disabled={i === images.length - 1} onClick={() => onChange(swap(images, i, i + 1))} className="grid size-8 place-items-center rounded-full text-parchment disabled:opacity-30 hover:bg-white/20">
                  <ArrowLeft className="size-4" />
                </button>
              </div>
              <button type="button" aria-label="احذف الصورة" onClick={() => remove(url)} className="grid size-8 place-items-center rounded-full text-parchment hover:bg-cocoa">
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>
        ))}
        {Array.from({ length: uploading }, (_, i) => (
          <div key={`u${i}`} className="grid aspect-[4/5] place-items-center rounded-xl bg-sand/40">
            <Loader2 className="size-6 animate-spin text-olive" />
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`flex aspect-[4/5] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed text-sm transition ${dragOver ? 'border-olive bg-olive/10 text-olive' : 'border-sand-deep/60 text-cocoa/60 hover:border-olive hover:text-olive'}`}
        >
          <ImagePlus className="size-7" />
          ضيف صور
          <span className="text-[0.65rem] opacity-70">أو اسحبها لهون</span>
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files) upload(e.target.files)
          e.target.value = ''
        }}
      />
    </Card>
  )
}

/* ---------------- معاينة الاسم على القرص ---------------- */

function PreviewEditor({ product, set, error }: { product: ProductInput; set: (p: Partial<ProductInput>) => void; error?: string }) {
  const fields = product.customization ?? []
  const preview = product.preview
  const boxRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  const update = (patch: Partial<TrayPreviewSpec>) => preview && set({ preview: { ...preview, ...patch } })
  const updateDisc = (patch: Partial<TrayPreviewSpec['disc']>) => preview && update({ disc: { ...preview.disc, ...patch } })

  const moveTo = (e: PointerEvent) => {
    const box = boxRef.current?.getBoundingClientRect()
    if (!box || !preview) return
    const cx = Math.round(((e.clientX - box.left) / box.width) * 1000) / 10
    const cy = Math.round(((e.clientY - box.top) / box.height) * 1000) / 10
    updateDisc({ cx: Math.min(95, Math.max(5, cx)), cy: Math.min(95, Math.max(5, cy)) })
  }

  const sample = (key?: string) => {
    if (!key) return undefined
    const f = fields.find((x) => x.id === key)
    return f?.placeholder.replace(/^مثلًا:\s*/, '') || f?.label || ''
  }

  return (
    <Card
      title="معاينة الاسم على الصينية"
      description='بتشغّل "جرّب اسمك" بصفحة المنتج: الزبون بيكتب وبيشوف الاسم على القرص.'
      action={
        <Toggle
          checked={!!preview}
          onChange={(on) => set({ preview: on ? defaultPreview(product.images[0] ?? '', fields[0]?.id ?? '') : undefined })}
          label={preview ? 'شغّالة' : 'مطفية'}
        />
      }
    >
      {!preview ? (
        <p className="text-sm text-cocoa/60">{fields.length ? 'شغّلها إذا المنتج فيه قرص بينكتب عليه.' : 'ضيف خانة تخصيص أول (متل الاسم)، وبعدين شغّلها.'}</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <p className="mb-2 text-sm text-cocoa-deep/80">١. اكبس أو اسحب على مكان القرص بالصورة</p>
            {preview.image ? (
              <div
                ref={boxRef}
                className="relative cursor-crosshair touch-none overflow-hidden rounded-xl select-none"
                onPointerDown={(e) => {
                  dragging.current = true
                  e.currentTarget.setPointerCapture(e.pointerId)
                  moveTo(e)
                }}
                onPointerMove={(e) => dragging.current && moveTo(e)}
                onPointerUp={() => (dragging.current = false)}
              >
                <img src={preview.image} alt="" draggable={false} className="aspect-square w-full object-cover" />
                <span
                  className="pointer-events-none absolute rounded-[50%] border-2 border-dashed border-olive bg-olive/15 shadow-[0_0_0_9999px_rgb(0_0_0/0.25)]"
                  style={{ left: `${preview.disc.cx - preview.disc.w / 2}%`, top: `${preview.disc.cy - preview.disc.h / 2}%`, width: `${preview.disc.w}%`, height: `${preview.disc.h}%` }}
                />
              </div>
            ) : (
              <p className="rounded-xl bg-sand/40 p-6 text-center text-sm text-cocoa/60">ارفع صورة أول</p>
            )}

            <div className="mt-4 space-y-3">
              <Field label="صورة المعاينة" hint="الأفضل صورة مربعة من فوق والصينية بالنص">
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {product.images.map((url) => (
                    <button key={url} type="button" onClick={() => update({ image: url })} className={`size-14 shrink-0 overflow-hidden rounded-lg border-2 ${preview.image === url ? 'border-olive' : 'border-transparent opacity-60'}`}>
                      <img src={url} alt="" className="size-full object-cover" />
                    </button>
                  ))}
                </div>
              </Field>
              <Slider label="عرض القرص" value={preview.disc.w} min={8} max={70} onChange={(w) => updateDisc({ w })} />
              <Slider label="طول القرص" value={preview.disc.h} min={8} max={70} onChange={(h) => updateDisc({ h })} />
              <Toggle checked={preview.coverTo !== undefined} onChange={(on) => update({ coverTo: on ? 60 : undefined })} label="القرص فيه رسمة تحت" hint="منغطي بس الجزء الفوقاني عشان الرسمة تضل ظاهرة" />
              {preview.coverTo !== undefined && <Slider label="لوين نغطي" value={preview.coverTo} min={30} max={90} onChange={(coverTo) => update({ coverTo })} />}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm text-cocoa-deep/80">٢. شو بينكتب وين</p>
            <div className="mb-4 grid grid-cols-3 gap-2">
              {(
                [
                  ['top', 'فوق (صغير)'],
                  ['main', 'بالنص (كبير)'],
                  ['bottom', 'تحت (صغير)'],
                ] as const
              ).map(([slot, label]) => (
                <Field key={slot} label={label}>
                  <select
                    value={preview[slot] ?? ''}
                    onChange={(e) => update({ [slot]: e.target.value || undefined } as Partial<TrayPreviewSpec>)}
                    className="w-full rounded-xl border border-sand-deep/60 bg-parchment px-2 py-2 text-sm"
                  >
                    {slot !== 'main' && <option value="">ولا إشي</option>}
                    {fields.map((f) => (
                      <option key={f.id} value={f.id}>{f.label || f.id}</option>
                    ))}
                  </select>
                </Field>
              ))}
            </div>
            <p className="mb-2 text-sm text-cocoa-deep/80">٣. هيك بيشوفها الزبون</p>
            {preview.image && preview.main ? (
              <TrayPreview spec={preview} top={preview.top ? sample(preview.top) : undefined} main={sample(preview.main) ?? ''} bottom={preview.bottom ? sample(preview.bottom) : undefined} alt="" className="rounded-xl" />
            ) : (
              <p className="rounded-xl bg-sand/40 p-6 text-center text-sm text-cocoa/60">اختار صورة وخانة للنص</p>
            )}
            {error && <p className="mt-2 text-xs text-cocoa">● {error}</p>}
          </div>
        </div>
      )}
    </Card>
  )
}

function Slider({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }): ReactNode {
  return (
    <label className="block">
      <span className="flex justify-between text-sm text-cocoa-deep/80">
        {label}
        <span dir="ltr" className="font-latin text-xs text-cocoa/50">{value.toFixed(1)}%</span>
      </span>
      <input type="range" min={min} max={max} step={0.2} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-olive" />
    </label>
  )
}
