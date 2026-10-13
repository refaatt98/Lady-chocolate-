import { motion, useMotionValueEvent, useScroll, useTransform } from 'motion/react'
import { useRef, useState, type ReactNode } from 'react'
import { PETAL_PATH, PETAL_RIDGES } from './ChocolatePetal'

/**
 * الحكاية: "من الحبة للصينية" — سكشن بيثبت بالشاشة، والسكرول لتحت بيحرّك الفصول بالعرض.
 * كل فصل إله رسمة بتتحرك لما يوصلها الدور.
 */

interface Chapter {
  title: string
  text: string
  art: (active: boolean) => ReactNode
}

const chapters: Chapter[] = [
  {
    title: 'من حبة كاكاو',
    text: 'كل إشي بيبدأ من حبة. منختار شوكولا بلجيكية أصلية، معمولة من أنقى حبوب الكاكاو.',
    art: (active) => <CocoaPod active={active} />,
  },
  {
    title: 'بتذوب على مهل',
    text: 'منذوّبها على حرارة هادية ومضبوطة، عشان تطلع لامعة وناعمة وبتطقطق تحت السن.',
    art: (active) => <MeltingBar active={active} />,
  },
  {
    title: 'بتترتب باليد',
    text: 'بتلة ورا بتلة، بتنصفّ الشوكولا باليد على شكل زهرة. ولا صينية بتشبه الثانية.',
    art: (active) => <PetalBloom active={active} />,
  },
  {
    title: 'وبتوصلك بأساميكم',
    text: 'وبالآخر بنكتب أساميكم وتاريخ فرحتكم، وبتطلع هدية بتضل بالذاكرة.',
    art: (active) => <TrayReveal active={active} />,
  },
]

