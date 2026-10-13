import { ShieldCheck, Trash2, UserPlus } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Button, Card, Field, PageHeader, TextInput, errorText, useToast } from '../../components/admin/ui'
import { adminAddAdmin, adminListAdmins, adminRemoveAdmin, type AdminAccount } from '../../lib/api'

const dateFmt = new Intl.DateTimeFormat('ar', { dateStyle: 'medium' })

/** المشرفين: أكثر من أدمن، كل واحد بإيميله وكلمة سره */
export function AdminAccounts() {
  const toast = useToast()
  const [admins, setAdmins] = useState<AdminAccount[] | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [adding, setAdding] = useState(false)

  const load = useCallback(async () => {
    try {
      setAdmins(await adminListAdmins())
    } catch (e) {
      toast(errorText(e), 'error')
    }
  }, [toast])

  useEffect(() => {
    load()
  }, [load])

  const add = async () => {
    setAdding(true)
    try {
      await adminAddAdmin(email, password)
      toast(`${email} صار أدمن — ابعتله الإيميل وكلمة السر`)
      setEmail('')
      setPassword('')
      load()
    } catch (e) {
      toast(errorText(e), 'error')
    } finally {
      setAdding(false)
    }
  }

  const remove = async (a: AdminAccount) => {
    if (!confirm(`تشيل ${a.email} من الأدمن؟ ما رح يقدر يدخل على لوحة التحكم.`)) return
    try {
      await adminRemoveAdmin(a.userId)
      toast('انشال من الأدمن')
      load()
    } catch (e) {
      toast(errorText(e), 'error')
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader icon={ShieldCheck} title="المشرفين" description="كل واحد بيدخل بإيميله وكلمة سره، وكلهم بيقدروا يعدّلوا كل إشي." />

      <div className="space-y-6">
        <Card title="المشرفين الحاليين">
          {!admins ? (
            <div className="h-20 animate-pulse rounded-xl bg-sand/40" />
          ) : (
            <ul className="divide-y divide-sand/70">
              {admins.map((a) => (
                <li key={a.userId} className="flex items-center gap-3 py-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-sage text-olive">
                    <ShieldCheck className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span dir="ltr" className="block truncate text-right text-cocoa-deep">{a.email}</span>
                    <span className="text-xs text-cocoa/55">
                      من {dateFmt.format(new Date(a.createdAt))}
                      {a.lastSignInAt ? ` · آخر دخول ${dateFmt.format(new Date(a.lastSignInAt))}` : ' · لسا ما دخل'}
                    </span>
                  </span>
                  {a.isMe ? (
                    <span className="rounded-full bg-olive/10 px-3 py-1 text-xs text-olive">إنت</span>
                  ) : (
                    <Button variant="ghost" aria-label={`شيل ${a.email}`} className="size-9 !p-0" onClick={() => remove(a)}>
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="ضيف مشرف" description="بتعمله حساب هون، وبتبعتله الإيميل وكلمة السر. إذا الإيميل موجود، كلمة سره بتتغيّر للجديدة.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="الإيميل">
              <TextInput type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@gmail.com" />
            </Field>
            <Field label="كلمة السر" hint="٨ حروف أو أكثر — بيقدر يغيّرها بعدين من الإعدادات">
              <TextInput type="text" dir="ltr" autoComplete="off" value={password} onChange={(e) => setPassword(e.target.value)} />
            </Field>
          </div>
          <Button onClick={add} loading={adding} disabled={!email.includes('@') || password.length < 8} className="mt-4">
            <UserPlus className="size-4" /> ضيف كمشرف
          </Button>
        </Card>
      </div>
    </div>
  )
}
