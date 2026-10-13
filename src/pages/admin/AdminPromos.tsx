import { Copy, Percent, Plus, Save, Shuffle, TicketPercent, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Button, Drawer, EmptyState, Field, PageHeader, Pill, TextInput, Toggle, errorText, useToast } from '../../components/admin/ui'
import { adminDeletePromo, adminListPromos, adminSavePromo } from '../../lib/api'
import { formatPrice } from '../../lib/format'
import type { PromoCode } from '../../types'

type Draft = Omit<PromoCode, 'id' | 'uses'> & { id?: string; uses?: number }
const blank = (): Draft => ({ code: '', kind: 'percent', value: 10, minTotal: 0, active: true, note: '' })

const randomCode = () => {
  const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return `LADY${Array.from({ length: 4 }, () => a[Math.floor(Math.random() * a.length)]).join('')}`
}

/** "2026-10-20T00:00:00Z" ← → "2026-10-20" لخانة التاريخ */
const toDateInput = (iso?: string) => (iso ? iso.slice(0, 10) : '')
const fromDateInput = (d: string, endOfDay = false) => (d ? new Date(`${d}T${endOfDay ? '23:59:59' : '00:00:00'}`).toISOString() : undefined)

function statusOf(p: PromoCode): { label: string; tone: 'olive' | 'cocoa' | 'sand' | 'caramel' } {
  const now = Date.now()
  if (!p.active) return { label: 'موقّف', tone: 'sand' }
  if (p.expiresAt && Date.parse(p.expiresAt) < now) return { label: 'منتهي', tone: 'cocoa' }
  if (p.startsAt && Date.parse(p.startsAt) > now) return { label: 'لسا ما بلّش', tone: 'caramel' }
  if (p.maxUses && p.uses >= p.maxUses) return { label: 'خلص', tone: 'cocoa' }
  return { label: 'شغّال', tone: 'olive' }
}

