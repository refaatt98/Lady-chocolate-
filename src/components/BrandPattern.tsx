/** نقشة ورق التغليف: "الليدي" و "Lady Chocolate" متكررين — للخلفيات */
export function BrandPattern({ className = '' }: { className?: string }) {
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <div className="absolute -inset-[20%] flex -rotate-12 flex-wrap content-start gap-x-16 gap-y-10">
        {Array.from({ length: 80 }, (_, i) =>
          i % 2 === 0 ? (
            <span key={i} className="font-display text-4xl leading-none">
              {i % 4 === 0 ? 'الليدي' : 'شوكولات'}
            </span>
          ) : (
            <span key={i} dir="ltr" className="font-latin pt-3 text-sm tracking-[0.3em]">
              Lady Chocolate
            </span>
          ),
        )}
      </div>
    </div>
  )
}
