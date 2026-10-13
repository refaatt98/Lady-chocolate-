import { Menu, MessageCircle, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router'
import { whatsappLink } from '../lib/format'
import { useSite } from '../lib/site-context'
import { Logo } from './Logo'

const links = [
  { to: '/', label: 'الرئيسية' },
  { to: '/shop', label: 'التشكيلة' },
  { to: '/#categories', label: 'الأقسام' },
  { to: '/#how-to-order', label: 'كيف تطلب' },
]

export function Header() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const site = useSite()
  const location = useLocation()

  useEffect(() => setOpen(false), [location])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const orderHref = site ? whatsappLink(site.whatsapp, 'مرحبا، حابب أطلب من الليدي شوكولات 🍫') : undefined

  return (
    <header
      className={`sticky top-0 z-40 transition-[background-color,box-shadow] duration-500 ${
        scrolled ? 'bg-parchment/90 shadow-[0_1px_0_var(--color-sand)] backdrop-blur-md' : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />

        <nav aria-label="القائمة الرئيسية" className="hidden md:block">
          <ul className="flex items-center gap-8">
            {links.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  end
                  className={({ isActive }) =>
                    `group relative py-2 text-[0.95rem] transition-colors hover:text-olive ${
                      isActive && !link.to.includes('#') ? 'text-olive' : 'text-cocoa-deep/80'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {link.label}
                      <span
                        className={`absolute inset-x-0 -bottom-0.5 mx-auto h-px bg-olive transition-all duration-300 ${
                          isActive && !link.to.includes('#') ? 'w-full' : 'w-0 group-hover:w-full'
                        }`}
                      />
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={orderHref}
            target="_blank"
            rel="noreferrer"
            className="hidden items-center gap-2 rounded-full bg-olive px-5 py-2.5 text-sm text-cream transition hover:bg-olive-deep sm:inline-flex"
          >
            <MessageCircle className="size-4" aria-hidden />
            اطلب واتساب
          </a>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'إغلاق القائمة' : 'فتح القائمة'}
            className="grid size-11 place-items-center rounded-full border border-sand-deep/60 text-olive md:hidden"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            id="mobile-menu"
            aria-label="القائمة"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-sand/60 bg-parchment md:hidden"
          >
            <ul className="flex flex-col px-4 py-4">
              {links.map((link, i) => (
                <motion.li
                  key={link.to}
                  initial={{ x: 16, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.05 * i }}
                >
                  <NavLink
                    to={link.to}
                    end
                    className="font-display block border-b border-sand/50 py-3.5 text-2xl text-olive"
                  >
                    {link.label}
                  </NavLink>
                </motion.li>
              ))}
            </ul>
            <div className="px-4 pb-6">
              <a
                href={orderHref}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 rounded-full bg-olive py-3.5 text-cream"
              >
                <MessageCircle className="size-5" aria-hidden />
                اطلب عن طريق واتساب
              </a>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  )
}
