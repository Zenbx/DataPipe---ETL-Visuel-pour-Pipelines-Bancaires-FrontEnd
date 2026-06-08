'use client'

import { Languages } from 'lucide-react'
import { useTranslation, LOCALES, type Locale } from '@/lib/i18n'
import { cn } from '@/lib/utils'

interface LanguageToggleProps {
  compact?: boolean
  className?: string
}

// Bascule FR ⇄ EN, dans le même style que le toggle de thème.
export function LanguageToggle({ compact = false, className }: LanguageToggleProps) {
  const { locale, setLocale } = useTranslation()
  const next: Locale = locale === 'fr' ? 'en' : 'fr'

  if (compact) {
    return (
      <button
        onClick={() => setLocale(next)}
        title={`${LOCALES.find((l) => l.value === next)?.label}`}
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
          className,
        )}
      >
        <span className="text-[11px] font-bold uppercase">{locale}</span>
      </button>
    )
  }

  return (
    <button
      onClick={() => setLocale(next)}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
        className,
      )}
    >
      <Languages className="h-4 w-4 shrink-0" />
      <span className="flex-1 text-left">{LOCALES.find((l) => l.value === locale)?.label}</span>
      <span className="text-[10px] font-bold uppercase text-gray-600">{locale}</span>
    </button>
  )
}
