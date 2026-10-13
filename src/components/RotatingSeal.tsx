import { useId } from 'react'

/** ختم دائري بيلف بهدوء — نص على مسار دائري */
export function RotatingSeal({ className = '', text = 'شوكولا بلجيكية ✦ معمولة باليد ✦ بأساميكم ✦ ' }) {
  const id = useId().replace(/:/g, '')
  return (
    <div className={`relative grid place-items-center rounded-full bg-cocoa text-cream shadow-[0_15px_35px_-12px_rgb(62_36_29/0.7)] ${className}`}>
      <svg viewBox="0 0 200 200" aria-hidden className="absolute inset-0 size-full animate-[spin_22s_linear_infinite] motion-reduce:animate-none">
        <defs>
          <path id={`c${id}`} d="M100,100 m-74,0 a74,74 0 1,1 148,0 a74,74 0 1,1 -148,0" />
        </defs>
        {/* direction=ltr ضروري: بصفحة RTL المتصفح بيبلش النص من آخر المسار وبيختفي */}
        <text fill="currentColor" fontSize="16" fontFamily="var(--font-sans)" direction="ltr">
          <textPath href={`#c${id}`} textLength="458" lengthAdjust="spacing">
            {text}
          </textPath>
        </text>
      </svg>
      <span className="absolute inset-[22%] rounded-full border border-cream/30" aria-hidden />
      <svg viewBox="0 0 12 16" aria-hidden className="relative w-[14%] fill-caramel">
        <path d="M6 0C3 5 0 8 0 11a6 6 0 0 0 12 0c0-3-3-6-6-11z" />
      </svg>
    </div>
  )
}
