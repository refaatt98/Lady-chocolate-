import { ExternalLink, LayoutGrid, LogOut, Package, Settings, ShoppingBag, Tags } from 'lucide-react'
import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Link, NavLink, Navigate, Route, Routes } from 'react-router'
import { Button, Card, Field, TextInput, ToastProvider, errorText } from '../../components/admin/ui'
import { adminSignIn, adminSignOut, getAdminSession, isBackendConnected, onAuthChange } from '../../lib/api'
import { AdminCategories } from './AdminCategories'
import { AdminOrders } from './AdminOrders'
import { AdminProductEditor } from './AdminProductEditor'
import { AdminProducts } from './AdminProducts'
import { AdminSettings } from './AdminSettings'

type Session = { email: string; isAdmin: boolean } | null

/** لوحة التحكم: /admin — بتطلب دخول، وبتتأكد إنه المستخدم أدمن */
export function AdminApp() {
  const [session, setSession] = useState<Session | undefined>(undefined)

  const refresh = useCallback(() => {
    getAdminSession().then(setSession).catch(() => setSession(null))
  }, [])

  useEffect(() => {
    refresh()
    return onAuthChange(refresh)
  }, [refresh])

  useEffect(() => {
    document.title = 'لوحة التحكم | الليدي شوكولات'
  }, [])

  if (!isBackendConnected()) {
    return (
      <Centered>
        <Card title="Supabase مش مربوط">
          <p className="text-sm leading-relaxed text-cocoa-deep/75">
            لازم تحط <code dir="ltr">VITE_SUPABASE_URL</code> و <code dir="ltr">VITE_SUPABASE_PUBLISHABLE_KEY</code> بملف <code>.env</code> أو بمتغيرات Netlify.
          </p>
        </Card>
      </Centered>
    )
  }

  if (session === undefined) return <Centered><p className="text-cocoa/60">لحظة...</p></Centered>
  if (!session) return <Login />
  if (!session.isAdmin) return <NotAdmin email={session.email} />

  return (
    <ToastProvider>
      <Shell email={session.email}>
        <Routes>
          <Route index element={<Navigate to="/admin/orders" replace />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="products/new" element={<AdminProductEditor />} />
          <Route path="products/:id" element={<AdminProductEditor />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="*" element={<Navigate to="/admin/orders" replace />} />
        </Routes>
      </Shell>
    </ToastProvider>
  )
}

/* ------------------------------------------------------------------ */

const nav = [
  { to: '/admin/orders', label: 'الطلبات', icon: ShoppingBag },
  { to: '/admin/products', label: 'المنتجات', icon: Package },
  { to: '/admin/categories', label: 'الأقسام', icon: Tags },
  { to: '/admin/settings', label: 'الإعدادات', icon: Settings },
]

function Shell({ email, children }: { email: string; children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-cream/50 md:grid md:grid-cols-[15rem_1fr]">
      {/* القائمة — جانبية على الكمبيوتر، فوق على الموبايل */}
      <aside className="sticky top-0 z-30 border-b border-sand-deep/40 bg-parchment md:h-dvh md:border-b-0 md:border-l">
        <div className="flex items-center justify-between gap-3 px-4 py-3 md:block md:px-5 md:py-6">
          <Link to="/admin" className="flex items-center gap-2">
            <LayoutGrid className="size-5 text-olive" />
            <span className="font-display text-2xl text-olive">لوحة الليدي</span>
          </Link>
          <Link to="/" target="_blank" className="flex items-center gap-1 text-xs text-cocoa/60 hover:text-olive md:mt-2">
            <ExternalLink className="size-3.5" /> افتح الموقع
          </Link>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:px-3 md:pb-0">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm transition ${isActive ? 'bg-olive text-parchment' : 'text-cocoa-deep/75 hover:bg-sand/50'}`
              }
            >
              <Icon className="size-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden px-5 md:absolute md:inset-x-0 md:bottom-5 md:block">
          <p className="truncate text-xs text-cocoa/55" dir="ltr">
            {email}
          </p>
          <button type="button" onClick={adminSignOut} className="mt-2 flex items-center gap-1.5 text-sm text-cocoa/70 hover:text-cocoa">
            <LogOut className="size-4" /> تسجيل خروج
          </button>
        </div>
      </aside>
      <main className="min-w-0 px-4 py-6 sm:px-6 md:px-10 md:py-10">
        {children}
        <button type="button" onClick={adminSignOut} className="mt-12 flex items-center gap-1.5 text-sm text-cocoa/70 md:hidden">
          <LogOut className="size-4" /> تسجيل خروج ({email})
        </button>
      </main>
    </div>
  )
}

function Centered({ children }: { children: ReactNode }) {
  return <div className="grid min-h-dvh place-items-center bg-cream/50 px-4 py-10"><div className="w-full max-w-sm">{children}</div></div>
}

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await adminSignIn(email, password)
    } catch (err) {
      setError(errorText(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Centered>
      <div className="mb-8 text-center">
        <p className="font-display text-5xl text-olive">الليدي</p>
        <p dir="ltr" className="font-latin mt-1 text-xs tracking-[0.35em] text-cocoa/60 uppercase">
          Admin
        </p>
      </div>
      <Card>
        <form onSubmit={submit} className="space-y-4">
          <Field label="الإيميل">
            <TextInput type="email" dir="ltr" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="كلمة السر">
            <TextInput type="password" dir="ltr" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          {error && <p className="rounded-xl bg-cocoa/10 px-3 py-2 text-sm text-cocoa">{error}</p>}
          <Button type="submit" loading={loading} className="w-full py-3">
            دخول
          </Button>
        </form>
      </Card>
      <p className="mt-6 text-center text-xs text-cocoa/50">
        <Link to="/" className="hover:text-olive">← رجوع للموقع</Link>
      </p>
    </Centered>
  )
}

function NotAdmin({ email }: { email: string }) {
  return (
    <Centered>
      <Card title="مش أدمن">
        <p className="text-sm leading-relaxed text-cocoa-deep/75">
          دخلت بـ <span dir="ltr" className="font-medium">{email}</span>، بس هالحساب مش مضاف كأدمن. لازم ينضاف لجدول <code>admins</code> بـ Supabase.
        </p>
        <Button variant="secondary" className="mt-5 w-full" onClick={adminSignOut}>
          دخول بحساب ثاني
        </Button>
      </Card>
    </Centered>
  )
}
