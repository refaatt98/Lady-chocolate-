import { animate, motion, useMotionValue, useTransform } from 'motion/react'
import { useEffect } from 'react'
import { CURRENCY } from '../lib/format'

/** سعر بيعدّ لفوق أو لتحت لما يتغير */
export function AnimatedPrice({ value, className = '' }: { value: number; className?: string }) {
  const mv = useMotionValue(value)
  const text = useTransform(mv, (v) => Math.round(v).toLocaleString('en-US'))

  useEffect(() => {
    const controls = animate(mv, value, { duration: 0.6, ease: [0.22, 1, 0.36, 1] })
    return () => controls.stop()
  }, [mv, value])

  return (
    <span className={className}>
      <motion.span className="tabular-nums">{text}</motion.span> {CURRENCY}
    </span>
  )
}
