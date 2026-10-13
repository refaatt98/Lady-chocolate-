import { createContext, useContext, type ReactNode } from 'react'
import type { SiteInfo } from '../types'
import { getSiteInfo } from './api'
import { useAsync } from './useAsync'

const SiteContext = createContext<SiteInfo | null>(null)

/** بيجيب معلومات المحل مرة وحدة من api.ts وبيوزعها على الموقع */
export function SiteProvider({ children }: { children: ReactNode }) {
  const { data } = useAsync(getSiteInfo)
  return <SiteContext.Provider value={data}>{children}</SiteContext.Provider>
}

export const useSite = () => useContext(SiteContext)
