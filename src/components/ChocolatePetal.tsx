import { useId } from 'react'

/** بتلة شوكولا مضلّعة — نفس شكل القطع اللي بالصواني */
export const PETAL_PATH = 'M20,0 C30,22 40,55 34,80 C30,96 10,96 6,80 C0,55 10,22 20,0 Z'
export const PETAL_RIDGES = ['M20,5 C25,35 28,62 25,90', 'M20,5 C15,35 12,62 15,90', 'M20,5 L20,93']

export function ChocolatePetal({ className = '', tone = 'milk' }: { className?: string; tone?: 'milk' | 'dark' }) {
  const id = useId().replace(/:/g, '')
  const [a, b] = tone === 'milk' ? ['var(--color-caramel)', 'var(--color-cocoa)'] : ['var(--color-milk)', 'var(--color-cocoa-deep)']
  return (
    <svg viewBox="-2 -2 44 100" aria-hidden className={className}>
      <defs>
        <linearGradient id={`p${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={a} />
          <stop offset="1" stopColor={b} />
        </linearGradient>
      </defs>
      <path d={PETAL_PATH} fill={`url(#p${id})`} />
      {PETAL_RIDGES.map((d) => (
        <path key={d} d={d} fill="none" stroke="#000" strokeOpacity="0.18" strokeWidth="1.2" />
      ))}
      <path d="M14,20 C10,40 9,60 11,78" fill="none" stroke="#fff" strokeOpacity="0.28" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}