export function AdminPromos() {
  const toast = useToast()
  const [promos, setPromos] = useState<PromoCode[] | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    try {
      setPromos(await adminListPromos())
    } catch (e) {
      toast(errorText(e), 'error')
    }
  }, [toast])

  useEffect(() => {
    load()
  }, [load])

  const set = (patch: Partial<Draft>) => setDraft((d) => (d ? { ...d, ...patch } : d))

  const save = async () => {
    if (!draft) return
    if (!/^[A-Z0-9_-]{3,30}$/.test(draft.code)) return toast('الكود: ٣ حروف إنجليزي أو أرقام على الأقل، بدون فراغات', 'error')
    if (!(draft.value > 0)) return toast('اكتب قيمة الخصم', 'error')
    if (draft.kind === 'percent' && draft.value > 100) return toast('النسبة ما بتزيد عن ١٠٠٪', 'error')
    setSaving(true)
    try {
      await adminSavePromo(draft)
      toast(`انحفظ الكود ${draft.code}`)
      setDraft(null)
      load()
    } catch (e) {
      const msg = errorText(e)
      toast(msg.includes('duplicate') ? 'هالكود موجود — اختار غيره' : msg, 'error')
    } finally {
      setSaving(false)
    }
  }

  const toggle = async (p: PromoCode) => {
    setPromos((l) => l?.map((x) => (x.id === p.id ? { ...x, active: !p.active } : x)) ?? null)
    try {
      await adminSavePromo({ ...p, active: !p.active })
    } catch (e) {
      toast(errorText(e), 'error')
      load()
    }
  }

  const remove = async () => {
    if (!draft?.id || !confirm(`تحذف الكود ${draft.code}؟`)) return
    try {
      await adminDeletePromo(draft.id)
      toast('انحذف الكود')
      setDraft(null)
      load()
    } catch (e) {
      toast(errorText(e), 'error')
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        icon={TicketPercent}
        title="أكواد الخصم"
        description="الزبون بيكتب الكود بصفحة الطلب، والخصم بينحسب على السيرفر."
        actions={
          <Button onClick={() => setDraft({ ...blank(), code: randomCode() })}>
            <Plus className="size-4" /> كود جديد
          </Button>
        }
      />

      {!promos ? (
        <div className="grid gap-4 sm:grid-cols-2">{[0, 1].map((i) => <div key={i} className="h-44 animate-pulse rounded-3xl bg-sand/40" />)}</div>
      ) : promos.length === 0 ? (
        <EmptyState title="ما في أكواد لسا" text="اعمل كود خصم لمناسبة، لزبائن مميزين، أو لإنستغرام." action={<Button onClick={() => setDraft({ ...blank(), code: randomCode() })}><Plus className="size-4" /> أول كود</Button>} />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {promos.map((p) => {
            const st = statusOf(p)
            const usePct = p.maxUses ? Math.min(100, (p.uses / p.maxUses) * 100) : 0
            return (
              <li key={p.id}>
                {/* كرت متل تذكرة */}
                <div className={`relative flex overflow-hidden rounded-3xl border border-sand-deep/40 bg-parchment ${p.active ? '' : 'opacity-70'}`}>
                  <div className="flex w-28 shrink-0 flex-col items-center justify-center bg-gradient-to-b from-olive to-olive-deep px-3 py-5 text-parchment">
                    <span className="font-display text-4xl leading-none">{p.kind === 'percent' ? `${p.value}٪` : p.value}</span>
                    <span className="mt-1 text-xs opacity-80">{p.kind === 'percent' ? 'خصم' : '₪ خصم'}</span>
                  </div>
                  {/* ثقوب التذكرة */}
                  <span aria-hidden className="absolute top-1/2 right-[6.6rem] size-5 -translate-y-1/2 rounded-full bg-cream" />
                  <div className="min-w-0 flex-1 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => navigator.clipboard?.writeText(p.code).then(() => toast(`انسخ ${p.code}`))}
                        className="font-latin flex items-center gap-1.5 rounded-lg border border-dashed border-sand-deep px-2.5 py-1 text-lg font-semibold tracking-wider text-cocoa-deep hover:border-olive"
                        dir="ltr"
                        title="انسخ"
                      >
                        {p.code} <Copy className="size-3.5 opacity-50" />
                      </button>
                      <Pill tone={st.tone}>{st.label}</Pill>
                    </div>
                    <p className="mt-2 text-xs text-cocoa/60">
                      {p.minTotal > 0 ? `على طلبات من ${formatPrice(p.minTotal)}` : 'على أي طلب'}
                      {p.expiresAt && ` · لحد ${new Date(p.expiresAt).toLocaleDateString('ar')}`}
                    </p>
                    {p.note && <p className="mt-1 truncate text-xs text-cocoa/50">{p.note}</p>}
                    <div className="mt-3">
                      <div className="flex justify-between text-[0.7rem] text-cocoa/55">
                        <span>استعمل {p.uses} {p.maxUses ? `من ${p.maxUses}` : 'مرة'}</span>
                      </div>
                      {p.maxUses ? (
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-sand/60">
                          <div className="h-full rounded-full bg-caramel" style={{ width: `${usePct}%` }} />
                        </div>
                      ) : null}
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <Toggle checked={p.active} onChange={() => toggle(p)} label={p.active ? 'شغّال' : 'موقّف'} />
                      <Button variant="secondary" onClick={() => setDraft({ ...p })}>تعديل</Button>
                    </div>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <Drawer
        open={!!draft}
        onClose={() => setDraft(null)}
        title={draft?.id ? `تعديل ${draft.code}` : 'كود جديد'}
        footer={
          draft && (
            <div className="flex items-center gap-2">
              <Button onClick={save} loading={saving} className="px-6">
                <Save className="size-4" /> حفظ
              </Button>
              {draft.id && (
                <Button variant="ghost" className="ms-auto" onClick={remove}>
                  <Trash2 className="size-4" /> حذف
                </Button>
              )}
            </div>
          )
        }
      >
        {draft && (
          <div className="space-y-5">
            <Field label="الكود" hint="إنجليزي وأرقام — الزبون بيكتبه بالسلة">
              <div className="flex gap-2">
                <TextInput dir="ltr" value={draft.code} onChange={(e) => set({ code: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '') })} className="font-latin text-lg tracking-widest" />
                <Button variant="secondary" aria-label="كود عشوائي" onClick={() => set({ code: randomCode() })}>
                  <Shuffle className="size-4" />
                </Button>
              </div>
            </Field>

            <div>
              <p className="mb-2 text-sm font-medium text-cocoa-deep/80">نوع الخصم</p>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    ['percent', 'نسبة ٪', Percent],
                    ['fixed', 'مبلغ ثابت ₪', TicketPercent],
                  ] as const
                ).map(([k, label, Icon]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => set({ kind: k })}
                    className={`flex items-center justify-center gap-2 rounded-2xl border py-3 text-sm transition ${draft.kind === k ? 'border-olive bg-olive text-parchment' : 'border-sand-deep/50 hover:border-olive'}`}
                  >
                    <Icon className="size-4" /> {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label={draft.kind === 'percent' ? 'النسبة (٪)' : 'المبلغ (₪)'}>
                <TextInput type="number" min={1} max={draft.kind === 'percent' ? 100 : undefined} value={draft.value || ''} onChange={(e) => set({ value: Number(e.target.value) })} />
              </Field>
              <Field label="أقل مجموع للطلب (₪)" hint="٠ = أي طلب">
                <TextInput type="number" min={0} value={draft.minTotal || ''} onChange={(e) => set({ minTotal: Number(e.target.value) })} placeholder="0" />
              </Field>
              <Field label="من تاريخ" hint="اختياري">
                <TextInput type="date" value={toDateInput(draft.startsAt)} onChange={(e) => set({ startsAt: fromDateInput(e.target.value) })} />
              </Field>
              <Field label="لحد تاريخ" hint="اختياري">
                <TextInput type="date" value={toDateInput(draft.expiresAt)} onChange={(e) => set({ expiresAt: fromDateInput(e.target.value, true) })} />
              </Field>
              <Field label="أقصى عدد استعمالات" hint="فاضي = بلا حدود">
                <TextInput type="number" min={1} value={draft.maxUses ?? ''} onChange={(e) => set({ maxUses: e.target.value ? Number(e.target.value) : undefined })} />
              </Field>
              {draft.id && (
                <Field label="استُعمل">
                  <TextInput value={`${draft.uses ?? 0} مرة`} disabled />
                </Field>
              )}
            </div>

            <Field label="ملاحظة لإلك" hint="ما بيشوفها الزبون — مثلًا: لمتابعين إنستغرام">
              <TextInput value={draft.note} onChange={(e) => set({ note: e.target.value })} />
            </Field>

            <Toggle checked={draft.active} onChange={(v) => set({ active: v })} label="الكود شغّال" hint="طفيه لتوقفه مؤقتًا بدون ما تحذفه" />

            <div className="rounded-2xl bg-cream p-4 text-sm text-cocoa-deep/80">
              مثال: طلب بـ {formatPrice(300)} ← خصم{' '}
              <b>{formatPrice(draft.kind === 'percent' ? Math.round((300 * (draft.value || 0)) / 100) : Math.min(300, draft.value || 0))}</b>
              {draft.minTotal > 300 && <span className="text-cocoa"> (ما بينطبق لأنه أقل من {formatPrice(draft.minTotal)})</span>}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}
