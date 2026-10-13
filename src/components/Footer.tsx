import { Clock, MapPin, MessageCircle, Phone } from 'lucide-react'
import { Link } from 'react-router'
import { whatsappLink } from '../lib/format'
import { useSite } from '../lib/site-context'
import { Logo } from './Logo'

export function Footer() {
  const site = useSite()

  return (
    <footer className="relative overflow-hidden bg-sage text-cocoa-deep">
      {/* الكاليغرافي المفرّغ متل الهوية */}
      <div aria-hidden className="absolute inset-y-0 -left-10 flex items-center text-olive/10">
        <span className="calligraphy-outline block rotate-90 text-[11rem] whitespace-nowrap md:text-[16rem]">
          شوكولات
        </span>
      </div>

      <div className="relative mx-auto grid max-w-6xl gap-12 px-4 pt-16 pb-10 sm:px-6 md:grid-cols-[1.3fr_1fr_1fr]">
        <div className="flex flex-col items-start gap-5">
          <Logo size="lg" />
          <p className="max-w-xs leading-loose text-cocoa-deep/70">
            شوكولا بلجيكية بتنعمل باليد، بتترتب بحب، وبتنكتب عليها أساميكم. هدايا بتضل بالذاكرة.
          </p>
        </div>

        <div>
          <h2 className="font-display mb-4 text-2xl text-olive">روابط</h2>
          <ul className="space-y-2.5 text-cocoa-deep/70">
            <li>
              <Link to="/" className="transition hover:text-cocoa">الرئيسية</Link>
            </li>
            <li>
              <Link to="/shop" className="transition hover:text-cocoa">التشكيلة</Link>
            </li>
            <li>
              <Link to="/#categories" className="transition hover:text-cocoa">الأقسام</Link>
            </li>
            <li>
              <Link to="/#how-to-order" className="transition hover:text-cocoa">كيف تطلب</Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="font-display mb-4 text-2xl text-olive">تواصل معنا</h2>
          {site && (
            <ul className="space-y-3 text-cocoa-deep/70">
              <li>
                <a
                  href={whatsappLink(site.whatsapp, 'مرحبا الليدي شوكولات 🍫')}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2.5 transition hover:text-cocoa"
                >
                  <MessageCircle className="size-4 shrink-0" aria-hidden />
                  واتساب
                </a>
              </li>
              <li>
                <a href={`tel:${site.whatsapp}`} className="inline-flex items-center gap-2.5 transition hover:text-cocoa">
                  <Phone className="size-4 shrink-0" aria-hidden />
                  <span dir="ltr">{site.phoneDisplay}</span>
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <MapPin className="size-4 shrink-0" aria-hidden />
                {site.address}
              </li>
              <li className="flex items-center gap-2.5">
                <Clock className="size-4 shrink-0" aria-hidden />
                {site.hours}
              </li>
            </ul>
          )}
        </div>
      </div>

      <div className="relative border-t border-sage-deep">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-cocoa/60 sm:flex-row sm:px-6">
          <p>© {new Date().getFullYear()} الليدي شوكولات. كل الحقوق محفوظة.</p>
          <p dir="ltr" className="font-latin tracking-[0.25em]">
            BELGIAN CHOCOLATE
          </p>
        </div>
      </div>
    </footer>
  )
}
