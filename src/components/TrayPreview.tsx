import { AnimatePresence, motion } from 'motion/react'
import type { TrayPreviewSpec } from '../types'

interface TrayPreviewProps {
  spec: TrayPreviewSpec
  top?: string
  main: string
  bottom?: string
  alt: string
  className?: string
}

/**
 * صورة صينية حقيقية، وفوق قرصها بنكتب النص اللي بيكتبه الزبون — مباشرة وهو بيكتب.
 * الخطوط بـ cqw عشان تكبر وتصغر مع حجم الصورة.
 */
export function TrayPreview({ spec, top, main, bottom, alt, className = '' }: TrayPreviewProps) {
  const { disc, coverTo } = spec
  const shown = main.trim() || 'اسمك هون'
  // كل ما طال الاسم، بيصغر الخط عشان يضل جوّا القرص
  const mainSize = Math.max(2.6, 6.4 - shown.length * 0.2)
  const background = coverTo
    ? `linear-gradient(to bottom, #f3eedf 0%, #f1ecdc ${coverTo - 6}%, rgb(241 236 220 / 0) ${coverTo + 4}%)`
    : 'radial-gradient(circle at 40% 35%, #fdfbf7, #ece6dc)'

  return (
    <div className={`relative overflow-hidden [container-type:inline-size] ${className}`}>
      <img src={spec.image} alt={alt} className="aspect-square w-full object-cover" />
      <div
        className={`absolute grid rounded-[50%] text-center ${coverTo ? 'place-items-start justify-items-center' : 'place-items-center shadow-[inset_0_-2px_6px_rgb(0_0_0/0.12),0_1px_2px_rgb(0_0_0/0.25)]'}`}
        style={{
          left: `${disc.cx - disc.w / 2}%`,
          top: `${disc.cy - disc.h / 2}%`,
          width: `${disc.w}%`,
          height: `${disc.h}%`,
          background,
        }}
      >
        <div className={`flex flex-col items-center px-[8%] ${coverTo ? 'pt-[10%]' : ''}`}>
          {top !== undefined && <span className="max-w-full truncate text-[1.7cqw] leading-tight text-olive">{top || ' '}</span>}
          <AnimatePresence mode="popLayout">
            <motion.span
              key={shown}
              initial={{ opacity: 0, y: 4, filter: 'blur(3px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25 }}
              className={`font-display block leading-[1.25] ${coverTo ? 'text-olive' : 'text-cocoa-deep'}`}
              style={{ fontSize: `${mainSize}cqw` }}
            >
              {shown}
            </motion.span>
          </AnimatePresence>
          {bottom && (
            <span dir="ltr" className="font-latin text-[2.2cqw] leading-none text-cocoa-deep/80">
              {bottom}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
