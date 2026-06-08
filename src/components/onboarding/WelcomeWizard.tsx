'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  GitBranch, FileUp, Play, Sparkles, ChevronRight, ChevronLeft, X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import { useOnboardingStore } from '@/store/onboarding.store'
import { useAuthStore } from '@/store/auth.store'

const STEPS = [
  {
    icon: Sparkles,
    title: 'Bienvenue sur DataPipe',
    body: 'DataPipe vous permet de construire des pipelines de données visuels : glisser des nœuds, connecter, exécuter — sans écrire de code.',
  },
  {
    icon: GitBranch,
    title: 'Pipelines & nœuds',
    body: 'Un pipeline enchaîne des nœuds (CSV, filtre, IA, export…). Chaque nœud transforme vos données et passe le résultat au suivant.',
  },
  {
    icon: FileUp,
    title: 'Fichiers & sources',
    body: 'Importez des fichiers ou connectez une base de données. Utilisez-les comme point d’entrée dans l’éditeur.',
  },
  {
    icon: Play,
    title: 'Exécuter & suivre',
    body: 'Lancez un run depuis l’éditeur. Consultez l’historique, les logs et les exports dans les menus Exécutions et Fichiers.',
  },
]

export function WelcomeWizard() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const isLoading = useAuthStore((s) => s.isLoading)
  const { wizardCompleted, completeWizard } = useOnboardingStore()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (!isLoading && user && !wizardCompleted) {
      const t = setTimeout(() => setOpen(true), 600)
      return () => clearTimeout(t)
    }
  }, [isLoading, user, wizardCompleted])

  const close = () => {
    setOpen(false)
    completeWizard()
  }

  const current = STEPS[step]
  const Icon = current.icon
  const isLast = step === STEPS.length - 1

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) close(); else setOpen(v) }}>
      <DialogContent className="max-w-lg p-0 overflow-hidden gap-0">
        <div className="relative px-6 pt-6 pb-4 border-b border-border">
          <button
            type="button"
            onClick={close}
            className="absolute right-4 top-4 rounded p-1 text-gray-500 hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-primary mb-3">
            Introduction · {step + 1} / {STEPS.length}
          </p>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 mb-3">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground">{current.title}</h2>
          <p className="mt-2 text-sm text-gray-500 leading-relaxed">{current.body}</p>
        </div>

        <div className="flex items-center justify-center gap-1.5 py-3">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${i === step ? 'w-6 bg-primary' : 'w-1.5 bg-border'}`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between gap-2 px-6 pb-6">
          <Button
            variant="ghost"
            disabled={step === 0}
            onClick={() => setStep((s) => s - 1)}
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Retour
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={close}>
              Passer
            </Button>
            {isLast ? (
              <Button
                onClick={() => {
                  close()
                  router.push('/dashboard/templates')
                }}
              >
                Commencer avec un template <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={() => setStep((s) => s + 1)}>
                Suivant <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </div>

        {isLast && (
          <div className="px-6 pb-5 -mt-2">
            <p className="text-xs text-gray-600 text-center">
              Ou{' '}
              <Link href="/dashboard/pipelines" className="text-primary hover:underline" onClick={close}>
                créer un pipeline vide
              </Link>
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export function openWelcomeWizard() {
  useOnboardingStore.setState({ wizardCompleted: false })
  window.dispatchEvent(new CustomEvent('datapipe:open-wizard'))
}
