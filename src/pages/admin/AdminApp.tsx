import { ExternalLink, Flower2, LayoutDashboard, LogOut, Menu, Package, PenSquare, Settings, ShieldCheck, ShoppingBag, TicketPercent, Truck } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Link, NavLink, Navigate, Route, Routes, useLocation } from 'react-router'
import { BrandPattern } from '../../components/BrandPattern'
import { Button, Card, Field, TextInput, ToastProvider, errorText } from '../../components/admin/ui'
import { adminCountNewOrders, adminSignIn, adminSignOut, getAdminSession, isBackendConnected, onAuthChange, setupFirstAdmin } from '../../lib/api'
import { AdminAccounts } from './AdminAccounts'
import { AdminCategories } from './AdminCategories'
import { AdminContent } from './AdminContent'
import { AdminDelivery } from './AdminDelivery'
import { AdminOverview } from './AdminOverview'
import { AdminPromos } from './AdminPromos'
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
          <Route index element={<Navigate to="/admin/overview" replace />} />
          <Route path="overview" element={<AdminOverview />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="products/new" element={<AdminProductEditor />} />
          <Route path="products/:id" element={<AdminProductEditor />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="delivery" element={<AdminDelivery />} />
          <Route path="promos" element={<AdminPromos />} />
          <Route path="content" element={<AdminContent />} />
          <Route path="admins" element={<AdminAccounts />} />
          <Route path="*" element={<Navigate to="/admin/overview" replace />} />
        </Routes>
      </Shell>
    </ToastProvider>
  )
}

/* ------------------------------------------------------------------ */

const navGroups = [
  {
    title: 'اليومي',
    items: [
      { to: '/admin/overview', label: 'نظرة عامة', icon: LayoutDashboard },
      { to: '/admin/orders', label: 'الطلبات', icon: ShoppingBag },
    ],
  },
  {
    title: 'المتجر',
    items: [
      { to: '/admin/products', label: 'المنتجات', icon: Package },
      { to: '/admin/categories', label: 'الأقسام', icon: Flower2 },
      { to: '/admin/delivery', label: 'التوصيل', icon: Truck },
      { to: '/admin/promos', label: 'أكواد الخصم', icon: TicketPercent },
    ],
  },
  {
    title: 'الموقع',
    items: [
      { to: '/admin/content', label: 'محتوى الموقع', icon: PenSquare },
      { to: '/admin/settings', label: 'الإعدادات', icon: Settings },
      { to: '/admin/admins', label: 'المشرفين', icon: ShieldCheck },
    ],
  },
]

/** عدد الطلبات الجديدة — بيتحدّث كل ٣٠ ثانية، وبيطلع بعنوان التبويب كمان */
function useNewOrdersCount() {
  const [count, setCount] = useState(0)
  useEffect(() => {
    let alive = true
    const tick = () => adminCountNewOrders().then((n) => alive && setCount(n)).catch(() => {})
    tick()
    const timer = setInterval(tick, 30000)
    return () => {
      alive = false
      clearInterval(timer)
    }
  }, [])
  useEffect(() => {
    document.title = `${count ? `(${count}) ` : ''}لوحة التحكم | الليدي شوكولات`
  }, [count])
  return count
}

