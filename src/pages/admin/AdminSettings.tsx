import { useEffect, useState } from 'react'
import { Button, Card, Field, TagInput, TextArea, TextInput, errorText, useToast } from '../../components/admin/ui'
import { adminChangePassword, adminSaveSettings, getSiteInfo } from '../../lib/api'
import type { SiteInfo } from '../../types'

export function AdminSettings() {
  const toast = useToast()
  const [s, setS] = useState<SiteInfo | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getSiteInfo().then(setS).catch((e) => toast(errorText(e), 'error'))
  }, [toast])

  if (!s) return <div className="mx-auto h-96 max-w-3xl animate-pulse rounded-2xl bg-sand/40" />

  const set = (patch: Partial<SiteInfo>) => setS({ ...s, ...patch })
  const whatsappDigits = s.whatsapp.replace(/\D/g, '')
  const whatsappOk = /^\d{11,15}$/.test(whatsappDigits) && !whatsappDigits.startsWith('0')

  const save = async () => {
    if (!whatsappOk) return toast('رقم الواتساب لازم يكون دولي بدون + أو صفر، مثلًا 970599123456', 'error')
    setSaving(true)
    try {
      await adminSaveSettings(s)
      toast('انحفظت الإعدادات — بتبيّن بالموقع فورًا')
    } catch (e) {
      toast(errorText(e), 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl pb-10">
      <h1 className="font-display mb-6 text-4xl text-olive">الإعدادات</h1>
      <div className="space-y-6">
        <Card title="التواصل" description="الطلبات كلها بتوصل على رقم الواتساب هاد.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="رقم الواتساب (دولي)"
              hint="بدون + وبدون صفر بالأول — فلسطين 970، الداخل 972. مثلًا: 970599123456"
              error={s.whatsapp && !whatsappOk ? 'الصيغة مش صحيحة' : undefined}
            >
              <TextInput dir="ltr" inputMode="numeric" value={s.whatsapp} onChange={(e) => set({ whatsapp: e.target.value.replace(/[^\d]/g, '') })} />
            </Field>
            <Field label="الرقم مثل ما بينعرض" hint="بيطلع بالفوتر">
              <TextInput dir="ltr" value={s.phoneDisplay} onChange={(e) => set({ phoneDisplay: e.target.value })} placeholder="0599 123 456" />
            </Field>
            <Field label="رابط إنستغرام">
              <TextInput dir="ltr" value={s.instagram} onChange={(e) => set({ instagram: e.target.value })} placeholder="https://instagram.com/..." />
            </Field>
            <Field label="العنوان">
              <TextInput value={s.address} onChange={(e) => set({ address: e.target.value })} placeholder="رام الله — الماصيون" />
            </Field>
            <Field label="الدوام" className="sm:col-span-2">
              <TextInput value={s.hours} onChange={(e) => set({ hours: e.target.value })} />
            </Field>
          </div>
        </Card>

        <Card title="التوصيل والطلبات">
          <div className="grid gap-4">
            <Field label="مدن التوصيل المقترحة" hint="بتطلع كاقتراحات بخانة المدينة — الزبون بيقدر يكتب غيرها">
              <TagInput value={s.deliveryCities} onChange={(deliveryCities) => set({ deliveryCities })} placeholder="رام الله" />
            </Field>
            <Field label="ملاحظة التوصيل" hint="بتطلع تحت العنوان بصفحة الطلب">
              <TextArea rows={2} value={s.deliveryNote} onChange={(e) => set({ deliveryNote: e.target.value })} />
            </Field>
            <Field label="أقل عدد أيام للتحضير" hint="الزبون ما بيقدر يختار موعد أقرب من هيك">
              <TextInput type="number" min={0} max={60} value={s.minLeadDays} onChange={(e) => set({ minLeadDays: Math.max(0, Number(e.target.value)) })} className="max-w-32" />
            </Field>
          </div>
        </Card>

        <Card title="الهوية">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="اسم المحل">
              <TextInput value={s.name} onChange={(e) => set({ name: e.target.value })} />
            </Field>
            <Field label="الاسم بالإنجليزي">
              <TextInput dir="ltr" value={s.latinName} onChange={(e) => set({ latinName: e.target.value })} />
            </Field>
            <Field label="الجملة التعريفية" className="sm:col-span-2">
              <TextInput value={s.tagline} onChange={(e) => set({ tagline: e.target.value })} />
            </Field>
          </div>
        </Card>

        <Button onClick={save} loading={saving} className="px-10 py-3">
          حفظ الإعدادات
        </Button>

        <PasswordCard />
      </div>
    </div>
  )
}

/** حسابي: تغيير كلمة السر من لوحة التحكم */
function PasswordCard() {
  const toast = useToast()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)
  const mismatch = confirm.length > 0 && confirm !== password

  const save = async () => {
    if (password !== confirm) return toast('كلمتين السر مش متطابقات', 'error')
    setSaving(true)
    try {
      await adminChangePassword(password)
      setPassword('')
      setConfirm('')
      toast('تغيّرت كلمة السر')
    } catch (e) {
      toast(errorText(e), 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card title="حسابي" description="غيّر كلمة سر الدخول للوحة التحكم.">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="كلمة السر الجديدة" hint="٨ حروف أو أكثر">
          <TextInput type="password" dir="ltr" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <Field label="أكّد كلمة السر" error={mismatch ? 'مش متطابقة' : undefined}>
          <TextInput type="password" dir="ltr" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </Field>
      </div>
      <Button variant="secondary" onClick={save} loading={saving} disabled={password.length < 8 || mismatch} className="mt-4">
        غيّر كلمة السر
      </Button>
    </Card>
  )
}
