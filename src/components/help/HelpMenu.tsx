'use client'

import { usePathname } from 'next/navigation'
import { CircleHelp, Map, Sparkles, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { helpKeyFromPath } from '@/lib/pageHelp'
import { startPageTour } from '@/components/onboarding/PageTour'
import { useOnboardingStore } from '@/store/onboarding.store'

export function HelpMenu() {
  const pathname = usePathname()
  const helpKey = helpKeyFromPath(pathname ?? '')
  const resetOnboarding = useOnboardingStore((s) => s.resetOnboarding)

  const replayWizard = () => {
    resetOnboarding()
    window.location.reload()
  }

  const replayTour = () => {
    if (helpKey) startPageTour(helpKey)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" title="Aide">
          <CircleHelp className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Aide DataPipe</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={replayWizard}>
          <Sparkles className="h-4 w-4 mr-2" />
          Revoir l&apos;introduction
        </DropdownMenuItem>
        {helpKey && (
          <DropdownMenuItem onClick={replayTour}>
            <Map className="h-4 w-4 mr-2" />
            Tour de cette page
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => resetOnboarding()}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Réinitialiser la progression
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