function Shell({ email, children }: { email: string; children: ReactNode }) {
  const newOrders = useNewOrdersCount()
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  useEffect(() => setMenuOpen(false), [location.pathname])

  const current = navGroups.flatMap((g) => g.items).find((i) => location.pathname.startsWith(i.to))

  const sidebar = (
    <div className="flex h-full flex-col">
      {/* الهوية */}
      <Link to="/admin/overview" className="group relative mx-3 mt-4 flex items-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-br from-olive to-olive-deep px-4 py-4 text-parchment">
        <BrandPattern className="text-parchment/[0.07]" />
        <svg viewBox="-2 -2 44 100" aria-hidden className="relative h-10 w-5 shrink-0 transition-transform duration-500 group-hover:rotate-12">
          <path d="M20,0 C30,22 40,55 34,80 C30,96 10,96 6,80 C0,55 10,22 20,0 Z" fill="var(--color-caramel)" />
          <path d="M20,5 L20,93" stroke="#000" strokeOpacity="0.2" />
        </svg>
        <span className="relative">
          <span className="font-display block text-2xl leading-none">الليدي</span>
          <span dir="ltr" className="font-latin mt-1 block text-[0.6rem] tracking-[0.3em] text-parchment/70 uppercase">
            Admin Studio
          </span>
        </span>
      </Link>

      <nav className="mt-4 flex-1 space-y-4 overflow-y-auto px-3 pb-3">
        {navGroups.map((group) => (
          <div key={group.title}>
            <p className="mb-1.5 px-3 text-[0.65rem] font-semibold tracking-widest text-cocoa/40">{group.title}</p>
            <div className="space-y-0.5">
              {group.items.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
                      isActive ? 'bg-parchment font-medium text-olive shadow-[0_6px_16px_-10px_rgb(92_59_47/0.5)] ring-1 ring-sand-deep/40' : 'text-cocoa-deep/70 hover:bg-parchment/60 hover:text-cocoa-deep'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && <motion.span layoutId="nav-mark" className="absolute inset-y-2 right-0 w-1 rounded-full bg-olive" />}
                      <span className={`grid size-8 place-items-center rounded-lg transition ${isActive ? 'bg-olive text-parchment' : 'bg-sand/50 text-cocoa/70 group-hover:bg-sand'}`}>
                        <Icon className="size-4" />
                      </span>
                      {label}
                      {to === '/admin/orders' && newOrders > 0 && (
                        <span className="ms-auto grid min-w-6 place-items-center rounded-full bg-caramel px-1.5 py-0.5 text-xs font-semibold text-cocoa-deep">{newOrders}</span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* المستخدم */}
      <div className="m-3 rounded-2xl border border-sand-deep/40 bg-parchment/70 p-3">
        <div className="flex items-center gap-3">
          <span className="font-latin grid size-9 shrink-0 place-items-center rounded-full bg-cocoa text-sm text-parchment uppercase">{email.slice(0, 1)}</span>
          <span className="min-w-0 flex-1">
            <span dir="ltr" className="block truncate text-right text-xs text-cocoa-deep">{email}</span>
            <span className="text-[0.65rem] text-cocoa/50">مشرف</span>
          </span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Link to="/" target="_blank" className="flex items-center justify-center gap-1.5 rounded-lg bg-sand/50 py-2 text-xs text-cocoa-deep/80 hover:bg-sand">
            <ExternalLink className="size-3.5" /> الموقع
          </Link>
          <button type="button" onClick={adminSignOut} className="flex items-center justify-center gap-1.5 rounded-lg bg-sand/50 py-2 text-xs text-cocoa-deep/80 hover:bg-cocoa hover:text-parchment">
            <LogOut className="size-3.5" /> خروج
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-dvh bg-[radial-gradient(circle_at_80%_0%,rgb(206_196_176/0.35),transparent_40%),radial-gradient(circle_at_10%_90%,rgb(135_143_105/0.12),transparent_40%)] bg-cream/40 lg:grid lg:grid-cols-[17rem_1fr]">
      {/* كمبيوتر */}
      <aside className="sticky top-0 hidden h-dvh border-l border-sand-deep/30 bg-sand/25 backdrop-blur lg:block">{sidebar}</aside>

      {/* موبايل: شريط فوق + قائمة بتنفتح */}
      <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-sand-deep/30 bg-parchment/90 px-4 py-3 backdrop-blur lg:hidden">
        <button type="button" onClick={() => setMenuOpen(true)} aria-label="القائمة" className="relative grid size-10 place-items-center rounded-xl bg-sand/50">
          <Menu className="size-5 text-olive" />
          {newOrders > 0 && <span className="absolute -top-1 -left-1 grid size-5 place-items-center rounded-full bg-caramel text-[0.65rem] font-semibold">{newOrders}</span>}
        </button>
        <span className="font-display text-2xl text-olive">{current?.label ?? 'لوحة الليدي'}</span>
        <Link to="/" target="_blank" aria-label="افتح الموقع" className="grid size-10 place-items-center rounded-xl bg-sand/50">
          <ExternalLink className="size-4 text-olive" />
        </Link>
      </header>
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div className="fixed inset-0 z-50 bg-cocoa-deep/30 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMenuOpen(false)} />
            <motion.aside
              className="fixed inset-y-0 right-0 z-50 w-72 bg-cream shadow-2xl lg:hidden"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            >
              {sidebar}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
        <motion.div key={location.pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
          {children}
        </motion.div>
      </main>
    </div>
  )
}

function Centered({ children }: { children: ReactNode }) {
  return <div className="grid min-h-dvh place-items-center bg-cream/50 px-4 py-10"><div className="w-full max-w-sm">{children}</div></div>
}

function Login() {
  const [mode, setMode] = useState<'login' | 'setup'>('login')
  const [code, setCode] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (mode === 'setup' && password !== confirm) return setError('كلمتين السر مش متطابقات')
    setLoading(true)
    try {
      if (mode === 'setup') await setupFirstAdmin(code, email, password)
      else await adminSignIn(email, password)
    } catch (err) {
      setError(errorText(err))
    } finally {
      setLoading(false)
    }
  }

  const switchMode = (m: 'login' | 'setup') => {
    setMode(m)
    setError('')
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
        {mode === 'setup' && (
          <div className="mb-5">
            <h2 className="font-display text-2xl text-olive">تفعيل حسابك</h2>
            <p className="mt-1 text-xs leading-relaxed text-cocoa/60">اكتب كود التفعيل، واختار الإيميل وكلمة السر اللي بدك تدخل فيهم. الكود بيشتغل مرة وحدة.</p>
          </div>
        )}
        <form onSubmit={submit} className="space-y-4">
          {mode === 'setup' && (
            <Field label="كود التفعيل">
              <TextInput dir="ltr" required value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="XXXXX-XXXXX" className="font-latin tracking-widest" />
            </Field>
          )}
          <Field label="الإيميل">
            <TextInput type="email" dir="ltr" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label={mode === 'setup' ? 'كلمة السر الجديدة' : 'كلمة السر'} hint={mode === 'setup' ? '٨ حروف أو أكثر' : undefined}>
            <TextInput
              type="password"
              dir="ltr"
              autoComplete={mode === 'setup' ? 'new-password' : 'current-password'}
              required
              minLength={mode === 'setup' ? 8 : undefined}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          {mode === 'setup' && (
            <Field label="أكّد كلمة السر">
              <TextInput type="password" dir="ltr" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </Field>
          )}
          {error && <p className="rounded-xl bg-cocoa/10 px-3 py-2 text-sm text-cocoa">{error}</p>}
          <Button type="submit" loading={loading} className="w-full py-3">
            {mode === 'setup' ? 'فعّل وادخل' : 'دخول'}
          </Button>
        </form>
      </Card>
      <p className="mt-5 text-center text-sm">
        {mode === 'login' ? (
          <button type="button" onClick={() => switchMode('setup')} className="text-olive underline-offset-4 hover:underline">
            أول مرة؟ فعّل حسابك بالكود
          </button>
        ) : (
          <button type="button" onClick={() => switchMode('login')} className="text-olive underline-offset-4 hover:underline">
            عندي حساب — رجوع للدخول
          </button>
        )}
      </p>
      <p className="mt-4 text-center text-xs text-cocoa/50">
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
          دخلت بـ <span dir="ltr" className="font-medium">{email}</span>، بس هالحساب مش مشرف. اطلب من مشرف يضيفك من صفحة "المشرفين".
        </p>
        <Button variant="secondary" className="mt-5 w-full" onClick={adminSignOut}>
          دخول بحساب ثاني
        </Button>
      </Card>
    </Centered>
  )
}
