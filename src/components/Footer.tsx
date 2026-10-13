import { Clock, MapPin, MessageCircle, Phone } from 'lucide-react'
import { Link } from 'react-router'
import { whatsappLink } from '../lib/format'
import { useSite } from '../lib/site-context'
import { Logo } from './Logo'

export function Footer() {
  const site = useSite()

  return (
    <footer className="relative overflow-hidden bg-olive-deep text-sand">
      {/* الكاليغرافي المفرّغ متل الهوية */}
      <div aria-hidden className="absolute inset-y-0 -left-10 flex items-center text-sand/15">
        <span className="calligraphy-outline block rotate-90 text-[11rem] whitespace-nowrap md:text-[16rem]">
          شوكولات
        </span>
      </div>

      <div className="relative mx-auto grid max-w-6xl gap-12 px-4 pt-16 pb-10 sm:px-6 md:grid-cols-[1.3fr_1fr_1fr]">
        <div className="flex flex-col items-start gap-5">
          <Logo variant="light" size="lg" />
          <p className="max-w-xs leading-loose text-sand/80">
            شوكولا بلجيكية بتنعمل باليد، بتترتب بحب، وبتنكتب عليها أساميكم. هدايا بتضل بالذاكرة.
          </p>
        </div>

        <div>
          <h2 className="font-display mb-4 text-2xl text-cream">روابط</h2>
          <ul className="space-y-2.5 text-sand/80">
            <li>
              <Link to="/" className="transition hover:text-cream">الرئيسية</Link>
            </li>
            <li>
              <Link to="/shop" className="transition hover:text-cream">التشكيلة</Link>
            </li>
            <li>
              <Link to="/#categories" className="transition hover:text-cream">الأقسام</Link>
            </li>
            <li>
              <Link to="/#how-to-order" className="transition hover:text-cream">كيف تطلب</Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="font-display mb-4 text-2xl text-cream">تواصل معنا</h2>
          {site && (
            <ul className="space-y-3 text-sand/80">
              <li>
                <a
                  href={whatsappLink(site.whatsapp, 'مرحبا الليدي شوكولات 🍫')}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2.5 transition hover:text-cream"
                >
                  <MessageCircle className="size-4 shrink-0" aria-hidden />
                  واتساب
                </a>
              </li>
              <li>
                <a href={`tel:${site.whatsapp}`} className="inline-flex items-center gap-2.5 transition hover:text-cream">
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

      <div className="relative border-t border-sand/15">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-sand/60 sm:flex-row sm:px-6">
          <p>© {new Date().getFullYear()} الليدي شوكولات. كل الحقوق محفوظة.</p>
          <p dir="ltr" className="font-latin tracking-[0.25em]">
            BELGIAN CHOCOLATE
          </p>
        </div>
      </div>
    </footer>
  )
}
