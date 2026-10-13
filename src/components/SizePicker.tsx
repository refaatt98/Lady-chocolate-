import { motion } from 'motion/react'
import type { ProductSize } from '../types'
import { PETAL_PATH } from './ChocolatePetal'

/** صينية مصغّرة: كل ما كبر الحجم، بتزيد حلقات البتلات */
function MiniTray({ rings, active }: { rings: number; active: boolean }) {
  return (
    <svg viewBox="0 0 100 100" className="size-full" aria-hidden>
      <circle cx="50" cy="50" r="48" fill="var(--color-parchment)" stroke={active ? 'var(--color-olive)' : 'var(--color-sand-deep)'} strokeWidth="2" strokeDasharray="4 2.5" />
      {Array.from({ length: rings }, (_, r) => {
        const count = 8 + r * 4
        const radius = 13 + r * 11
        return Array.from({ length: count }, (_, i) => (
          <motion.g
            key={`${r}-${i}`}
            initial={false}
            animate={{ opacity: 1, scale: active ? 1 : 0.9 }}
            transition={{ delay: active ? (r * count + i) * 0.01 : 0 }}
          >
            <g transform={`translate(50 50) rotate(${(360 / count) * i + r * 10}) translate(-3.2 ${-radius - 8}) scale(0.16)`}>
              <path d={PETAL_PATH} fill={(i + r) % 2 ? 'var(--color-milk)' : 'var(--color-cocoa)'} />
            </g>
          </motion.g>
        ))
      })}
      <circle cx="50" cy="50" r="9" fill="#fbf8f2" stroke="var(--color-sand-deep)" strokeWidth="1" />
    </svg>
  )
}

export function SizePicker({ sizes, value, onChange }: { sizes: ProductSize[]; value: string; onChange: (id: string) => void }) {
  return (
    <div role="radiogroup" aria-label="الحجم" className="grid grid-cols-3 gap-3">
      {sizes.map((size, i) => {
        const active = size.id === value
        return (
          <button
            key={size.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(size.id)}
            className={`group relative flex flex-col items-center rounded-2xl border px-2 pt-3 pb-3 transition ${
              active ? 'border-olive bg-olive/[0.06] shadow-[0_10px_25px_-15px_rgb(74_86_57/0.8)]' : 'border-sand-deep/50 hover:border-sand-deep'
            }`}
          >
            <motion.div className="aspect-square" animate={{ width: `${58 + i * 14}%`, rotate: active ? 0 : -8 }} transition={{ type: 'spring', stiffness: 200, damping: 18 }}>
              <MiniTray rings={i + 1} active={active} />
            </motion.div>
            <span className={`font-display mt-2 text-xl ${active ? 'text-olive' : 'text-cocoa-deep/80'}`}>{size.label}</span>
            <span className="text-xs text-cocoa/60">{size.pieces} قطعة</span>
            {active && <motion.span layoutId="size-dot" className="absolute -top-1.5 size-3 rounded-full bg-olive ring-4 ring-parchment" />}
          </button>
        )
      })}
    </div>
  )
}
