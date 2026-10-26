import { ArrowLeft } from 'lucide-react'
import { motion, useInView, useMotionValue, useSpring, useTransform } from 'motion/react'
import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { Link } from 'react-router'
import { formatPrice } from '../lib/format'
import { isLowStock, isSoldOut, leftLabel, stockLeft } from '../lib/stock'
import type { Product } from '../types'
import { BrandPattern } from './BrandPattern'
import { SoldOutStamp } from './SoldOutStamp'

const ease = [0.65, 0, 0.35, 1] as const

/**
 * كرت منتج على شكل هدية: بيطلع ملفوف بورق الهوية وخيط وفيونكة،
 * ولما يوصل للشاشة بينفك الخيط وبينفتح الورق وبتبين الصينية.
 * على الكمبيوتر بيميل مع حركة الماوس.
 */
export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.55 })
  const [opened, setOpened] = useState(false)
  const soldOut = isSoldOut(product)
  const low = isLowStock(product)

  useEffect(() => {
    if (!inView) return
    const t = setTimeout(() => setOpened(true), 450 + index * 300)
    return () => clearTimeout(t)
  }, [inView, index])

  // ميلان ثلاثي الأبعاد مع الماوس
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-7, 7]), { stiffness: 150, damping: 15 })
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [6, -6]), { stiffness: 150, damping: 15 })

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') return
    const r = e.currentTarget.getBoundingClientRect()
    mx.set((e.clientX - r.left) / r.width - 0.5)
    my.set((e.clientY - r.top) / r.height - 0.5)
  }
  const onLeave = () => {
    mx.set(0)
    my.set(0)
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ delay: index * 0.12, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="group [perspective:1000px]"
    >
      <Link to={`/product/${product.slug}`} className="block focus-visible:outline-none">
        <motion.div ref={ref} onPointerMove={onMove} onPointerLeave={onLeave} style={{ rotateX, rotateY }} className="relative">
          {/* القوس */}
          <div className="overflow-hidden rounded-t-[999px] rounded-b-xl bg-cream ring-1 ring-sand-deep sm:vintage-frame sm:rounded-b-2xl sm:ring-0">
            <div className="relative aspect-[4/5] overflow-hidden rounded-t-[999px] rounded-b-xl sm:rounded-b-2xl">
              <motion.img
                src={product.images[0]}
                alt={product.name}
                loading="lazy"
                initial={{ scale: 1.25 }}
                animate={{ scale: opened ? 1 : 1.25 }}
                transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
                className={`size-full object-cover object-[center_62%] transition-[filter] duration-700 ${soldOut ? 'grayscale-[0.7] sepia-[0.35]' : 'group-hover:brightness-105'}`}
              />

              {/* ورق التغليف — نصين بينفتحوا */}
              {[-1, 1].map((side) => (
                <motion.div
                  key={side}
                  aria-hidden
                  className={`absolute inset-y-0 w-1/2 overflow-hidden bg-sand ${side === -1 ? 'left-0' : 'right-0'}`}
                  initial={false}
                  animate={opened ? { x: `${side * 105}%`, rotate: side * 8 } : { x: 0, rotate: 0 }}
                  transition={{ duration: 1.1, ease, delay: 0.25 }}
                  style={{ originY: 1 }}
                >
                  <BrandPattern className="text-olive/25" />
                  <div className={`absolute inset-y-0 w-6 ${side === -1 ? 'right-0 bg-gradient-to-l' : 'left-0 bg-gradient-to-r'} from-black/10 to-transparent`} />
                </motion.div>
              ))}

              {/* الخيط والفيونكة */}
              <motion.div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                initial={false}
                animate={opened ? { opacity: 0, scale: 1.15 } : { opacity: 1, scale: 1 }}
                transition={{ duration: 0.45 }}
              >
                <span className="absolute inset-y-0 left-1/2 w-[3px] -translate-x-1/2 bg-[repeating-linear-gradient(0deg,var(--color-caramel)_0_5px,var(--color-sand-deep)_5px_7px)]" />
                <span className="absolute inset-x-0 top-[42%] h-[3px] bg-[repeating-linear-gradient(90deg,var(--color-caramel)_0_5px,var(--color-sand-deep)_5px_7px)]" />
                <svg viewBox="0 0 80 50" className="absolute top-[42%] left-1/2 w-12 -translate-x-1/2 sm:w-28 -translate-y-1/2 drop-shadow-md">
                  <path d="M40,25 C25,5 5,8 8,22 C10,34 28,30 40,25 Z" fill="var(--color-caramel)" stroke="var(--color-cocoa)" strokeWidth="1" />
                  <path d="M40,25 C55,5 75,8 72,22 C70,34 52,30 40,25 Z" fill="var(--color-caramel)" stroke="var(--color-cocoa)" strokeWidth="1" />
                  <path d="M38,26 L30,46 M42,26 L50,46" stroke="var(--color-caramel)" strokeWidth="3" strokeLinecap="round" />
                  <circle cx="40" cy="25" r="5" fill="var(--color-cocoa)" />
                </svg>
              </motion.div>

              {soldOut && <SoldOutStamp show={opened} />}
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 rounded-b-xl bg-gradient-to-t sm:rounded-b-2xl from-cocoa-deep/35 to-transparent" />
          </div>

          {product.badge && (
            <span className="absolute top-[18%] right-0 translate-x-1 bg-olive px-1.5 py-0.5 text-[0.55rem] text-cream sm:translate-x-2 sm:px-3 sm:py-1 sm:text-xs shadow-md before:absolute before:top-full before:right-0 before:border-t-[6px] before:border-r-[8px] before:border-t-olive-deep before:border-r-transparent before:content-['']">
              {product.badge}
            </span>
          )}

          {/* كرت السعر المعلق */}
          <div className="absolute -bottom-5 left-1 flex origin-top sm:-bottom-7 sm:left-5 flex-col items-center transition-transform duration-700 ease-[var(--ease-soft)] group-hover:-rotate-12">
            <span aria-hidden className="h-3 w-px bg-caramel sm:h-6" />
            <span className="relative grid size-12 place-items-center rounded-full sm:size-[4.75rem] bg-parchment text-center shadow-[0_8px_20px_-8px_rgb(92_59_47/0.25)] ring-1 ring-sand-deep">
              <span aria-hidden className="absolute top-1 size-1.5 rounded-full border border-sand-deep sm:top-1.5 sm:size-2" />
              <span className="mt-1 text-[0.5rem] leading-none text-cocoa/70 sm:mt-1.5 sm:text-[0.65rem]">من</span>
              <span className={`text-[0.62rem] leading-none font-semibold whitespace-nowrap sm:text-sm ${soldOut ? 'text-cocoa/45 line-through decoration-cocoa/40' : 'text-cocoa'}`}>{formatPrice(product.price)}</span>
            </span>
          </div>
        </motion.div>

        <div className="mt-7 px-0.5 sm:mt-10 sm:px-1">
          <h3 className="font-display text-[0.95rem] leading-snug text-olive transition-colors group-hover:text-cocoa sm:text-2xl lg:text-[1.7rem]">{product.name}</h3>
          {low && (
            <span className="mt-1.5 inline-flex items-center gap-1 text-[0.62rem] text-cocoa sm:mt-2 sm:text-xs">
              <span aria-hidden className="size-1.5 animate-pulse rounded-full bg-cocoa" />
              {leftLabel(stockLeft(product)!)}
            </span>
          )}
          <p className="mt-2 line-clamp-2 hidden text-sm leading-relaxed text-cocoa-deep/70 sm:block">{product.shortDescription}</p>
          <span className="mt-4 hidden items-center gap-2 text-sm text-cocoa sm:inline-flex">
            شوف التفاصيل
            <ArrowLeft className="size-4 transition-transform duration-300 group-hover:-translate-x-1.5" aria-hidden />
          </span>
        </div>
      </Link>
    </motion.article>
  )
}
