import { useEffect } from 'react'
import { useLocation } from 'react-router'

/** يرجع لأول الصفحة عند تغيير المسار (إلا إذا في #anchor) */
export function ScrollToTop() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) {
      document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' })
    } else {
      window.scrollTo({ top: 0 })
    }
  }, [pathname, hash])

  return null
}