export function Journey() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const n = chapters.length
  // بالعربي الفصول من اليمين لليسار، فمنحرّك الشريط لليمين
  const x = useTransform(scrollYProgress, [0.05, 0.95], ['0vw', `${(n - 1) * 100}vw`])
  const [current, setCurrent] = useState(0)

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    setCurrent(Math.min(n - 1, Math.max(0, Math.round(((v - 0.05) / 0.9) * (n - 1)))))
  })

  return (
    <section ref={ref} aria-label="حكاية الشوكولا" className="relative" style={{ height: `${n * 100}vh` }}>
      <div className="sticky top-0 flex h-dvh flex-col overflow-hidden">
        <div className="mx-auto w-full max-w-6xl px-4 pt-24 sm:px-6 md:pt-28">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p dir="ltr" className="font-latin text-right text-xs tracking-[0.4em] text-cocoa/60 uppercase">
                Our Story
              </p>
              <h2 className="font-display mt-2 text-3xl text-olive sm:text-5xl">من الحبة للصينية</h2>
            </div>
            <p dir="ltr" className="font-latin text-3xl text-cocoa/70 tabular-nums sm:text-5xl">
              <span className="text-cocoa">{String(current + 1).padStart(2, '0')}</span>
              <span className="text-cocoa/30"> / {String(n).padStart(2, '0')}</span>
            </p>
          </div>
          {/* شريط التقدم مع نقطة شوكولا */}
          <div className="relative mt-5 h-px bg-sand-deep/50">
            <motion.div className="absolute inset-y-0 right-0 left-0 origin-right bg-cocoa" style={{ scaleX: scrollYProgress }} />
          </div>
        </div>

        <motion.div style={{ x }} className="flex flex-1">
          {chapters.map((c, i) => (
            <div key={c.title} className="flex w-screen shrink-0 items-center">
              <div className="mx-auto grid w-full max-w-6xl items-center gap-6 px-4 sm:px-6 md:grid-cols-2 md:gap-16">
                <div className="mx-auto w-56 sm:w-72 md:order-2 md:w-96">{c.art(current >= i)}</div>
                <motion.div
                  className="text-center md:text-right"
                  animate={{ opacity: current === i ? 1 : 0.25, y: current === i ? 0 : 16 }}
                  transition={{ duration: 0.5 }}
                >
                  <span className="font-display text-7xl leading-none text-sand-deep/60 md:text-9xl">{['١', '٢', '٣', '٤'][i]}</span>
                  <h3 className="font-display mt-2 text-4xl text-olive md:text-6xl">{c.title}</h3>
                  <p className="mx-auto mt-4 max-w-md text-lg leading-loose text-cocoa-deep/75 md:mx-0">{c.text}</p>
                </motion.div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

/* ---------------------------- الرسومات ---------------------------- */

const draw = (active: boolean, delay = 0) => ({
  initial: { pathLength: 0 },
  animate: { pathLength: active ? 1 : 0 },
  transition: { duration: 1.4, delay, ease: [0.65, 0, 0.35, 1] as const },
})

function CocoaPod({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 300 300" className="w-full overflow-visible">
      <defs>
        <linearGradient id="pod" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--color-caramel)" />
          <stop offset="1" stopColor="var(--color-cocoa)" />
        </linearGradient>
      </defs>
      <circle cx="150" cy="160" r="128" fill="var(--color-cream)" />
      {/* ورق */}
      <motion.path
        d="M150,40 C110,10 60,20 40,50 C80,60 120,55 150,40 Z"
        fill="var(--color-olive)"
        initial={{ scale: 0 }}
        animate={{ scale: active ? 1 : 0 }}
        transition={{ delay: 0.6, type: 'spring' }}
        style={{ originX: 1, originY: 0.5 }}
      />
      <motion.path
        d="M150,40 C185,8 240,15 262,42 C222,58 182,56 150,40 Z"
        fill="var(--color-olive-soft)"
        initial={{ scale: 0 }}
        animate={{ scale: active ? 1 : 0 }}
        transition={{ delay: 0.75, type: 'spring' }}
        style={{ originX: 0, originY: 0.5 }}
      />
      {/* القرن */}
      <motion.path
        d="M150,45 C215,55 238,140 224,205 C210,262 176,282 150,282 C124,282 90,262 76,205 C62,140 85,55 150,45 Z"
        fill="url(#pod)"
        initial={{ scaleY: 0.2, opacity: 0 }}
        animate={{ scaleY: active ? 1 : 0.2, opacity: active ? 1 : 0 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        style={{ originY: 0 }}
      />
      {[
        'M150,50 C150,120 150,200 150,280',
        'M150,50 C120,110 108,200 118,276',
        'M150,50 C180,110 192,200 182,276',
        'M150,52 C100,100 84,190 96,260',
        'M150,52 C200,100 216,190 204,260',
      ].map((d, i) => (
        <motion.path
          key={d}
          d={d}
          fill="none"
          stroke="var(--color-cocoa-deep)"
          strokeOpacity="0.35"
          strokeWidth="2"
          {...draw(active, 0.4 + i * 0.08)}
        />
      ))}
      {/* حبوب */}
      {[
        [62, 262, -30],
        [238, 268, 25],
        [210, 290, 70],
      ].map(([cx, cy, r], i) => (
        <motion.ellipse
          key={i}
          cx={cx}
          cy={cy}
          rx="16"
          ry="10"
          fill="var(--color-cocoa)"
          transform={`rotate(${r} ${cx} ${cy})`}
          initial={{ scale: 0 }}
          animate={{ scale: active ? 1 : 0 }}
          transition={{ delay: 1 + i * 0.12, type: 'spring', stiffness: 260 }}
        />
      ))}
    </svg>
  )
}

function MeltingBar({ active }: { active: boolean }) {
  const drips = [
    [92, 40],
    [130, 70],
    [168, 52],
    [204, 84],
  ]
  return (
    <svg viewBox="0 0 300 300" className="w-full overflow-visible">
      <circle cx="150" cy="160" r="128" fill="var(--color-cream)" />
      <motion.g initial={{ y: -20, opacity: 0 }} animate={{ y: active ? 0 : -20, opacity: active ? 1 : 0 }} transition={{ duration: 0.8 }}>
        <rect x="60" y="60" width="180" height="110" rx="8" fill="var(--color-cocoa)" />
        {[0, 1, 2].map((c) =>
          [0, 1].map((r) => (
            <rect key={`${c}${r}`} x={68 + c * 58} y={68 + r * 48} width="50" height="42" rx="5" fill="var(--color-milk)" opacity="0.55" />
          )),
        )}
        {/* الطرف الذايب */}
        <path d="M60,160 L240,160 L240,172 C226,172 222,190 212,190 C200,190 202,172 186,172 L60,172 Z" fill="var(--color-cocoa)" />
        {drips.map(([x, len], i) => (
          <g key={x}>
            <motion.path
              d={`M${x - 9},168 C${x - 9},${168 + len * 0.6} ${x - 6},${168 + len} ${x},${168 + len} C${x + 6},${168 + len} ${x + 9},${168 + len * 0.6} ${x + 9},168 Z`}
              fill="var(--color-cocoa)"
              initial={{ scaleY: 0 }}
              animate={{ scaleY: active ? 1 : 0 }}
              transition={{ delay: 0.5 + i * 0.15, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              style={{ originY: 0 }}
            />
            <ellipse
              className="fountain-drip"
              style={{ animationDelay: `${i * 0.6}s`, ['--drip-distance' as string]: `${250 - 168 - len}px` }}
              cx={x}
              cy={172 + len}
              rx="4"
              ry="5.5"
              fill="var(--color-cocoa)"
            />
          </g>
        ))}
      </motion.g>
      {/* البركة تحت */}
      <motion.ellipse
        cx="150"
        cy="256"
        rx="90"
        ry="12"
        fill="var(--color-cocoa)"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: active ? 1 : 0 }}
        transition={{ delay: 0.9, duration: 1 }}
      />
      <ellipse className="fountain-ripple" cx="150" cy="256" rx="80" ry="9" fill="none" stroke="var(--color-caramel)" />
    </svg>
  )
}

function PetalBloom({ active }: { active: boolean }) {
  const count = 14
  return (
    <svg viewBox="0 0 300 300" className="w-full overflow-visible">
      <circle cx="150" cy="150" r="140" fill="var(--color-cream)" />
      <circle cx="150" cy="150" r="128" fill="none" stroke="var(--color-sand-deep)" strokeDasharray="2 6" />
      {Array.from({ length: count }, (_, i) => (
        <g key={i} transform={`translate(150 150) rotate(${(360 / count) * i})`}>
          <motion.g
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: active ? 1 : 0, y: active ? 0 : -40 }}
            transition={{ delay: 0.2 + i * 0.09, type: 'spring', stiffness: 200, damping: 16 }}
          >
            <g transform="translate(-16 -122) scale(0.8)">
              <path d={PETAL_PATH} fill={i % 2 ? 'var(--color-milk)' : 'var(--color-cocoa)'} />
              {PETAL_RIDGES.map((d) => (
                <path key={d} d={d} fill="none" stroke="#000" strokeOpacity="0.2" strokeWidth="1" />
              ))}
            </g>
          </motion.g>
        </g>
      ))}
      <motion.circle
        cx="150"
        cy="150"
        r="44"
        fill="#fbf8f2"
        stroke="var(--color-sand-deep)"
        initial={{ scale: 0 }}
        animate={{ scale: active ? 1 : 0 }}
        transition={{ delay: 1.5, type: 'spring' }}
      />
      {/* إيد بتحط آخر بتلة — رمز بسيط */}
      <motion.text
        x="150"
        y="160"
        textAnchor="middle"
        fontFamily="var(--font-display)"
        fontSize="30"
        fill="var(--color-olive)"
        initial={{ opacity: 0 }}
        animate={{ opacity: active ? 1 : 0 }}
        transition={{ delay: 1.8 }}
      >
        باليد
      </motion.text>
    </svg>
  )
}

function TrayReveal({ active }: { active: boolean }) {
  return (
    <motion.div
      className="relative mx-auto w-full"
      initial={{ clipPath: 'inset(100% 0 0 0 round 999px 999px 24px 24px)' }}
      animate={{ clipPath: active ? 'inset(0% 0 0 0 round 999px 999px 24px 24px)' : 'inset(100% 0 0 0 round 999px 999px 24px 24px)' }}
      transition={{ duration: 1.2, ease: [0.65, 0, 0.35, 1] }}
    >
      <div className="vintage-frame overflow-hidden rounded-t-[999px] rounded-b-3xl">
        <img
          src="/images/products/tray-green-field.jpg"
          alt="صينية جاهزة بالاسم"
          loading="lazy"
          className="aspect-[4/5] w-full object-cover object-[center_62%]"
        />
      </div>
    </motion.div>
  )
}
