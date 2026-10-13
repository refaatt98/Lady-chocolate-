import { motion, useReducedMotion } from 'motion/react'
import { useId } from 'react'

/**
 * نافورة شوكولا عتيقة — SVG مرسوم بالكود.
 * أحواض حجرية مضلّعة (متل حافة الصواني)، والشوكولا بتفيض من كل حوض
 * وبتنزل بخيوط على الحوض اللي تحته. الجريان والتموّج كلهم CSS (شوف index.css).
 */

const CX = 200

interface Bowl {
  id: string
  cy: number // مركز الحافة
  rx: number
  ry: number
  depth: number // عمق جسم الحوض تحت الحافة
  stem: number // عرض العمود تحت الحوض
}

const bowls: Bowl[] = [
  { id: 'top', cy: 172, rx: 58, ry: 9, depth: 26, stem: 14 },
  { id: 'middle', cy: 272, rx: 100, ry: 14, depth: 36, stem: 22 },
]

const BASIN = { cy: 398, rx: 165, ry: 26 }

/** نقطة على القوس الأمامي لأي حافة */
const arcY = (cy: number, rx: number, ry: number, x: number) =>
  cy + ry * Math.sqrt(Math.max(0, 1 - ((x - CX) / rx) ** 2))

/** خيوط الشوكولا من حافة حوض لسطح الحوض اللي تحته */
function streams(from: Bowl, toCy: number, toRx: number, toRy: number, positions: number[]) {
  return positions.map((t) => {
    const x1 = CX + t * from.rx
    const y1 = arcY(from.cy, from.rx, from.ry, x1) - 1
    const x2 = CX + t * (from.rx + 22)
    const y2 = arcY(toCy, toRx, toRy, x2) - toRy * 0.35
    const h = y2 - y1
    return { d: `M${x1},${y1} C${x1 + t * 26},${y1 + h * 0.08} ${x2},${y2 - h * 0.55} ${x2},${y2}`, x2, y2 }
  })
}

const topStreams = streams(bowls[0], bowls[1].cy, bowls[1].rx, bowls[1].ry, [-0.82, -0.36, 0.12, 0.58, 0.92])
const midStreams = streams(bowls[1], BASIN.cy, BASIN.rx - 8, BASIN.ry - 5, [-0.9, -0.58, -0.24, 0.1, 0.44, 0.76])

const basinDrips = [
  { x: 70, len: 14, fall: true, delay: '0s' },
  { x: 128, len: 20, fall: false, delay: '0.6s' },
  { x: 250, len: 12, fall: true, delay: '1.3s' },
  { x: 300, len: 18, fall: false, delay: '0.2s' },
  { x: 342, len: 10, fall: true, delay: '1.9s' },
]

const pour = (reduce: boolean, delay: number) =>
  reduce
    ? {}
    : {
        initial: { pathLength: 0, opacity: 0 },
        animate: { pathLength: 1, opacity: 1 },
        transition: { delay, duration: 0.9, ease: [0.65, 0, 0.35, 1] as const },
      }

const appear = (reduce: boolean, delay: number) =>
  reduce ? {} : { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay, duration: 0.6 } }

interface Ctx {
  g: (name: string) => string
  reduce: boolean
}

/** خيط شوكولا: أساس غامق + لمعة فاتحة بتجري لتحت */
function Stream({ d, width, delay, i, ctx }: { d: string; width: number; delay: number; i: number; ctx: Ctx }) {
  return (
    <g>
      <motion.path
        d={d}
        fill="none"
        stroke="var(--color-cocoa)"
        strokeWidth={width}
        strokeLinecap="round"
        {...pour(ctx.reduce, delay)}
      />
      <motion.path
        d={d}
        fill="none"
        stroke="var(--color-caramel)"
        strokeOpacity="0.75"
        strokeWidth={width * 0.3}
        strokeLinecap="round"
        className="fountain-flow"
        style={{ animationDelay: `${-i * 0.43}s` }}
        {...appear(ctx.reduce, delay + 0.8)}
      />
    </g>
  )
}

/** حافة حوض مغطاية شوكولا مع نقاط فايضة */
function ChocolateRim({ b, delay, ctx }: { b: Bowl; delay: number; ctx: Ctx }) {
  const { g } = ctx
  return (
    <motion.g {...appear(ctx.reduce, delay)}>
      <ellipse cx={CX} cy={b.cy} rx={b.rx - 4} ry={b.ry - 2.5} fill={`url(#${g('pool')})`} />
      <path
        d={`M${CX - b.rx},${b.cy} A${b.rx},${b.ry} 0 0 0 ${CX + b.rx},${b.cy}`}
        fill="none"
        stroke="var(--color-cocoa)"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </motion.g>
  )
}

