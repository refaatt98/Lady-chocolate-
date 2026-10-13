import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router'
import { Layout } from './components/Layout'

// كل صفحة بتتحمّل لحالها لما نحتاجها — أول تحميل أخف
const HomePage = lazy(() => import('./pages/HomePage').then((m) => ({ default: m.HomePage })))
const ShopPage = lazy(() => import('./pages/ShopPage').then((m) => ({ default: m.ShopPage })))
const ProductPage = lazy(() => import('./pages/ProductPage').then((m) => ({ default: m.ProductPage })))
const CartPage = lazy(() => import('./pages/CartPage').then((m) => ({ default: m.CartPage })))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })))

const AdminApp = lazy(() => import('./pages/admin/AdminApp').then((m) => ({ default: m.AdminApp })))

const PageFallback = () => <div className="min-h-[60vh]" />

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* لوحة التحكم — بدون هيدر وفوتر الموقع */}
        <Route path="admin/*" element={<Suspense fallback={<PageFallback />}><AdminApp /></Suspense>} />
        <Route element={<Layout />}>
          <Route index element={<Suspense fallback={<PageFallback />}><HomePage /></Suspense>} />
          <Route path="shop" element={<Suspense fallback={<PageFallback />}><ShopPage /></Suspense>} />
          <Route path="product/:slug" element={<Suspense fallback={<PageFallback />}><ProductPage /></Suspense>} />
          <Route path="cart" element={<Suspense fallback={<PageFallback />}><CartPage /></Suspense>} />
          <Route path="*" element={<Suspense fallback={<PageFallback />}><NotFoundPage /></Suspense>} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
