'use client'

import { useEffect, useState } from 'react'
import { X, ChevronRight, ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useOnboardingStore } from '@/store/onboarding.store'
import { PAGE_TOUR_STEPS } from '@/lib/pageTourSteps'

interface PageTourProps {
  pageKey: string
  title: string
}

export function PageTour({ pageKey, title }: PageTourProps) {
  const { isPageTourDone, completePageTour } = useOnboardingStore()
  const steps = PAGE_TOUR_STEPS[pageKey] ?? []
  const [active, setActive] = useState(false)
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (steps.length === 0) return
    if (isPageTourDone(pageKey)) return
    const t = setTimeout(() => setActive(true), 800)
    return () => clearTimeout(t)
  }, [pageKey, steps.length, isPageTourDone])

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ pageKey: string }>).detail
      if (detail?.pageKey === pageKey) {
        setIndex(0)
        setActive(true)
      }
    }
    window.addEventListener('datapipe:start-page-tour', handler)
    return () => window.removeEventListener('datapipe:start-page-tour', handler)
  }, [pageKey])

  if (!active || steps.length === 0) return null

  const step = steps[index]
  const isLast = index === steps.length - 1

  const close = () => {
    setActive(false)
    completePageTour(pageKey)
  }

  const next = () => {
    if (isLast) close()
    else setIndex((i) => i + 1)
  }

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      <div className="absolute inset-0 bg-black/50 pointer-events-auto" onClick={close} />
      <div
        className="pointer-events-auto absolute left-1/2 bottom-8 z-[101] w-[min(420px,calc(100vw-2rem))] -translate-x-1/2 rounded-xl border border-border bg-card p-5 shadow-2xl"
        style={{ animation: 'slide-up 0.25s ease both' }}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-primary">
              Tour · {title} · {index + 1}/{steps.length}
            </p>
            <p className="text-sm font-semibold text-foreground mt-1">{step.title}</p>
          </div>
          <button
            type="button"
            onClick={close}
            className="rounded p-1 text-gray-500 hover:bg-muted pointer-events-auto"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-sm text-gray-400 leading-relaxed">{step.body}</p>
        <div className="mt-4 flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={index === 0}
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            className="pointer-events-auto"
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Précédent
          </Button>
          <div className="flex gap-1">
            {steps.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 w-1.5 rounded-full ${i === index ? 'bg-primary' : 'bg-border'}`}
              />
            ))}
          </div>
          <Button size="sm" onClick={next} className="pointer-events-auto">
            {isLast ? 'Terminer' : 'Suivant'} {!isLast && <ChevronRight className="h-4 w-4 ml-1" />}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function startPageTour(pageKey: string) {
  window.dispatchEvent(new CustomEvent('datapipe:start-page-tour', { detail: { pageKey } }))
}