/** جسم الحوض: نص بيضاوي تحت الحافة، مضلّع */
function BowlBody({ b, ctx }: { b: Bowl; ctx: Ctx }) {
  const { g } = ctx
  const bottom = b.cy + b.ry + b.depth
  const flutes = Math.round(b.rx / 9)
  return (
    <g>
      {/* العمود تحت الحوض */}
      <rect
        x={CX - b.stem / 2}
        y={bottom - 4}
        width={b.stem}
        height={(b.id === 'top' ? bowls[1].cy : BASIN.cy) - bottom + 4}
        fill={`url(#${g('stone')})`}
        stroke="var(--color-olive)"
        strokeWidth="1.2"
      />
      <ellipse
        cx={CX}
        cy={bottom + 10}
        rx={b.stem / 2 + 5}
        ry="4"
        fill={`url(#${g('stone')})`}
        stroke="var(--color-olive)"
        strokeWidth="1.2"
      />
      <path
        d={`M${CX - b.rx},${b.cy} A${b.rx},${b.ry} 0 0 0 ${CX + b.rx},${b.cy} C${CX + b.rx - 6},${b.cy + b.depth} ${CX + b.stem},${bottom} ${CX},${bottom} C${CX - b.stem},${bottom} ${CX - b.rx + 6},${b.cy + b.depth} ${CX - b.rx},${b.cy} Z`}
        fill={`url(#${g('stone')})`}
        stroke="var(--color-olive)"
        strokeWidth="1.2"
      />
      {Array.from({ length: flutes * 2 - 1 }, (_, i) => {
        const t = -1 + (i + 1) / flutes
        const x = CX + t * (b.rx - 6)
        return (
          <line
            key={i}
            x1={x}
            y1={arcY(b.cy, b.rx, b.ry, x) + 2}
            x2={CX + t * b.stem * 1.6}
            y2={bottom - 3}
            stroke="var(--color-sand-deep)"
            strokeWidth="1"
          />
        )
      })}
      {/* الحافة الحجرية */}
      <ellipse cx={CX} cy={b.cy} rx={b.rx} ry={b.ry} fill="none" stroke={`url(#${g('stone')})`} strokeWidth="5" />
      <ellipse
        cx={CX}
        cy={b.cy}
        rx={b.rx + 2.5}
        ry={b.ry + 2.5}
        fill="none"
        stroke="var(--color-olive)"
        strokeWidth="1"
      />
    </g>
  )
}

