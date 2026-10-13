import { Check, Loader2, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import React, { createContext, useCallback, useContext, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react'

/* أدوات صغيرة مشتركة للوحة التحكم — بسيطة وواضحة، بنفس ألوان الموقع */

export const inputCls =
  'w-full rounded-xl border border-sand-deep/60 bg-parchment px-3.5 py-2.5 text-cocoa-deep placeholder:text-cocoa/35 transition focus:border-olive focus:outline-none focus:ring-2 focus:ring-olive/15'

export function Field({ label, hint, error, children, className = '' }: { label: string; hint?: string; error?: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-sm font-medium text-cocoa-deep/80">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-xs text-cocoa">● {error}</span> : hint && <span className="mt-1 block text-xs text-cocoa/55">{hint}</span>}
    </label>
  )
}

export const TextInput = (props: InputHTMLAttributes<HTMLInputElement>) => <input {...props} className={`${inputCls} ${props.className ?? ''}`} />

export const TextArea = (props: TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea rows={3} {...props} className={`${inputCls} resize-y leading-relaxed ${props.className ?? ''}`} />
)

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
const variants: Record<ButtonVariant, string> = {
  primary: 'bg-olive text-parchment hover:bg-olive-deep',
  secondary: 'border border-sand-deep/70 bg-parchment text-cocoa-deep hover:border-olive hover:text-olive',
  ghost: 'text-cocoa/80 hover:bg-sand/40 hover:text-cocoa-deep',
  danger: 'border border-cocoa/30 text-cocoa hover:bg-cocoa hover:text-parchment',
}

export function Button({ variant = 'primary', loading, children, className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; loading?: boolean }) {
  return (
    <button
      type="button"
      {...props}
      disabled={props.disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
    >
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  )
}

export function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="flex items-center gap-3 text-right">
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? 'bg-olive' : 'bg-sand-deep/60'}`}>
        <motion.span layout transition={{ type: 'spring', stiffness: 500, damping: 30 }} className={`absolute top-0.5 size-5 rounded-full bg-parchment shadow ${checked ? 'left-0.5' : 'right-0.5'}`} />
      </span>
      <span>
        <span className="block text-sm text-cocoa-deep">{label}</span>
        {hint && <span className="block text-xs text-cocoa/55">{hint}</span>}
      </span>
    </button>
  )
}

export function Card({ title, description, action, children, className = '' }: { title?: string; description?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-sand-deep/40 bg-parchment/80 p-5 shadow-[0_10px_30px_-25px_rgb(92_59_47/0.5)] sm:p-6 ${className}`}>
      {(title || action) && (
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            {title && <h2 className="font-display text-2xl text-olive">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-cocoa/60">{description}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

/** حقل كلمات (مكونات، مدن...): اكتب واكبس Enter */
export function TagInput({ value, onChange, placeholder }: { value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [draft, setDraft] = useState('')
  const add = () => {
    const parts = draft.split(/[,،\n]/).map((s) => s.trim()).filter(Boolean)
    if (parts.length) onChange([...value, ...parts.filter((p) => !value.includes(p))])
    setDraft('')
  }
  return (
    <div className={`${inputCls} flex flex-wrap items-center gap-1.5 py-2`}>
      {value.map((tag) => (
        <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-sand/60 py-1 ps-3 pe-1.5 text-sm">
          {tag}
          <button type="button" aria-label={`احذف ${tag}`} onClick={() => onChange(value.filter((t) => t !== tag))} className="grid size-5 place-items-center rounded-full hover:bg-sand-deep/50">
            <X className="size-3" />
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault()
            add()
          } else if (e.key === 'Backspace' && !draft && value.length) onChange(value.slice(0, -1))
        }}
        onBlur={add}
        placeholder={value.length ? '' : placeholder}
        className="min-w-24 flex-1 bg-transparent py-1 focus:outline-none"
      />
    </div>
  )
}

/* ---------------- تنبيهات صغيرة ---------------- */

interface Toast {
  id: number
  text: string
  kind: 'ok' | 'error'
}
const ToastContext = createContext<(text: string, kind?: Toast['kind']) => void>(() => {})

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const push = useCallback((text: string, kind: Toast['kind'] = 'ok') => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, text, kind }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), kind === 'error' ? 6000 : 2800)
  }, [])
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10 }}
              className={`pointer-events-auto flex max-w-md items-center gap-2 rounded-full px-5 py-3 text-sm shadow-xl ${t.kind === 'ok' ? 'bg-olive text-parchment' : 'bg-cocoa text-parchment'}`}
              role="status"
            >
              {t.kind === 'ok' ? <Check className="size-4 shrink-0" /> : <X className="size-4 shrink-0" />}
              {t.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)

/** رسالة غلط مفهومة من أي exception */
export const errorText = (e: unknown) => {
  const msg = e instanceof Error ? e.message : String(e)
  if (msg.includes('duplicate key') && msg.includes('slug')) return 'الرابط (slug) مستعمل لمنتج أو قسم ثاني — غيّره'
  if (msg.includes('violates foreign key')) return 'ما بنقدر نحذفه لأنه في إشي مرتبط فيه'
  if (msg.includes('row-level security')) return 'ما عندك صلاحية — لازم تكون أدمن'
  if (msg.toLowerCase().includes('failed to fetch')) return 'في مشكلة بالإنترنت — جرّب كمان مرة'
  return msg
}

/** نص إنجليزي → رابط (slug). العربي بيطلع فاضي، فمنستعمل احتياط */
export const slugify = (text: string, fallback = 'item') =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || `${fallback}-${Date.now().toString(36).slice(-5)}`

