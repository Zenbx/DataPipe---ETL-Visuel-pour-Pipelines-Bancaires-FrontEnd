'use client'

import Link from 'next/link'
import { CheckCircle2, Circle, Rocket } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useOnboardingStore, type ChecklistState } from '@/store/onboarding.store'

const ITEMS: {
  key: keyof ChecklistState
  label: string
  href: string
}[] = [
  { key: 'exploreTemplates', label: 'Explorer un template', href: '/dashboard/templates' },
  { key: 'uploadFile', label: 'Importer un fichier', href: '/dashboard/files' },
  { key: 'createPipeline', label: 'Créer un pipeline', href: '/dashboard/pipelines' },
  { key: 'firstRun', label: 'Lancer une exécution', href: '/dashboard/runs' },
]

export function OnboardingChecklist() {
  const { checklist, wizardCompleted } = useOnboardingStore()
  const done = ITEMS.filter((i) => checklist[i.key]).length
  const allDone = done === ITEMS.length

  if (allDone && wizardCompleted) return null

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Rocket className="h-4 w-4 text-primary" />
          Premiers pas
          <span className="text-xs font-normal text-gray-500 ml-auto">{done}/{ITEMS.length}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {ITEMS.map((item) => {
          const checked = checklist[item.key]
          return (
            <Link
              key={item.key}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-background/60"
            >
              {checked ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
              ) : (
                <Circle className="h-4 w-4 shrink-0 text-gray-600" />
              )}
              <span className={checked ? 'text-gray-500 line-through' : 'text-foreground'}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </CardContent>
    </Card>
  )
}
