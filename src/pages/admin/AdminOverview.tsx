import { ArrowLeft, CalendarClock, Coins, LayoutDashboard, Package, Plus, ShoppingBag, Sparkles, TicketPercent } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { EmptyState, PageHeader, Pill, StatCard, errorText, useToast } from '../../components/admin/ui'
import { adminListOrders, adminListProducts } from '../../lib/api'
import { formatPrice } from '../../lib/format'
import type { OrderRecord, Product } from '../../types'
import { statuses } from './AdminOrders'

const greet = () => {
  const h = new Date().getHours()
  return h < 12 ? 'صباح الخير' : h < 17 ? 'نهارك سعيد' : 'مسا الخير'
}

/** نظرة عامة: أرقام اليوم والشهر، آخر الطلبات، والأكثر طلبًا */
export function AdminOverview() {
  const toast = useToast()
  const [orders, setOrders] = useState<OrderRecord[] | null>(null)
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    Promise.all([adminListOrders(), adminListProducts()])
      .then(([o, p]) => {
        setOrders(o)
        setProducts(p)
      })
      .catch((e) => toast(errorText(e), 'error'))
  }, [toast])

  const stats = useMemo(() => {
    const list = orders ?? []
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const valid = list.filter((o) => o.status !== 'cancelled')
    const thisMonth = valid.filter((o) => new Date(o.createdAt) >= monthStart)
    const today = new Date().toISOString().slice(0, 10)
    const upcoming = valid
      .filter((o) => o.info.date && o.info.date >= today && o.status !== 'delivered')
      .sort((a, b) => a.info.date.localeCompare(b.info.date))
    // الأكثر طلبًا (بعدد القطع المطلوبة)
    const counts = new Map<string, { name: string; image: string; qty: number }>()
    for (const o of valid) for (const i of o.items) {
      const prev = counts.get(i.name) ?? { name: i.name, image: i.image, qty: 0 }
      counts.set(i.name, { ...prev, qty: prev.qty + i.qty })
    }
    return {
      newCount: list.filter((o) => o.status === 'new').length,
      monthCount: thisMonth.length,
      monthRevenue: thisMonth.reduce((n, o) => n + o.total, 0),
      upcoming: upcoming.slice(0, 5),
      top: [...counts.values()].sort((a, b) => b.qty - a.qty).slice(0, 4),
    }
  }, [orders])

  const statusOf = (id: OrderRecord['status']) => statuses.find((s) => s.id === id) ?? statuses[0]

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader icon={LayoutDashboard} title={greet()} description="هاي صورة سريعة عن محلك اليوم." />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard label="طلبات جديدة" value={orders ? stats.newCount : '…'} hint="بتستنى تأكيدك" icon={Sparkles} tone="caramel" />
        <StatCard label="طلبات هالشهر" value={orders ? stats.monthCount : '…'} hint="بدون الملغية" icon={ShoppingBag} tone="olive" />
        <StatCard label="مبيعات هالشهر" value={orders ? formatPrice(Math.round(stats.monthRevenue)) : '…'} hint="تقريبية" icon={Coins} tone="cocoa" />
        <StatCard label="منتجات ظاهرة" value={products.filter((p) => p.active !== false).length} hint={`من ${products.length}`} icon={Package} tone="sage" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* المواعيد الجاية */}
        <section className="rounded-3xl border border-sand-deep/40 bg-parchment p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display flex items-center gap-2 text-2xl text-olive">
              <CalendarClock className="size-5" /> المواعيد الجاية
            </h2>
            <Link to="/admin/orders" className="flex items-center gap-1 text-sm text-cocoa/60 hover:text-olive">
              كل الطلبات <ArrowLeft className="size-4" />
            </Link>
          </div>
          {!orders ? (
            <div className="h-40 animate-pulse rounded-2xl bg-sand/40" />
          ) : stats.upcoming.length === 0 ? (
            <EmptyState title="ما في مواعيد قريبة" text="الطلبات اللي إلها موعد تسليم بتطلع هون بالترتيب." />
          ) : (
            <ul className="space-y-2">
              {stats.upcoming.map((o) => {
                const d = new Date(o.info.date)
                const st = statusOf(o.status)
                return (
                  <li key={o.id}>
                    <Link to="/admin/orders" className="flex items-center gap-4 rounded-2xl px-2 py-2 transition hover:bg-cream/70">
                      <span className="grid w-14 shrink-0 place-items-center rounded-xl bg-olive/10 py-2 text-olive">
                        <span className="font-display text-2xl leading-none">{d.getDate()}</span>
                        <span className="text-[0.65rem]">{d.toLocaleDateString('ar', { month: 'short' })}</span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-cocoa-deep">{o.info.name} · {o.items.map((i) => i.name).join('، ')}</span>
                        <span className="text-xs text-cocoa/55">{o.info.method === 'delivery' ? `توصيل لـ ${o.info.city}` : 'استلام'} · {formatPrice(o.total)}</span>
                      </span>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs ${st.cls}`}>{st.label}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <div className="space-y-6">
          {/* الأكثر طلبًا */}
          <section className="rounded-3xl border border-sand-deep/40 bg-parchment p-5 sm:p-6">
            <h2 className="font-display mb-4 text-2xl text-olive">الأكثر طلبًا</h2>
            {stats.top.length === 0 ? (
              <p className="text-sm text-cocoa/55">لسا ما في طلبات كفاية.</p>
            ) : (
              <ul className="space-y-3">
                {stats.top.map((t, i) => (
                  <li key={t.name} className="flex items-center gap-3">
                    <span className="font-display w-5 text-xl text-sand-deep">{i + 1}</span>
                    {t.image && <img src={t.image} alt="" className="size-10 rounded-lg object-cover object-[center_62%]" />}
                    <span className="min-w-0 flex-1 truncate text-sm">{t.name}</span>
                    <Pill tone="olive">{t.qty} طلب</Pill>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* اختصارات */}
          <section className="grid grid-cols-2 gap-3">
            {[
              { to: '/admin/products/new', label: 'منتج جديد', icon: Plus },
              { to: '/admin/promos', label: 'كود خصم', icon: TicketPercent },
            ].map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="group flex flex-col items-start gap-3 rounded-2xl bg-gradient-to-br from-olive to-olive-deep p-4 text-parchment transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <span className="grid size-9 place-items-center rounded-xl bg-parchment/15">
                  <Icon className="size-5" />
                </span>
                <span className="flex w-full items-center justify-between text-sm">
                  {label}
                  <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
                </span>
              </Link>
            ))}
          </section>
        </div>
      </div>
    </div>
  )
}
