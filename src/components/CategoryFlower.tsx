import { ArrowLeft } from 'lucide-react'
import { AnimatePresence, motion, useInView } from 'motion/react'
import { useRef, useState } from 'react'
import { Link } from 'react-router'
import type { Category } from '../types'
import { PETAL_PATH, PETAL_RIDGES } from './ChocolatePetal'

/**
 * زهرة الأقسام — نفس تصميم الصواني: بتلات شوكولا حوالين قرص بالنص.
 * كل بتلة كبيرة = قسم. لما تمرق عليها (أو تكبسها) بتطلع لبرا، والقرص بيكتب اسم القسم.
 */

const SIZE = 600
const C = SIZE / 2
const DISC_R = 122
const LABEL_R = 286

const toneFill: Record<Category['tone'], { fill: string; ink: string }> = {
  milk: { fill: 'var(--color-milk)', ink: 'var(--color-cream)' },
  dark: { fill: 'var(--color-cocoa-deep)', ink: 'var(--color-cream)' },
  white: { fill: 'var(--color-cream)', ink: 'var(--color-cocoa)' },
  caramel: { fill: 'var(--color-caramel)', ink: 'var(--color-cocoa-deep)' },
  olive: { fill: 'var(--color-olive)', ink: 'var(--color-cream)' },
}

