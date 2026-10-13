import { Link } from 'react-router'

/** صفحة مؤقتة للصفحات اللي لسا ما انبنت */
export function ComingSoon({ title, note }: { title: string; note: string }) {
  return (
    <section className="mx-auto flex max-w-xl flex-col items-center px-4 py-28 text-center">
      <h1 className="font-display text-5xl text-olive">{title}</h1>
      <p className="mt-4 leading-loose text-cocoa-deep/70">{note}</p>
      <Link to="/" className="mt-8 rounded-full border border-olive px-6 py-2.5 text-olive transition hover:bg-olive hover:text-cream">
        رجوع للرئيسية
      </Link>
    </section>
  )
}
