import { motion } from 'motion/react'
import { Link } from 'react-router'
import type { Category } from '../types'

const tones: Record<Category['tone'], { disc: string; text: string; sub: string }> = {
  milk: { disc: 'bg-milk', text: 'text-cream', sub: 'text-cream/70' },
  dark: { disc: 'bg-cocoa-deep', text: 'text-cream', sub: 'text-sand/70' },
  white: { disc: 'bg-cream', text: 'text-cocoa', sub: 'text-cocoa/60' },
  caramel: { disc: 'bg-caramel', text: 'text-cocoa-deep', sub: 'text-cocoa-deep/60' },
  olive: { disc: 'bg-olive', text: 'text-cream', sub: 'text-sand/80' },
}

/** قسم على شكل كرت دائري معلق بخيط — متل الكرت اللي على التغليف */
export function CategoryTag({ category, index }: { category: Category; index: number }) {
  const tone = tones[category.tone]
  // كل كرت بطول خيط مختلف شوي عشان يبينوا معلقين بشكل طبيعي
  const stringHeight = [44, 64, 36, 56, 48][index % 5]

  return (
    <motion.div
      initial={{ opacity: 0, y: -30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay: index * 0.1, type: 'spring', stiffness: 120, damping: 12 }}
      className="flex w-[7.5rem] shrink-0 flex-col items-center sm:w-36"
    >
      <motion.div
        className="flex flex-col items-center"
        style={{ originY: 0 }}
        whileHover={{ rotate: [0, 7, -5, 3, -1, 0], transition: { duration: 1.4 } }}
        whileTap={{ rotate: [0, 5, -3, 0], transition: { duration: 0.8 } }}
      >
        {/* الخيط */}
        <svg aria-hidden width="10" height={stringHeight} viewBox={`0 0 10 ${stringHeight}`} className="overflow-visible">
          <path
            d={`M5,0 Q7,${stringHeight / 2} 5,${stringHeight}`}
            stroke="var(--color-caramel)"
            strokeWidth="1.6"
            strokeDasharray="3 1.5"
            fill="none"
          />
        </svg>
        <Link
          to={`/shop?category=${category.slug}`}
          className={`relative grid aspect-square w-[7.5rem] place-items-center rounded-full p-4 text-center shadow-[0_10px_25px_-12px_rgb(62_36_29/0.6)] ring-1 ring-black/5 transition-shadow hover:shadow-[0_18px_30px_-12px_rgb(62_36_29/0.7)] sm:w-36 ${tone.disc}`}
        >
          {/* الحلقة المعدنية */}
          <span aria-hidden className="absolute top-2.5 size-3 rounded-full border-2 border-sand-deep bg-parchment" />
          <span className="mt-2 flex flex-col items-center gap-1">
            <span className={`font-display text-xl leading-tight sm:text-2xl ${tone.text}`}>{category.name}</span>
            <span dir="ltr" className={`font-latin text-[0.6rem] tracking-[0.2em] uppercase ${tone.sub}`}>
              {category.latinName}
            </span>
          </span>
        </Link>
      </motion.div>
    </motion.div>
  )
}
