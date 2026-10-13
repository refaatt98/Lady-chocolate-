import { BookOpen, Flower2, Gift, ImagePlus, Loader2, PenLine, PenSquare, RotateCcw, Save, Sparkles, Waves, Workflow } from 'lucide-react'
import { useEffect, useRef, useState, type ComponentType } from 'react'
import { Link } from 'react-router'
import { Button, Card, ColorPicker, Field, PageHeader, TagInput, TextArea, TextInput, errorText, useToast } from '../../components/admin/ui'
import { defaultContent } from '../../data/content'
import { adminListProducts, adminSaveContent, adminUploadImage, getSiteInfo } from '../../lib/api'
import { compressImage } from '../../lib/image'
import type { Product, SiteContent } from '../../types'

type SectionKey = keyof SiteContent

const sections: { key: SectionKey; label: string; icon: ComponentType<{ className?: string }>; hint: string }[] = [
  { key: 'hero', label: 'الواجهة', icon: Sparkles, hint: 'أول إشي بيشوفه الزبون — جنب النافورة' },
  { key: 'ribbon', label: 'شريط المناسبات', icon: Waves, hint: 'الكلمات اللي بتمشي بالشريط البني' },
  { key: 'categories', label: 'زهرة الأقسام', icon: Flower2, hint: 'عنوان سكشن الأقسام (البتلات نفسها من صفحة الأقسام)' },
  { key: 'products', label: 'الهدايا', icon: Gift, hint: 'عنوان سكشن المنتجات المميزة' },
  { key: 'journey', label: 'الحكاية', icon: BookOpen, hint: 'الفصول اللي بتنسحب يمين ويسار' },
  { key: 'nameSection', label: 'جرّب اسمك', icon: PenLine, hint: 'الصينية اللي بينكتب عليها الاسم' },
  { key: 'howTo', label: 'كيف تطلب', icon: Workflow, hint: 'الخطوات الثلاث' },
]

