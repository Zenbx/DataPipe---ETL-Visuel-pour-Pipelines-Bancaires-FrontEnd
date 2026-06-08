'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { fr, type TranslationKey } from './locales/fr'
import { en } from './locales/en'

export type Locale = 'fr' | 'en'
export const LOCALES: { value: Locale; label: string }[] = [
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'English' },
]

const DICTS: Record<Locale, Record<TranslationKey, string>> = { fr, en }
const STORAGE_KEY = 'datapipe-locale'

type Vars = Record<string, string | number>

interface I18nContextValue {
  locale: Locale
  setLocale: (l: Locale) => void
  /** Traduit une clé ; interpole `{var}` ; retombe sur FR puis sur la clé. */
  t: (key: TranslationKey, vars?: Vars) => string
}

const I18nContext = createContext<I18nContextValue>({
  locale: 'fr',
  setLocale: () => {},
  t: (key) => fr[key] ?? key,
})

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('fr')

  // Restaure la langue stockée (après hydratation pour éviter un mismatch SSR).
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Locale | null
      if (stored && (stored === 'fr' || stored === 'en')) {
        setLocaleState(stored)
        document.documentElement.lang = stored
      }
    } catch { /* ignore */ }
  }, [])

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    try { localStorage.setItem(STORAGE_KEY, l) } catch { /* ignore */ }
    if (typeof document !== 'undefined') document.documentElement.lang = l
  }, [])

  const t = useCallback((key: TranslationKey, vars?: Vars) => {
    let s = DICTS[locale]?.[key] ?? fr[key] ?? key
    if (vars) for (const k of Object.keys(vars)) s = s.replace(`{${k}}`, String(vars[k]))
    return s
  }, [locale])

  return <I18nContext.Provider value={{ locale, setLocale, t }}>{children}</I18nContext.Provider>
}

export function useTranslation() {
  return useContext(I18nContext)
}
