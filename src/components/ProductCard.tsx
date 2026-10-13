import { ArrowLeft } from 'lucide-react'
import { motion } from 'motion/react'
import { Link } from 'react-router'
import { formatPrice } from '../lib/format'
import type { Product } from '../types'

/**
 * كرت منتج: الصورة جوّا قوس عتيق، والسعر على كرت معلق بخيط
 * بيتمرجح لما تمرق عليه.
 */
export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ delay: index * 0.12, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="group"
    >
      <Link to={`/product/${product.slug}`} className="block focus-visible:outline-none">
        <div className="relative">
          {/* القوس */}
          <div className="vintage-frame overflow-hidden rounded-t-[999px] rounded-b-2xl bg-cream">
            <div className="aspect-[4/5] overflow-hidden rounded-t-[999px] rounded-b-2xl">
              <img
                src={product.images[0]}
                alt={product.name}
                loading="lazy"
                className="size-full object-cover object-[center_62%] transition-transform duration-[1.2s] ease-[var(--ease-soft)] group-hover:scale-110"
              />
            </div>
            {/* تظليل خفيف من تحت */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 rounded-b-2xl bg-gradient-to-t from-cocoa-deep/35 to-transparent" />
          </div>

          {product.badge && (
            <span className="absolute top-[18%] right-0 translate-x-2 bg-olive px-3 py-1 text-xs text-cream shadow-md before:absolute before:top-full before:right-0 before:border-t-[6px] before:border-r-[8px] before:border-t-olive-deep before:border-r-transparent before:content-['']">
              {product.badge}
            </span>
          )}

          {/* كرت السعر المعلق */}
          <div className="absolute -bottom-7 left-5 flex origin-top flex-col items-center transition-transform duration-700 ease-[var(--ease-soft)] group-hover:-rotate-12 group-focus-visible:-rotate-12">
            <span aria-hidden className="h-6 w-px bg-caramel" />
            <span className="relative grid size-[4.75rem] place-items-center rounded-full bg-parchment text-center shadow-[0_8px_20px_-8px_rgb(62_36_29/0.55)] ring-1 ring-sand-deep">
              <span aria-hidden className="absolute top-1.5 size-2 rounded-full border border-sand-deep" />
              <span className="mt-1.5 text-[0.65rem] leading-none text-cocoa/70">من</span>
              <span className="text-sm leading-none font-semibold text-cocoa">{formatPrice(product.price)}</span>
            </span>
          </div>
        </div>

        <div className="mt-10 px-1">
          <h3 className="font-display text-2xl text-olive transition-colors group-hover:text-cocoa sm:text-[1.7rem]">
            {product.name}
          </h3>
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-cocoa-deep/70">{product.shortDescription}</p>
          <span className="mt-4 inline-flex items-center gap-2 text-sm text-cocoa">
            شوف التفاصيل
            <ArrowLeft className="size-4 transition-transform duration-300 group-hover:-translate-x-1.5" aria-hidden />
          </span>
        </div>
      </Link>
    </motion.article>
  )
}