export function ChocolateFountain({ className = '' }: { className?: string }) {
  const uid = useId().replace(/:/g, '')
  const reduce = useReducedMotion()
  const g = (name: string) => `${name}-${uid}`
  const ctx: Ctx = { g, reduce: !!reduce }

  return (
    <motion.svg
      viewBox="0 40 400 460"
      role="img"
      aria-label="نافورة شوكولا عتيقة بتنزل منها الشوكولا"
      className={className}
      initial={reduce ? false : { opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
    >
      <defs>
        <radialGradient id={g('pool')} cx="0.42" cy="0.3" r="0.75">
          <stop offset="0" stopColor="var(--color-milk)" />
          <stop offset="1" stopColor="var(--color-cocoa-deep)" />
        </radialGradient>
        <linearGradient id={g('stone')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="var(--color-sand-deep)" />
          <stop offset="0.35" stopColor="var(--color-cream)" />
          <stop offset="1" stopColor="var(--color-sand-deep)" />
        </linearGradient>
      </defs>

      {/* ظل الأرضية */}
      <ellipse cx={CX} cy="486" rx="140" ry="8" fill="var(--color-cocoa-deep)" opacity="0.15" />

      {/* القاعدة */}
      <path
        d="M146,450 L254,450 L266,482 L134,482 Z"
        fill={`url(#${g('stone')})`}
        stroke="var(--color-olive)"
        strokeWidth="1.5"
      />
      {[160, 180, 200, 220, 240].map((x) => (
        <line
          key={x}
          x1={x}
          y1="456"
          x2={x + (x - CX) * 0.1}
          y2="478"
          stroke="var(--color-sand-deep)"
          strokeWidth="1"
        />
      ))}

      {/* الحوض الكبير: الجدار الداخلي والبركة */}
      <ellipse
        cx={CX}
        cy={BASIN.cy}
        rx={BASIN.rx}
        ry={BASIN.ry}
        fill="var(--color-sand-deep)"
        stroke="var(--color-olive)"
        strokeWidth="1.5"
      />
      <ellipse cx={CX} cy={BASIN.cy + 2} rx={BASIN.rx - 9} ry={BASIN.ry - 6} fill={`url(#${g('pool')})`} />
      {[0, 1, 2].map((i) => (
        <ellipse
          key={i}
          className="fountain-ripple"
          style={{ animationDelay: `${i}s` }}
          cx={CX}
          cy={BASIN.cy + 10}
          rx="140"
          ry="13"
          fill="none"
          stroke="var(--color-caramel)"
          strokeOpacity="0.6"
        />
      ))}

      {/* الحوض الوسط والعلوي (من تحت لفوق) */}
      <BowlBody ctx={ctx} b={bowls[1]} />
      <ChocolateRim ctx={ctx} b={bowls[1]} delay={1.2} />
      {[0, 1].map((i) => (
        <ellipse
          key={i}
          className="fountain-ripple"
          style={{ animationDelay: `${0.4 + i * 1.5}s` }}
          cx={CX}
          cy={bowls[1].cy + 6}
          rx="80"
          ry="7"
          fill="none"
          stroke="var(--color-caramel)"
          strokeOpacity="0.7"
        />
      ))}

      <BowlBody ctx={ctx} b={bowls[0]} />
      <ChocolateRim ctx={ctx} b={bowls[0]} delay={0.6} />

      {/* خيوط الشوكولا */}
      {topStreams.map((s, i) => (
        <Stream ctx={ctx} key={`t${i}`} d={s.d} width={5} delay={0.9 + i * 0.05} i={i} />
      ))}
      {midStreams.map((s, i) => (
        <Stream ctx={ctx} key={`m${i}`} d={s.d} width={6.5} delay={1.5 + i * 0.05} i={i + 3} />
      ))}

      {/* التاج: كرة الشوكولا اللي بتغلي فوق */}
      <rect
        x={CX - 5}
        y="120"
        width="10"
        height="46"
        fill={`url(#${g('stone')})`}
        stroke="var(--color-olive)"
        strokeWidth="1.2"
      />
      <g className="fountain-bubble">
        <circle cx={CX} cy="110" r="15" fill={`url(#${g('pool')})`} />
        <ellipse cx={CX - 5} cy="104" rx="4.5" ry="2.5" fill="#fff" opacity="0.35" />
      </g>
      {[-1, 1].map((side) => (
        <Stream
          ctx={ctx}
          key={side}
          d={`M${CX + side * 9},${121} C${CX + side * 14},${135} ${CX + side * 16},${150} ${CX + side * 18},${174}`}
          width={4}
          delay={0.4}
          i={side + 2}
        />
      ))}
      <path
        d="M193,96 Q200,84 207,96"
        fill="none"
        stroke="var(--color-olive)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx={CX} cy="82" r="3" fill="var(--color-olive)" />

      {/* جدار الحوض الأمامي — مضلّع متل حافة الصواني */}
      <path
        d={`M${CX - BASIN.rx},${BASIN.cy} A${BASIN.rx},${BASIN.ry} 0 0 0 ${CX + BASIN.rx},${BASIN.cy} L345,442 Q${CX},466 55,442 Z`}
        fill={`url(#${g('stone')})`}
        stroke="var(--color-olive)"
        strokeWidth="1.5"
      />
      {Array.from({ length: 15 }, (_, i) => 62 + i * 20).map((x) => (
        <line
          key={x}
          x1={x}
          y1={arcY(BASIN.cy, BASIN.rx, BASIN.ry, x) + 4}
          x2={x - (x - CX) * 0.05}
          y2={442 + 14 * (1 - ((x - CX) / 150) ** 2)}
          stroke="var(--color-sand-deep)"
          strokeWidth="1.2"
        />
      ))}

      {/* شوكولا فايضة عن حافة الحوض */}
      <path
        d={`M${CX - BASIN.rx},${BASIN.cy} A${BASIN.rx},${BASIN.ry} 0 0 0 ${CX + BASIN.rx},${BASIN.cy}`}
        fill="none"
        stroke="var(--color-cocoa)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      {basinDrips.map((d) => {
        const y = arcY(BASIN.cy, BASIN.rx, BASIN.ry, d.x)
        return (
          <g key={d.x}>
            <path
              className="fountain-wobble"
              style={{ animationDelay: d.delay }}
              d={`M${d.x - 6},${y - 1} Q${d.x - 5},${y + d.len} ${d.x},${y + d.len + 4} Q${d.x + 5},${y + d.len} ${d.x + 6},${y - 1} Z`}
              fill="var(--color-cocoa)"
            />
            {d.fall && (
              <ellipse
                className="fountain-drip"
                style={{ animationDelay: d.delay, ['--drip-distance' as string]: '40px' }}
                cx={d.x}
                cy={y + d.len + 8}
                rx="2.6"
                ry="3.6"
                fill="var(--color-cocoa)"
              />
            )}
          </g>
        )
      })}
    </motion.svg>
  )
}
