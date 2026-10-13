import { Link } from 'react-router'

interface LogoProps {
  variant?: 'dark' | 'light'
  size?: 'sm' | 'lg'
  className?: string
}

/**
 * لوغو مبني بالخطوط لحد ما يوصل ملف SVG الأصلي.
 * لما يوصل: حط الملف بـ public/ وبدّل محتوى هالمكوّن بـ <img>.
 */
export function Logo({ variant = 'dark', size = 'sm', className = '' }: LogoProps) {
  const main = variant === 'dark' ? 'text-olive' : 'text-sand'
  const accent = variant === 'dark' ? 'text-cocoa' : 'text-cream/80'
  const latin = variant === 'dark' ? 'text-cocoa/80' : 'text-sand/80'
  const big = size === 'lg'

  return (
    <Link to="/" aria-label="الليدي شوكولات — الرئيسية" className={`inline-flex flex-col items-center leading-none ${className}`}>
      <span className="relative inline-block">
        <span className={`font-display font-bold ${main} ${big ? 'text-6xl' : 'text-3xl'}`}>الليدي</span>
        <span
          className={`font-display absolute ${accent} ${big ? '-top-3 -left-12 text-2xl' : '-top-1.5 -left-6 text-sm'}`}
        >
          شوكولات
        </span>
      </span>
      <span
        dir="ltr"
        className={`font-latin font-light ${latin} ${big ? 'mt-2 text-base tracking-[0.35em]' : 'mt-1 text-[0.6rem] tracking-[0.3em]'}`}
      >
        Lady Chocolate
      </span>
    </Link>
  )
}
