import { motion, useScroll, useTransform } from 'motion/react'
import { useRef } from 'react'

const words = ['عرس', 'خطوبة', 'مولود جديد', 'نجاح', 'عيد', 'تخرّج', 'شكرًا', 'رمضان', 'هدية حب']

/** حافة شوكولا ذايبة: نقاط بأطوال مختلفة (ثابتة عشان الشكل ما يتغير) */
const drips = [
  [60, 22, 58], [170, 30, 82], [260, 16, 44], [360, 26, 70], [480, 34, 96], [590, 18, 50],
  [700, 28, 76], [820, 20, 56], [930, 32, 90], [1050, 18, 48], [1160, 26, 74], [1270, 22, 60], [1380, 30, 84],
] as const

const BASE = 14
const dripPath = (() => {
  let d = `M0,0 L0,${BASE}`
  for (const [x, w, len] of drips) {
    d += ` L${x - w},${BASE} C${x - w * 0.35},${BASE} ${x - w * 0.62},${len} ${x},${len} C${x + w * 0.62},${len} ${x + w * 0.35},${BASE} ${x + w},${BASE}`
  }
  return `${d} L1440,${BASE} L1440,0 Z`
})()

/** شريط شوكولا بيمشي بكلمات المناسبات، وتحته شوكولا بتنقط وبتطول مع السكرول */
export function DripRibbon() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const stretch = useTransform(scrollYProgress, [0, 1], [0.5, 1.7])

  return (
    <div ref={ref} className="relative z-10" aria-hidden>
      <div className="overflow-hidden bg-cocoa py-4 text-cream">
        <div dir="ltr" className="flex w-max animate-[marquee_38s_linear_infinite] motion-reduce:animate-none">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex shrink-0 items-center">
              {words.map((w) => (
                <span key={w} className="flex items-center">
                  <span className="font-display px-6 text-2xl whitespace-nowrap md:text-3xl">{w}</span>
                  <span className="text-caramel">✦</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
      <motion.svg
        viewBox="0 0 1440 100"
        preserveAspectRatio="none"
        className="-mt-px block h-12 w-full origin-top md:h-20"
        style={{ scaleY: stretch }}
      >
        <path d={dripPath} fill="var(--color-cocoa)" />
      </motion.svg>
      {/* نقاط بتوقع */}
      {[12, 41, 64, 88].map((left, i) => (
        <span
          key={left}
          className="fountain-drip absolute top-[calc(100%-1.5rem)] block h-3 w-2 rounded-full bg-cocoa md:top-[calc(100%-2rem)]"
          style={{ left: `${left}%`, animationDelay: `${i * 0.7}s`, ['--drip-distance' as string]: '70px' }}
        />
      ))}
    </div>
  )
}
