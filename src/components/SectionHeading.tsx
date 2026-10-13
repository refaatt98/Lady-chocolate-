import { motion } from 'motion/react'

interface SectionHeadingProps {
  eyebrow: string
  title: string
  description?: string
  tone?: 'dark' | 'light'
}

/** عنوان سكشن: كلمة إنجليزية صغيرة فوق، عنوان بخط الرقعة، وزخرفة نقطة شوكولا */
export function SectionHeading({ eyebrow, title, description, tone = 'dark' }: SectionHeadingProps) {
  const light = tone === 'light'
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto mb-12 max-w-xl text-center"
    >
      <p dir="ltr" className={`font-latin text-xs tracking-[0.4em] uppercase ${light ? 'text-sand/70' : 'text-cocoa/70'}`}>
        {eyebrow}
      </p>
      <h2 className={`font-display mt-3 text-4xl sm:text-5xl ${light ? 'text-cream' : 'text-olive'}`}>{title}</h2>
      <div aria-hidden className="mx-auto mt-4 flex items-center justify-center gap-3">
        <span className={`h-px w-12 ${light ? 'bg-sand/40' : 'bg-sand-deep'}`} />
        <svg viewBox="0 0 12 16" className={`h-4 w-3 ${light ? 'fill-caramel' : 'fill-cocoa'}`}>
          <path d="M6 0C3 5 0 8 0 11a6 6 0 0 0 12 0c0-3-3-6-6-11z" />
        </svg>
        <span className={`h-px w-12 ${light ? 'bg-sand/40' : 'bg-sand-deep'}`} />
      </div>
      {description && (
        <p className={`mt-5 leading-loose ${light ? 'text-sand/80' : 'text-cocoa-deep/70'}`}>{description}</p>
      )}
    </motion.div>
  )
}
