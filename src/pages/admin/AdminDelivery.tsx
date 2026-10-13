import { MapPin, Plus, Save, Trash2, Truck } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Button, Card, EmptyState, Field, PageHeader, Pill, TextArea, TextInput, Toggle, errorText, useToast } from '../../components/admin/ui'
import { adminDeleteZone, adminListZones, adminSaveDeliverySettings, adminSaveZone, getSiteInfo } from '../../lib/api'
import { formatPrice } from '../../lib/format'
import type { DeliveryZone } from '../../types'

type Row = DeliveryZone & { dirty?: boolean; isNew?: boolean }

/** التوصيل: كل مدينة بسعرها + ملاحظة التوصيل وأيام التحضير */
export function AdminDelivery() {
  const toast = useToast()
  const [zones, setZones] = useState<Row[] | null>(null)
  const [note, setNote] = useState('')
  const [lead, setLead] = useState(2)
  const [savingAll, setSavingAll] = useState(false)
  const [savingSettings, setSavingSettings] = useState(false)

  const load = useCallback(async () => {
    try {
      const [z, site] = await Promise.all([adminListZones(), getSiteInfo()])
      setZones(z)
      setNote(site.deliveryNote)
      setLead(site.minLeadDays)
    } catch (e) {
      toast(errorText(e), 'error')
    }
  }, [toast])

  useEffect(() => {
    load()
  }, [load])

  if (!zones) return <div className="mx-auto h-96 max-w-4xl animate-pulse rounded-3xl bg-sand/40" />

  const edit = (i: number, patch: Partial<Row>) => setZones((l) => l?.map((z, j) => (j === i ? { ...z, ...patch, dirty: true } : z)) ?? null)
  const dirty = zones.filter((z) => z.dirty)

  const saveAll = async () => {
    if (dirty.some((z) => !z.name.trim())) return toast('في مدينة بدون اسم', 'error')
    setSavingAll(true)
    try {
      for (const z of dirty) await adminSaveZone({ ...(z.isNew ? {} : { id: z.id }), name: z.name, price: z.price, active: z.active, sort: zones.indexOf(z) + 1 })
      toast(`انحفظت ${dirty.length} ${dirty.length === 1 ? 'منطقة' : 'مناطق'}`)
      load()
    } catch (e) {
      toast(errorText(e), 'error')
    } finally {
      setSavingAll(false)
    }
  }

  const remove = async (i: number) => {
    const z = zones[i]
    if (z.isNew) return setZones(zones.filter((_, j) => j !== i))
    if (!confirm(`تحذف "${z.name}" من مناطق التوصيل؟`)) return
    try {
      await adminDeleteZone(z.id)
      setZones(zones.filter((_, j) => j !== i))
      toast('انحذفت المنطقة')
    } catch (e) {
      toast(errorText(e), 'error')
    }
  }

  const saveSettings = async () => {
    setSavingSettings(true)
    try {
      await adminSaveDeliverySettings(note, lead)
      toast('انحفظت إعدادات التوصيل')
    } catch (e) {
      toast(errorText(e), 'error')
    } finally {
      setSavingSettings(false)
    }
  }

  const priced = zones.filter((z) => z.price !== null && z.active)

  return (
    <div className="mx-auto max-w-4xl pb-24">
      <PageHeader
        icon={Truck}
        title="التوصيل"
        description="كل مدينة بسعرها — السعر بينضاف للمجموع لحاله لما الزبون يختارها."
        actions={
          <Button onClick={() => setZones([...zones, { id: `new-${Date.now()}`, name: '', price: null, active: true, sort: zones.length + 1, dirty: true, isNew: true }])}>
            <Plus className="size-4" /> مدينة جديدة
          </Button>
        }
      />

      <div className="mb-5 flex flex-wrap gap-2">
        <Pill tone="olive">{zones.filter((z) => z.active).length} منطقة فعّالة</Pill>
        {priced.length > 0 && (
          <Pill tone="caramel">
            الأسعار من {formatPrice(Math.min(...priced.map((z) => z.price!)))} لـ {formatPrice(Math.max(...priced.map((z) => z.price!)))}
          </Pill>
        )}
        {zones.some((z) => z.price === null) && <Pill>{zones.filter((z) => z.price === null).length} بدون سعر (بنتفق عليه)</Pill>}
      </div>

      {zones.length === 0 ? (
        <EmptyState title="ما في مناطق توصيل" text="ضيف المدن اللي بتوصلها، وكل وحدة بسعرها." />
      ) : (
        <ul className="space-y-2">
          {zones.map((z, i) => (
            <li
              key={z.id}
              className={`grid grid-cols-[auto_1fr] items-center gap-3 rounded-2xl border bg-parchment p-3 transition sm:grid-cols-[auto_1fr_10rem_auto_auto] ${
                z.dirty ? 'border-caramel' : 'border-sand-deep/40'
              } ${z.active ? '' : 'opacity-60'}`}
            >
              <span className="grid size-10 place-items-center rounded-xl bg-olive/10 text-olive">
                <MapPin className="size-5" />
              </span>
              <TextInput value={z.name} onChange={(e) => edit(i, { name: e.target.value })} placeholder="اسم المدينة" autoFocus={z.isNew} />
              <div className="col-span-2 flex items-center gap-2 sm:col-span-1">
                <div className="relative flex-1">
                  <TextInput
                    type="number"
                    min={0}
                    step="1"
                    inputMode="decimal"
                    value={z.price ?? ''}
                    onChange={(e) => edit(i, { price: e.target.value === '' ? null : Math.max(0, Number(e.target.value)) })}
                    placeholder="بنتفق"
                    className="pe-8"
                  />
                  <span className="pointer-events-none absolute inset-y-0 left-3 grid place-items-center text-sm text-cocoa/50">₪</span>
                </div>
              </div>
              <div className="col-span-2 flex items-center justify-between gap-2 sm:col-span-2 sm:justify-end">
                <Toggle checked={z.active} onChange={(v) => edit(i, { active: v })} label={z.active ? 'فعّالة' : 'مخفية'} />
                <Button variant="ghost" aria-label={`احذف ${z.name}`} className="size-9 !p-0" onClick={() => remove(i)}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-xs text-cocoa/50">خلّي السعر فاضي إذا بدك تتفق عليه مع الزبون · ٠ = توصيل مجاني · المخفية ما بتطلع للزبون</p>

      <Card title="إعدادات عامة" className="mt-8">
        <div className="grid gap-4 sm:grid-cols-[1fr_12rem]">
          <Field label="ملاحظة التوصيل" hint="بتطلع تحت العنوان بصفحة الطلب">
            <TextArea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
          <Field label="أقل عدد أيام للتحضير" hint="الزبون ما بيقدر يختار موعد أقرب">
            <TextInput type="number" min={0} max={60} value={lead} onChange={(e) => setLead(Math.max(0, Number(e.target.value)))} />
          </Field>
        </div>
        <Button variant="secondary" onClick={saveSettings} loading={savingSettings} className="mt-4">
          حفظ الإعدادات
        </Button>
      </Card>

      {/* شريط الحفظ — بيطلع بس لما في تعديلات */}
      {dirty.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-sand-deep/40 bg-parchment/95 backdrop-blur lg:right-[17rem]">
          <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3 sm:px-6">
            <Button onClick={saveAll} loading={savingAll} className="px-8">
              <Save className="size-4" /> حفظ ({dirty.length})
            </Button>
            <button type="button" onClick={load} className="text-sm text-cocoa/60 hover:text-cocoa">
              تراجع
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
