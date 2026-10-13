import { Outlet } from 'react-router'
import { OrderProvider } from '../lib/order'
import { SiteProvider } from '../lib/site-context'
import { Footer } from './Footer'
import { Header } from './Header'
import { OrderDrawer } from './OrderDrawer'
import { Preloader } from './Preloader'
import { ScrollToTop } from './ScrollToTop'

export function Layout() {
  return (
    <SiteProvider>
      <OrderProvider>
      <ScrollToTop />
      <Preloader />
      <div aria-hidden className="grain pointer-events-none fixed inset-0 z-[60]" />
      <div className="flex min-h-dvh flex-col">
        <Header />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
      <OrderDrawer />
      </OrderProvider>
    </SiteProvider>
  )
}
