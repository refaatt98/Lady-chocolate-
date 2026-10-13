import { ArrowLeft, Minus, Plus, Trash2, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect } from 'react'
import { Link } from 'react-router'
import { formatPrice } from '../lib/format'
import { useOrder } from '../lib/order'
import { ChocolatePetal } from './ChocolatePetal'

/** درج "طلبيتي" — بيطلع من الطرف، وفيه كل اللي اخترته وزر واحد للواتساب */
export function OrderDrawer() {
  const { items, total, open, setOpen, setQty, remove, clear } = useOrder()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, setOpen])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[70] bg-cocoa-deep/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="طلبيتي"
            className="fixed inset-y-0 left-0 z-[71] flex w-full max-w-md flex-col bg-parchment shadow-2xl"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 260, damping: 30 }}
          >
            <header className="flex items-center justify-between border-b border-sand px-5 py-4">
              <div>
                <h2 className="font-display text-3xl text-olive">طلبيتي</h2>
                <p className="text-xs text-cocoa/60">بتنبعث كلها برسالة واتساب وحدة</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="إغلاق"
                className="grid size-10 place-items-center rounded-full border border-sand-deep/60 text-olive transition hover:bg-olive hover:text-cream"
              >
                <X className="size-5" />
              </button>
            </header>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
                <div className="relative size-28">
                  {Array.from({ length: 8 }, (_, i) => (
                    <div key={i} className="absolute top-1/2 left-1/2 w-6 origin-bottom" style={{ transform: `translate(-50%, -100%) rotate(${i * 45}deg)` }}>
                      <ChocolatePetal tone={i % 2 ? 'milk' : 'dark'} className="w-full opacity-30" />
                    </div>
                  ))}
                </div>
                <p className="font-display text-2xl text-olive">الصينية لسا فاضية</p>
                <p className="text-sm leading-relaxed text-cocoa/70">اختار من التشكيلة وضيف للطلبية، وبالآخر منبعتها مع بعض.</p>
                <Link to="/shop" onClick={() => setOpen(false)} className="mt-2 rounded-full bg-olive px-6 py-3 text-cream">
                  تصفّح التشكيلة
                </Link>
              </div>
            ) : (
              <>
                <ul className="flex-1 divide-y divide-sand overflow-y-auto px-5">
                  <AnimatePresence initial={false}>
                    {items.map((item) => (
                      <motion.li
                        key={item.key}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, height: 0, paddingTop: 0, paddingBottom: 0 }}
                        className="flex gap-4 overflow-hidden py-4"
                      >
                        <img src={item.image} alt="" className="size-20 shrink-0 rounded-t-full rounded-b-lg object-cover object-[center_62%]" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <Link to={`/product/${item.slug}`} onClick={() => setOpen(false)} className="font-display text-xl text-olive hover:text-cocoa">
                              {item.name}
                            </Link>
                            <button type="button" onClick={() => remove(item.key)} aria-label={`احذف ${item.name}`} className="p-1 text-cocoa/50 transition hover:text-cocoa">
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                          <p className="text-xs text-cocoa/70">
                            {item.sizeLabel} · {item.pieces} قطعة
                          </p>
                          {item.details
                            .filter(([, v]) => v.trim())
                            .map(([k, v]) => (
                              <p key={k} className="truncate text-xs text-cocoa/60">
                                {k}: <span className="text-cocoa-deep">{v}</span>
                              </p>
                            ))}
                          {item.note && <p className="line-clamp-2 text-xs text-cocoa/60">📝 {item.note}</p>}
                          <div className="mt-2 flex items-center justify-between">
                            <div className="flex items-center rounded-full border border-sand-deep/60">
                              <button type="button" onClick={() => setQty(item.key, item.qty + 1)} aria-label="زيادة" className="grid size-8 place-items-center text-olive">
                                <Plus className="size-3.5" />
                              </button>
                              <span className="w-6 text-center text-sm tabular-nums">{item.qty}</span>
                              <button type="button" onClick={() => setQty(item.key, item.qty - 1)} aria-label="إنقاص" className="grid size-8 place-items-center text-olive">
                                <Minus className="size-3.5" />
                              </button>
                            </div>
                            <span className="text-sm font-semibold text-cocoa">{formatPrice(item.unitPrice * item.qty)}</span>
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>

                <footer className="space-y-3 border-t border-sand bg-cream/60 px-5 py-5">
                  <div className="flex items-center justify-between">
                    <span className="text-cocoa/70">المجموع التقريبي</span>
                    <span className="font-display text-3xl text-cocoa">{formatPrice(total)}</span>
                  </div>
                  <p className="text-xs text-cocoa/50">بالخطوة الجاية بتكتب وين التوصيل وأي ملاحظات.</p>
                  <Link
                    to="/cart"
                    onClick={() => setOpen(false)}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-olive py-4 text-cream transition hover:bg-olive-deep"
                  >
                    كمّل الطلب: التوصيل والملاحظات
                    <ArrowLeft className="size-4" aria-hidden />
                  </Link>
                  <button type="button" onClick={clear} className="w-full text-center text-xs text-cocoa/50 underline-offset-4 hover:underline">
                    فضّي الطلبية
                  </button>
                </footer>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
