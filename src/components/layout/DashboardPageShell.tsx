'use client'

import type { ReactNode } from 'react'
import { PageHelpButton } from '@/components/help/PageHelp'
import { PageHelpPanel } from '@/components/help/PageHelpPanel'
import { PageTour } from '@/components/onboarding/PageTour'
import { getPageHelp } from '@/lib/pageHelp'
import { cn } from '@/lib/utils'

export type DashboardPageWidth = 'narrow' | 'default' | 'wide' | 'full'

const WIDTH_CLASS: Record<DashboardPageWidth, string> = {
  narrow: 'max-w-4xl',
  default: 'max-w-none',
  wide: 'max-w-none',
  full: 'max-w-none',
}

interface DashboardPageShellProps {
  helpKey?: string
  width?: DashboardPageWidth
  title?: string
  description?: string
  actions?: ReactNode
  hideContextPanel?: boolean
  children: ReactNode
}

export function DashboardPageShell({
  helpKey,
  width = 'default',
  title,
  description,
  actions,
  hideContextPanel = false,
  children,
}: DashboardPageShellProps) {
  const help = helpKey ? getPageHelp(helpKey) : undefined
  const showPanel = !!helpKey && !hideContextPanel

  return (
    <>
      <div className="flex min-h-full w-full">
        <div
          className={cn(
            'flex-1 min-w-0 p-6 space-y-5',
            width !== 'full' && WIDTH_CLASS[width],
            width === 'narrow' && 'w-full',
          )}
        >
          {(title || actions) && (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-2 min-w-0">
                <div className="min-w-0">
                  {title && (
                    <div className="flex items-center gap-1.5">
                      <h1 className="text-xl font-bold text-foreground">{title}</h1>
                      {helpKey && <PageHelpButton helpKey={helpKey} />}
                    </div>
                  )}
                  {description && (
                    <p className="mt-1 text-sm text-gray-500">{description}</p>
                  )}
                </div>
              </div>
              {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
            </div>
          )}
          {children}
        </div>

        {showPanel && (
          <aside className="hidden xl:flex w-72 shrink-0 flex-col border-l border-border bg-card/30">
            <div className="border-b border-border px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-600">
                Guide de la page
              </p>
            </div>
            <PageHelpPanel helpKey={helpKey!} />
          </aside>
        )}
      </div>

      {helpKey && help && (
        <PageTour pageKey={helpKey} title={help.title} />
      )}
    </>
  )
}
