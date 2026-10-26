import { motion } from 'motion/react'

/**
 * ختم عتيق "نفذت الكمية" — بينطبع على صورة المنتج متل ختم الحبر.
 * size: sm للكروت، lg لصفحة المنتج.
 */
export function SoldOutStamp({ size = 'sm', show = true }: { size?: 'sm' | 'lg'; show?: boolean }) {
  const lg = size === 'lg'
  return (
    <motion.div
      aria-label="نفذت الكمية"
      role="img"
      initial={{ opacity: 0, scale: 1.8, rotate: -4 }}
      animate={show ? { opacity: 1, scale: 1, rotate: -12 } : { opacity: 0, scale: 1.8, rotate: -4 }}
      transition={{ type: 'spring', stiffness: 260, damping: 16, delay: show ? 0.35 : 0 }}
      className="pointer-events-none absolute inset-0 grid place-items-center"
    >
      <div
        className={`relative grid place-items-center rounded-full bg-parchment/80 text-cocoa backdrop-blur-[1px] ${lg ? 'size-44 sm:size-52' : 'size-[4.6rem] sm:size-32'}`}
        style={{
          boxShadow: `0 0 0 ${lg ? 3 : 1.5}px var(--color-cocoa), 0 0 0 ${lg ? 7 : 3.5}px rgb(242 237 227 / 0.8), 0 0 0 ${lg ? 8.5 : 4.5}px var(--color-cocoa), 0 10px 30px -10px rgb(90 61 51 / 0.45)`,
        }}
      >
        {/* نجوم الختم */}
        <span aria-hidden className={`absolute top-[14%] font-latin text-cocoa/60 ${lg ? 'text-xs tracking-[0.5em]' : 'text-[0.4rem] tracking-[0.3em] sm:text-[0.6rem]'}`}>
          ✦ ✦ ✦
        </span>
        <span className="flex flex-col items-center leading-none">
          <span className={`font-display whitespace-nowrap ${lg ? 'text-3xl sm:text-4xl' : 'text-[0.78rem] sm:text-xl'}`}>نفذت الكمية</span>
          <span
            dir="ltr"
            className={`font-latin mt-1 border-t border-cocoa/40 pt-1 text-cocoa/70 ${lg ? 'text-xs tracking-[0.45em]' : 'text-[0.36rem] tracking-[0.3em] sm:text-[0.55rem]'}`}
          >
            SOLD OUT
          </span>
        </span>
      </div>
    </motion.div>
  )
}

/** شريطة صغيرة "باقي ٢ بس" */
export function LowStockTag({ label, className = '' }: { label: string; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full bg-caramel/20 px-2.5 py-1 text-xs text-cocoa ring-1 ring-caramel/40 ${className}`}>
      <span aria-hidden className="size-1.5 animate-pulse rounded-full bg-cocoa" />
      {label}
    </span>
  )
}