export function CategoryFlower({ categories, hint }: { categories: Category[]; hint?: string }) {
  const [active, setActive] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.35 })
  const current = categories[active]

  // بين كل بتلتين قسم، ٣ بتلات زينة — زهرة كثيفة متل الصواني
  const PER = 4
  const total = categories.length * PER
  const step = 360 / total

  return (
    <div className="grid items-center gap-10 md:grid-cols-[1fr_1.15fr] md:gap-6">
      {/* النص — على الكمبيوتر يمين الزهرة */}
      <div className="order-2 text-center md:order-1 md:text-right">
        <AnimatePresence mode="wait">
          {current && (
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35 }}
            >
              <p dir="ltr" className="font-latin text-xs tracking-[0.4em] text-cocoa/60 uppercase md:text-right">
                {String(active + 1).padStart(2, '0')} / {String(categories.length).padStart(2, '0')} · {current.latinName}
              </p>
              <h3 className="font-display mt-3 text-5xl text-olive md:text-6xl">{current.name}</h3>
              <p className="mx-auto mt-4 max-w-sm text-lg leading-loose text-cocoa-deep/75 md:mx-0">{current.description}</p>
              <Link
                to={`/shop?category=${current.slug}`}
                className="group mt-7 inline-flex items-center gap-2 rounded-full bg-olive px-7 py-3.5 text-cream transition hover:bg-olive-deep"
              >
                تصفّح {current.name}
                <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" aria-hidden />
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
        {hint && <p className="mt-8 text-sm text-cocoa/50">{hint}</p>}
      </div>

      {/* الزهرة */}
      <div ref={ref} className="relative order-1 mx-auto aspect-square w-full max-w-[21rem] sm:max-w-md md:order-2 md:max-w-[34rem]">
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="size-full overflow-visible" aria-hidden={false}>
          <defs>
            <radialGradient id="flower-disc" cx="0.4" cy="0.35" r="0.8">
              <stop offset="0" stopColor="#fbf8f2" />
              <stop offset="1" stopColor="var(--color-cream)" />
            </radialGradient>
            <linearGradient id="flower-deco" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="var(--color-milk)" />
              <stop offset="1" stopColor="var(--color-cocoa-deep)" />
            </linearGradient>
          </defs>

          {/* حلقة منقطة بتلف */}
          <g className="origin-center animate-[spin_60s_linear_infinite] motion-reduce:animate-none" style={{ transformBox: 'fill-box' }}>
            <circle
              cx={C}
              cy={C}
              r="292"
              fill="none"
              stroke="var(--color-sand-deep)"
              strokeWidth="1.2"
              strokeDasharray="2 10"
              strokeLinecap="round"
            />
          </g>
          <circle cx={C} cy={C} r="250" fill="var(--color-cream)" opacity="0.55" />

          {/* بتلات الزينة أول، وبعدين بتلات الأقسام فوقها */}
          {Array.from({ length: total }, (_, i) => i)
            .sort((a, b) => Number(a % PER === 0) - Number(b % PER === 0))
            .map((i) => {
              const angle = i * step
              const isCategory = i % PER === 0
              const catIndex = i / PER
              const cat = isCategory ? categories[catIndex] : undefined
              const isActive = isCategory && catIndex === active
              const tone = cat ? (cat.color ? { fill: cat.color, ink: '' } : toneFill[cat.tone]) : null
              // البتلة مرسومة بـ viewBox 40x96 ورأسها لفوق؛ منكبرها ومنحط قاعدتها على حافة القرص
              const scale = isCategory ? 1.5 : 1.1
              const lift = isActive ? 14 : 0

              return (
                <g key={i} transform={`translate(${C} ${C}) rotate(${angle})`}>
                  <motion.g
                    initial={{ scale: 0, opacity: 0 }}
                    animate={inView ? { scale: 1, opacity: 1, y: -lift } : {}}
                    transition={{
                      scale: { delay: 0.15 + i * 0.06, type: 'spring', stiffness: 160, damping: 14 },
                      opacity: { delay: 0.15 + i * 0.06 },
                      y: { type: 'spring', stiffness: 260, damping: 18 },
                    }}
                    style={{ originX: 0.5, originY: 1 }}
                  >
                    <g transform={`translate(${-20 * scale} ${-(DISC_R - 14) - 94 * scale}) scale(${scale})`}>
                      {isCategory && cat && tone ? (
                        <g
                          role="button"
                          tabIndex={0}
                          aria-label={cat.name}
                          aria-pressed={isActive}
                          className="cursor-pointer outline-none"
                          onMouseEnter={() => setActive(catIndex)}
                          onFocus={() => setActive(catIndex)}
                          onClick={() => setActive(catIndex)}
                          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setActive(catIndex)}
                        >
                          <path
                            d={PETAL_PATH}
                            fill={tone.fill}
                            stroke={isActive ? 'var(--color-cocoa-deep)' : 'var(--color-sand-deep)'}
                            strokeWidth={isActive ? 1.6 : 0.8}
                            style={{ filter: isActive ? 'drop-shadow(0 6px 6px rgb(62 36 29 / 0.35))' : undefined }}
                          />
                          {PETAL_RIDGES.map((d) => (
                            <path key={d} d={d} fill="none" stroke="#000" strokeOpacity="0.16" strokeWidth="1" />
                          ))}
                          <path
                            d="M14,20 C10,40 9,60 11,78"
                            fill="none"
                            stroke="#fff"
                            strokeOpacity="0.3"
                            strokeWidth="2.4"
                            strokeLinecap="round"
                          />
                        </g>
                      ) : (
                        <g opacity="0.85">
                          <path d={PETAL_PATH} fill="url(#flower-deco)" />
                          {PETAL_RIDGES.map((d) => (
                            <path key={d} d={d} fill="none" stroke="#000" strokeOpacity="0.2" strokeWidth="1" />
                          ))}
                        </g>
                      )}
                    </g>
                  </motion.g>
                </g>
              )
            })}

          {/* القرص بالنص — متل القرص المطبوع بالصواني */}
          <motion.g
            initial={{ scale: 0.6, opacity: 0 }}
            animate={inView ? { scale: 1, opacity: 1 } : {}}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            style={{ originX: 0.5, originY: 0.5 }}
          >
            <circle cx={C} cy={C} r={DISC_R} fill="url(#flower-disc)" stroke="var(--color-sand-deep)" strokeWidth="1.5" />
            <circle cx={C} cy={C} r={DISC_R - 10} fill="none" stroke="var(--color-sand-deep)" strokeWidth="0.8" strokeDasharray="3 4" />
          </motion.g>
        </svg>

        {/* نص القرص */}
        <div className="pointer-events-none absolute inset-[30%] grid place-items-center text-center">
          <AnimatePresence mode="wait">
            {current && (
              <motion.div
                key={current.id}
                initial={{ opacity: 0, scale: 0.85, filter: 'blur(4px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 1.1, filter: 'blur(4px)' }}
                transition={{ duration: 0.3 }}
              >
                <span className="font-display block text-[1.6rem] leading-tight text-cocoa sm:text-4xl md:text-[2.6rem]">
                  {current.name}
                </span>
                <span dir="ltr" className="font-latin mt-1 block text-[0.55rem] tracking-[0.3em] text-cocoa/60 uppercase sm:text-xs">
                  {current.latinName}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* أسماء الأقسام حوالين الزهرة */}
        {categories.map((cat, i) => {
          const rad = (i * PER * step * Math.PI) / 180
          const left = 50 + (LABEL_R / SIZE) * 100 * Math.sin(rad)
          const top = 50 - (LABEL_R / SIZE) * 100 * Math.cos(rad)
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActive(i)}
              onMouseEnter={() => setActive(i)}
              className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full px-2 py-0.5 text-xs whitespace-nowrap transition sm:text-sm ${
                i === active ? 'bg-olive text-cream' : 'text-cocoa/80 hover:text-olive'
              }`}
              style={{ left: `${left}%`, top: `${top}%` }}
            >
              {cat.name}
            </button>
          )
        })}
      </div>
    </div>
  )
}