/* ---------------- عناصر التصميم الجديد ---------------- */

/** رأس الصفحة: أيقونة، عنوان، وصف، وأزرار */
export function PageHeader({
  icon: Icon,
  title,
  description,
  actions,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <span className="relative grid size-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-olive to-olive-deep text-parchment shadow-[0_12px_24px_-12px_rgb(98_106_70/0.9)]">
          <Icon className="size-6" />
          <span aria-hidden className="absolute -bottom-1 -left-1 size-4 rounded-full border-2 border-parchment bg-caramel" />
        </span>
        <div>
          <h1 className="font-display text-4xl leading-tight text-olive">{title}</h1>
          {description && <p className="mt-0.5 text-sm text-cocoa/60">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

/** بطاقة رقم (للنظرة العامة) */
export function StatCard({ label, value, hint, icon: Icon, tone = 'olive' }: { label: string; value: ReactNode; hint?: string; icon: React.ComponentType<{ className?: string }>; tone?: 'olive' | 'cocoa' | 'caramel' | 'sage' }) {
  const tones = {
    olive: 'from-olive/15 to-olive/5 text-olive',
    cocoa: 'from-cocoa/15 to-cocoa/5 text-cocoa',
    caramel: 'from-caramel/25 to-caramel/5 text-cocoa',
    sage: 'from-olive-soft/25 to-olive-soft/5 text-olive-deep',
  }
  return (
    <div className="relative overflow-hidden rounded-2xl border border-sand-deep/40 bg-parchment p-5">
      <div aria-hidden className={`absolute -top-10 -left-10 size-32 rounded-full bg-gradient-to-br ${tones[tone]} blur-xl`} />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-cocoa/60">{label}</p>
          <p className="font-latin mt-3 text-3xl leading-none font-semibold text-cocoa-deep tabular-nums">{value}</p>
          {hint && <p className="mt-2 text-xs text-cocoa/50">{hint}</p>}
        </div>
        <span className={`grid size-10 place-items-center rounded-xl bg-gradient-to-br ${tones[tone]}`}>
          <Icon className="size-5" />
        </span>
      </div>
    </div>
  )
}

/** حالة فاضية بشكل لطيف */
export function EmptyState({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-3xl border-2 border-dashed border-sand-deep/50 bg-parchment/40 px-6 py-16 text-center">
      <svg viewBox="0 0 40 96" aria-hidden className="h-14 w-6 text-sand-deep">
        <path d="M20,0 C30,22 40,55 34,80 C30,96 10,96 6,80 C0,55 10,22 20,0 Z" fill="currentColor" opacity="0.5" />
      </svg>
      <p className="font-display mt-4 text-3xl text-olive">{title}</p>
      {text && <p className="mt-2 max-w-sm text-sm text-cocoa/60">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

/** نافذة جانبية (درج) للتعديل */
export function Drawer({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 z-[80] bg-cocoa-deep/30 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="fixed inset-y-0 left-0 z-[81] flex w-full max-w-lg flex-col bg-parchment shadow-2xl"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 32 }}
          >
            <header className="flex items-center justify-between border-b border-sand px-6 py-4">
              <h2 className="font-display text-3xl text-olive">{title}</h2>
              <button type="button" onClick={onClose} aria-label="إغلاق" className="grid size-10 place-items-center rounded-full hover:bg-sand/50">
                <X className="size-5" />
              </button>
            </header>
            <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
            {footer && <footer className="border-t border-sand bg-cream/50 px-6 py-4">{footer}</footer>}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

/** لون: دواير جاهزة من الهوية + لون حر */
export const brandSwatches = ['#626a46', '#878f69', '#7a5244', '#9c7262', '#5a3d33', '#b8977a', '#cec4b0', '#e7e0d1', '#c9a227', '#8b9a7a', '#a0522d', '#d8b4a0']

export function ColorPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {brandSwatches.map((c) => (
          <button
            key={c}
            type="button"
            aria-label={c}
            onClick={() => onChange(c)}
            className={`size-9 rounded-full ring-1 ring-black/10 transition hover:scale-110 ${value.toLowerCase() === c ? 'ring-4 ring-olive/40 ring-offset-2 ring-offset-parchment' : ''}`}
            style={{ background: c }}
          />
        ))}
      </div>
      <div className="flex items-center gap-3">
        <label className="relative size-11 shrink-0 cursor-pointer overflow-hidden rounded-xl ring-1 ring-sand-deep/60" style={{ background: value }}>
          <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 size-full cursor-pointer opacity-0" aria-label="لون حر" />
        </label>
        <TextInput dir="ltr" value={value} onChange={(e) => /^#?[0-9a-fA-F]{0,6}$/.test(e.target.value) && onChange(e.target.value.startsWith('#') ? e.target.value : `#${e.target.value}`)} className="font-latin max-w-32 uppercase" />
        <span className="text-xs text-cocoa/55">أي لون بدك</span>
      </div>
    </div>
  )
}

/** شارة صغيرة */
export function Pill({ children, tone = 'sand' }: { children: ReactNode; tone?: 'sand' | 'olive' | 'cocoa' | 'caramel' }) {
  const tones = { sand: 'bg-sand/70 text-cocoa-deep/80', olive: 'bg-olive/12 text-olive', cocoa: 'bg-cocoa/10 text-cocoa', caramel: 'bg-caramel/25 text-cocoa' }
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs ${tones[tone]}`}>{children}</span>
}
