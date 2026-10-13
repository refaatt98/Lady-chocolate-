import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'

const KEY = 'lady-preloader-seen'

const seenBefore = () => {
  try {
    return sessionStorage.getItem(KEY) === '1' || window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

/**
 * شاشة البداية: كلمة "الليدي" بتتعبى شوكولا من تحت لفوق بموجة،
 * وبعدين الشاشة بتطلع لفوق. بتظهر مرة وحدة بكل زيارة.
 */
export function Preloader() {
  const [show, setShow] = useState(() => !seenBefore())

  useEffect(() => {
    if (!show) return
    let timer: ReturnType<typeof setTimeout>
    // منستنى الخط يحمّل (بحد أقصى ثانية) عشان الكلمة تطلع صح
    const fontsReady = Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1000))])
    fontsReady.then(() => {
      timer = setTimeout(() => {
        setShow(false)
        try {
          sessionStorage.setItem(KEY, '1')
        } catch {
          /* تجاهل */
        }
      }, 2300)
    })
    return () => clearTimeout(timer)
  }, [show])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="preloader"
          className="fixed inset-0 z-[100] grid place-items-center bg-parchment"
          exit={{ y: '-100%', borderBottomLeftRadius: '50% 20%', borderBottomRightRadius: '50% 20%' }}
          transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
          aria-hidden
        >
          <div className="flex flex-col items-center">
            <svg viewBox="0 0 400 200" className="w-72 sm:w-96">
              <defs>
                <clipPath id="pre-text">
                  <text x="200" y="150" textAnchor="middle" fontFamily="Aref Ruqaa" fontWeight="700" fontSize="150">
                    الليدي
                  </text>
                </clipPath>
                <linearGradient id="pre-choc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="var(--color-milk)" />
                  <stop offset="1" stopColor="var(--color-cocoa-deep)" />
                </linearGradient>
              </defs>
              <text x="200" y="150" textAnchor="middle" fontFamily="Aref Ruqaa" fontWeight="700" fontSize="150" fill="none" stroke="var(--color-olive)" strokeWidth="1.2">
                الليدي
              </text>
              <g clipPath="url(#pre-text)">
                <motion.g initial={{ y: 200 }} animate={{ y: 10 }} transition={{ duration: 2.1, ease: [0.45, 0, 0.2, 1] }}>
                  <motion.path
                    d="M-400,20 Q-350,0 -300,20 T-200,20 T-100,20 T0,20 T100,20 T200,20 T300,20 T400,20 T500,20 V260 H-400 Z"
                    fill="url(#pre-choc)"
                    animate={{ x: [0, 200] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                  />
                </motion.g>
              </g>
            </svg>
            <motion.p
              dir="ltr"
              className="font-latin -mt-2 text-xs tracking-[0.5em] text-cocoa/70 uppercase"
              initial={{ opacity: 0, letterSpacing: '0.2em' }}
              animate={{ opacity: 1, letterSpacing: '0.5em' }}
              transition={{ delay: 0.8, duration: 1.2 }}
            >
              Lady Chocolate
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
