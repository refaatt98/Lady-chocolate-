import { MessageCircle, Sparkles } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { whatsappLink } from '../lib/format'
import { useSite } from '../lib/site-context'
import { BrandPattern } from './BrandPattern'

const occasions = ['عرس', 'خطوبة', 'مولود', 'نجاح', 'عيد ميلاد']

/**
 * "جرّب اسمك": المستخدم بيكتب الاسم والتاريخ، وبينكتبوا مباشرة على قرص الصينية بالصورة.
 * مكان القرص بالصورة المربعة مقاس بالنسبة المئوية (شوف public/images/products/tray-white-names-square.jpg).
 */
const DISC = { cx: 47.7, cy: 48.2, w: 26.4, h: 22.4 }

export function NameOnTray() {
  const site = useSite()
  const [name, setName] = useState('منى ومحمود')
  const [date, setDate] = useState('25.9.26')
  const [occasion, setOccasion] = useState(occasions[0])

  const shown = name.trim() || 'اسمك هون'
  // كل ما طال الاسم، بيصغر الخط عشان يضل جوّا القرص
  const nameSize = Math.max(2.8, 6.4 - shown.length * 0.2)

  const message = `مرحبا الليدي شوكولات 🍫\nحابب أطلب صينية ${occasion}\nالاسم: ${name || '—'}\nالتاريخ: ${date || '—'}`

  return (
    <section className="relative overflow-hidden bg-olive-deep py-20 text-sand md:py-28">
      <BrandPattern className="text-sand/[0.05]" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 md:grid-cols-2 md:gap-16">
        {/* الصورة مع القرص الحي */}
        <motion.div
          initial={{ opacity: 0, rotate: -6, scale: 0.92 }}
          whileInView={{ opacity: 1, rotate: -2, scale: 1 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto w-full max-w-md"
        >
          <div className="rounded-[2.5rem] border border-sand/25 p-3">
            <div className="relative overflow-hidden rounded-[2rem] [container-type:inline-size]">
              <img src="/images/products/tray-white-names-square.jpg" alt="صينية شوكولا عليها الاسم اللي كتبته" className="aspect-square w-full object-cover" />
              <div
                className="absolute grid place-items-center rounded-[50%] text-center shadow-[inset_0_-2px_6px_rgb(0_0_0/0.12),0_1px_2px_rgb(0_0_0/0.25)]"
                style={{
                  left: `${DISC.cx - DISC.w / 2}%`,
                  top: `${DISC.cy - DISC.h / 2}%`,
                  width: `${DISC.w}%`,
                  height: `${DISC.h}%`,
                  background: 'radial-gradient(circle at 40% 35%, #fdfbf7, #ece6dc)',
                }}
              >
                <div className="flex flex-col items-center px-[6%]">
                  <span className="text-[1.8cqw] leading-none text-cocoa/60">{occasion === 'عرس' || occasion === 'خطوبة' ? 'على بركة الله' : 'ألف مبروك'}</span>
                  <AnimatePresence mode="popLayout">
                    <motion.span
                      key={shown}
                      initial={{ opacity: 0, y: 4, filter: 'blur(3px)' }}
                      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.25 }}
                      className="font-display block leading-[1.25] text-cocoa-deep"
                      style={{ fontSize: `${nameSize}cqw` }}
                    >
                      {shown}
                    </motion.span>
                  </AnimatePresence>
                  {date && (
                    <span dir="ltr" className="font-latin text-[2.2cqw] leading-none text-cocoa-deep/80">
                      {date}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          <span className="font-display absolute -top-4 -right-2 rotate-[8deg] rounded-full bg-caramel px-4 py-1.5 text-lg text-cocoa-deep shadow-lg">
            معاينة مباشرة
          </span>
        </motion.div>

        {/* الفورم */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          <p dir="ltr" className="font-latin text-center text-xs tracking-[0.4em] text-sand/60 uppercase md:text-right">
            Make it yours
          </p>
          <h2 className="font-display mt-3 text-center text-4xl leading-snug text-cream sm:text-5xl md:text-right">
            جرّب اسمك
            <br />
            على الصينية
          </h2>
          <p className="mt-4 text-center leading-loose text-sand/75 md:text-right">اكتب، وشوف كيف رح تطلع صينيتك قبل ما تطلبها.</p>

          <div className="mt-8 space-y-6">
            <fieldset>
              <legend className="mb-3 text-sm text-sand/70">المناسبة</legend>
              <div className="flex flex-wrap gap-2">
                {occasions.map((o) => (
                  <button
                    key={o}
                    type="button"
                    aria-pressed={occasion === o}
                    onClick={() => setOccasion(o)}
                    className={`rounded-full border px-4 py-2 text-sm transition ${
                      occasion === o ? 'border-caramel bg-caramel text-cocoa-deep' : 'border-sand/30 text-sand/80 hover:border-sand/60'
                    }`}
                  >
                    {o}
                  </button>
                ))}
              </div>
            </fieldset>

            <label className="block">
              <span className="text-sm text-sand/70">الاسم أو الأسماء</span>
              <input
                value={name}
                maxLength={22}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثلًا: منى ومحمود"
                className="font-display mt-1 w-full border-b border-sand/30 bg-transparent py-2 text-3xl text-cream placeholder:text-sand/30 focus:border-caramel focus:outline-none"
              />
            </label>

            <label className="block">
              <span className="text-sm text-sand/70">التاريخ (اختياري)</span>
              <input
                value={date}
                maxLength={12}
                dir="ltr"
                onChange={(e) => setDate(e.target.value)}
                placeholder="25.9.26"
                className="font-latin mt-1 w-full border-b border-sand/30 bg-transparent py-2 text-right text-2xl text-cream placeholder:text-sand/30 focus:border-caramel focus:outline-none"
              />
            </label>
          </div>

          {site && (
            <a
              href={whatsappLink(site.whatsapp, message)}
              target="_blank"
              rel="noreferrer"
              className="group mt-9 flex w-full items-center justify-center gap-2 rounded-full bg-caramel px-8 py-4 text-cocoa-deep shadow-[0_15px_35px_-15px_rgb(184_135_95/0.9)] transition hover:bg-cream sm:w-auto sm:inline-flex"
            >
              <MessageCircle className="size-5" aria-hidden />
              اطلبها بهالاسم على واتساب
              <Sparkles className="size-4 opacity-70 transition group-hover:rotate-12" aria-hidden />
            </a>
          )}
        </motion.div>
      </div>
    </section>
  )
}