export function AdminContent() {
  const toast = useToast()
  const [content, setContent] = useState<SiteContent | null>(null)
  const [saved, setSaved] = useState('')
  const [tab, setTab] = useState<SectionKey>('hero')
  const [saving, setSaving] = useState(false)
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    getSiteInfo()
      .then((s) => {
        setContent(s.content)
        setSaved(JSON.stringify(s.content))
      })
      .catch((e) => toast(errorText(e), 'error'))
    adminListProducts().then(setProducts).catch(() => {})
  }, [toast])

  if (!content) return <div className="mx-auto h-96 max-w-5xl animate-pulse rounded-3xl bg-sand/40" />

  const dirty = JSON.stringify(content) !== saved
  const set = <K extends SectionKey>(key: K, patch: Partial<SiteContent[K]>) => setContent((c) => (c ? { ...c, [key]: { ...c[key], ...patch } } : c))

  const save = async () => {
    setSaving(true)
    try {
      await adminSaveContent(content)
      setSaved(JSON.stringify(content))
      toast('انحفظ المحتوى — بيبيّن بالموقع فورًا')
    } catch (e) {
      toast(errorText(e), 'error')
    } finally {
      setSaving(false)
    }
  }

  const resetSection = () => {
    if (!confirm('ترجّع نصوص هالسكشن للأصلية؟')) return
    setContent((c) => (c ? { ...c, [tab]: structuredClone(defaultContent[tab]) } : c))
  }

  const current = sections.find((s) => s.key === tab)!
  const previewProducts = products.filter((p) => p.preview)

  return (
    <div className="mx-auto max-w-5xl pb-28">
      <PageHeader icon={PenSquare} title="محتوى الموقع" description="كل العناوين والنصوص بالصفحة الرئيسية — عدّل واحفظ، وبتتغيّر فورًا." />

      <div className="grid gap-6 lg:grid-cols-[14rem_1fr]">
        {/* السكاشن */}
        <nav className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
          {sections.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`flex shrink-0 items-center gap-2.5 rounded-2xl px-3.5 py-3 text-right text-sm transition ${
                tab === key ? 'bg-olive text-parchment shadow-[0_10px_24px_-14px_rgb(98_106_70/0.9)]' : 'bg-parchment/70 text-cocoa-deep/75 hover:bg-parchment'
              }`}
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </button>
          ))}
        </nav>

        <Card
          title={current.label}
          description={current.hint}
          action={
            <Button variant="ghost" onClick={resetSection}>
              <RotateCcw className="size-4" /> الأصلي
            </Button>
          }
        >
          {tab === 'hero' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="الكلمة الصغيرة فوق (إنجليزي)">
                <TextInput dir="ltr" value={content.hero.eyebrow} onChange={(e) => set('hero', { eyebrow: e.target.value })} />
              </Field>
              <div />
              <Field label="العنوان — السطر الأول" hint="بالأخضر">
                <TextInput value={content.hero.titleLine1} onChange={(e) => set('hero', { titleLine1: e.target.value })} className="font-display text-xl" />
              </Field>
              <Field label="العنوان — السطر الثاني" hint="بالبني، وتحته خط الكراميل">
                <TextInput value={content.hero.titleLine2} onChange={(e) => set('hero', { titleLine2: e.target.value })} className="font-display text-xl" />
              </Field>
              <Field label="الجملة تحت العنوان" className="sm:col-span-2">
                <TextArea rows={2} value={content.hero.text} onChange={(e) => set('hero', { text: e.target.value })} />
              </Field>
              <Field label="الزر الأساسي">
                <TextInput value={content.hero.primaryCta} onChange={(e) => set('hero', { primaryCta: e.target.value })} />
              </Field>
              <Field label="زر الواتساب">
                <TextInput value={content.hero.secondaryCta} onChange={(e) => set('hero', { secondaryCta: e.target.value })} />
              </Field>
              <Field label="الكلمات الصغيرة تحت الأزرار" hint="Enter بعد كل وحدة" className="sm:col-span-2">
                <TagInput value={content.hero.chips} onChange={(chips) => set('hero', { chips })} />
              </Field>
            </div>
          )}

          {tab === 'ribbon' && (
            <Field label="كلمات الشريط" hint="Enter بعد كل كلمة — بتمشي بشريط الشوكولا">
              <TagInput value={content.ribbon.words} onChange={(words) => set('ribbon', { words })} />
            </Field>
          )}

          {(tab === 'categories' || tab === 'products') && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="الكلمة الصغيرة فوق (إنجليزي)">
                <TextInput dir="ltr" value={content[tab].eyebrow} onChange={(e) => set(tab, { eyebrow: e.target.value })} />
              </Field>
              <Field label="العنوان">
                <TextInput value={content[tab].title} onChange={(e) => set(tab, { title: e.target.value })} className="font-display text-xl" />
              </Field>
              <Field label="الوصف" className="sm:col-span-2">
                <TextArea rows={2} value={content[tab].description} onChange={(e) => set(tab, { description: e.target.value })} />
              </Field>
              {tab === 'categories' && (
                <Field label="التلميح تحت الزهرة" className="sm:col-span-2">
                  <TextInput value={content.categories.hint} onChange={(e) => set('categories', { hint: e.target.value })} />
                </Field>
              )}
              {tab === 'categories' && (
                <p className="text-xs text-cocoa/55 sm:col-span-2">
                  أسماء البتلات وألوانها وأوصافها من <Link to="/admin/categories" className="text-olive underline">صفحة الأقسام</Link>.
                </p>
              )}
            </div>
          )}

          {tab === 'journey' && (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="الكلمة الصغيرة فوق (إنجليزي)">
                  <TextInput dir="ltr" value={content.journey.eyebrow} onChange={(e) => set('journey', { eyebrow: e.target.value })} />
                </Field>
                <Field label="العنوان">
                  <TextInput value={content.journey.title} onChange={(e) => set('journey', { title: e.target.value })} className="font-display text-xl" />
                </Field>
              </div>
              {content.journey.chapters.map((ch, i) => (
                <div key={i} className="rounded-2xl border border-sand-deep/40 bg-cream/40 p-4">
                  <p className="font-display mb-3 text-xl text-cocoa">الفصل {['الأول', 'الثاني', 'الثالث', 'الرابع'][i]}</p>
                  <div className="grid gap-3 sm:grid-cols-[14rem_1fr]">
                    <Field label="العنوان">
                      <TextInput
                        value={ch.title}
                        onChange={(e) => set('journey', { chapters: content.journey.chapters.map((c, j) => (j === i ? { ...c, title: e.target.value } : c)) })}
                      />
                    </Field>
                    <Field label="النص">
                      <TextArea
                        rows={2}
                        value={ch.text}
                        onChange={(e) => set('journey', { chapters: content.journey.chapters.map((c, j) => (j === i ? { ...c, text: e.target.value } : c)) })}
                      />
                    </Field>
                  </div>
                </div>
              ))}
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <p className="mb-2 text-sm font-medium text-cocoa-deep/80">لون حبة الكاكاو (الفصل الأول)</p>
                  <ColorPicker value={content.journey.beanColor} onChange={(beanColor) => set('journey', { beanColor })} />
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium text-cocoa-deep/80">لون الورق</p>
                  <ColorPicker value={content.journey.leafColor} onChange={(leafColor) => set('journey', { leafColor })} />
                </div>
              </div>
              <ImageField label="صورة الفصل الأخير" value={content.journey.image} onChange={(image) => set('journey', { image })} products={products} />
            </div>
          )}

          {tab === 'nameSection' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="الصينية" hint="الصورة ومكان الاسم بيجوا من 'معاينة الاسم' تبع المنتج" className="sm:col-span-2">
                <select
                  value={content.nameSection.productSlug}
                  onChange={(e) => set('nameSection', { productSlug: e.target.value })}
                  className="w-full rounded-xl border border-sand-deep/60 bg-parchment px-3.5 py-2.5"
                >
                  {!previewProducts.some((p) => p.slug === content.nameSection.productSlug) && <option value={content.nameSection.productSlug}>— اختار صينية —</option>}
                  {previewProducts.map((p) => (
                    <option key={p.id} value={p.slug}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </Field>
              {(() => {
                const p = products.find((x) => x.slug === content.nameSection.productSlug)
                return p?.preview ? (
                  <div className="flex items-center gap-4 rounded-2xl bg-cream/60 p-3 sm:col-span-2">
                    <img src={p.preview.image} alt="" className="size-20 rounded-xl object-cover" />
                    <div className="text-sm">
                      <p className="text-cocoa-deep">بدك تغيّر الصورة أو مكان الاسم؟</p>
                      <Link to={`/admin/products/${p.id}`} className="text-olive underline">
                        عدّلها من صفحة {p.name} ← معاينة الاسم
                      </Link>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-cocoa sm:col-span-2">● الصينية المختارة ما إلها "معاينة اسم" — السكشن ما رح يطلع لحد ما تشغّلها من صفحة المنتج.</p>
                )
              })()}
              <Field label="الكلمة الصغيرة فوق (إنجليزي)">
                <TextInput dir="ltr" value={content.nameSection.eyebrow} onChange={(e) => set('nameSection', { eyebrow: e.target.value })} />
              </Field>
              <Field label="العنوان">
                <TextInput value={content.nameSection.title} onChange={(e) => set('nameSection', { title: e.target.value })} className="font-display text-xl" />
              </Field>
              <Field label="الوصف" className="sm:col-span-2">
                <TextArea rows={2} value={content.nameSection.description} onChange={(e) => set('nameSection', { description: e.target.value })} />
              </Field>
              <Field label="المناسبات" hint="Enter بعد كل وحدة — بتنضاف للطلب" className="sm:col-span-2">
                <TagInput value={content.nameSection.occasions} onChange={(occasions) => set('nameSection', { occasions })} />
              </Field>
              <Field label="نص الزر" hint="الزر بيضيف الصينية للطلبية" className="sm:col-span-2">
                <TextInput value={content.nameSection.buttonText} onChange={(e) => set('nameSection', { buttonText: e.target.value })} />
              </Field>
            </div>
          )}

          {tab === 'howTo' && (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="الكلمة الصغيرة فوق (إنجليزي)">
                  <TextInput dir="ltr" value={content.howTo.eyebrow} onChange={(e) => set('howTo', { eyebrow: e.target.value })} />
                </Field>
                <Field label="العنوان">
                  <TextInput value={content.howTo.title} onChange={(e) => set('howTo', { title: e.target.value })} className="font-display text-xl" />
                </Field>
                <Field label="الوصف" className="sm:col-span-2">
                  <TextInput value={content.howTo.description} onChange={(e) => set('howTo', { description: e.target.value })} />
                </Field>
              </div>
              {content.howTo.steps.map((st, i) => (
                <div key={i} className="grid gap-3 rounded-2xl border border-sand-deep/40 bg-cream/40 p-4 sm:grid-cols-[12rem_1fr]">
                  <Field label={`الخطوة ${i + 1}`}>
                    <TextInput value={st.title} onChange={(e) => set('howTo', { steps: content.howTo.steps.map((s, j) => (j === i ? { ...s, title: e.target.value } : s)) })} />
                  </Field>
                  <Field label="الشرح">
                    <TextInput value={st.text} onChange={(e) => set('howTo', { steps: content.howTo.steps.map((s, j) => (j === i ? { ...s, text: e.target.value } : s)) })} />
                  </Field>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* شريط الحفظ */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-sand-deep/40 bg-parchment/95 backdrop-blur lg:right-[17rem]">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
          <Button onClick={save} loading={saving} disabled={!dirty} className="px-8">
            <Save className="size-4" /> حفظ المحتوى
          </Button>
          <span className="text-xs text-cocoa/55">{dirty ? 'في تعديلات ما انحفظت' : 'كل إشي محفوظ ✓'}</span>
          <a href="/" target="_blank" rel="noreferrer" className="ms-auto text-sm text-olive underline-offset-4 hover:underline">
            شوف الرئيسية
          </a>
        </div>
      </div>
    </div>
  )
}

/** اختيار صورة: من صور المنتجات، أو رفع صورة جديدة */
function ImageField({ label, value, onChange, products }: { label: string; value: string; onChange: (v: string) => void; products: Product[] }) {
  const toast = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const images = [...new Set(products.flatMap((p) => p.images))].slice(0, 16)

  const upload = async (file: File) => {
    setUploading(true)
    try {
      onChange(await adminUploadImage(await compressImage(file), file.name))
    } catch (e) {
      toast(errorText(e), 'error')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-cocoa-deep/80">{label}</p>
      <div className="flex flex-wrap items-start gap-3">
        <img src={value} alt="" className="h-36 w-28 rounded-t-full rounded-b-xl object-cover object-[center_62%] ring-2 ring-olive" />
        <div className="flex max-w-md flex-wrap gap-2">
          {images.map((url) => (
            <button key={url} type="button" onClick={() => onChange(url)} className={`size-14 overflow-hidden rounded-lg border-2 ${url === value ? 'border-olive' : 'border-transparent opacity-70 hover:opacity-100'}`}>
              <img src={url} alt="" className="size-full object-cover" />
            </button>
          ))}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="grid size-14 place-items-center rounded-lg border-2 border-dashed border-sand-deep text-cocoa/60 hover:border-olive hover:text-olive"
            aria-label="ارفع صورة"
          >
            {uploading ? <Loader2 className="size-5 animate-spin" /> : <ImagePlus className="size-5" />}
          </button>
        </div>
      </div>
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
    </div>
  )
}
