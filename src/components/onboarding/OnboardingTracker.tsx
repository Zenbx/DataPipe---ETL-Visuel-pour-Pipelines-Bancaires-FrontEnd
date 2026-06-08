'use client'

import { useEffect } from 'react'
import { useOnboardingStore } from '@/store/onboarding.store'

/** Écoute les événements métier pour cocher la checklist automatiquement. */
export function OnboardingTracker() {
  const setChecklistItem = useOnboardingStore((s) => s.setChecklistItem)

  useEffect(() => {
    const onFile = () => setChecklistItem('uploadFile')
    const onPipeline = () => setChecklistItem('createPipeline')
    const onRun = () => setChecklistItem('firstRun')
    const onTemplate = () => setChecklistItem('exploreTemplates')

    window.addEventListener('datapipe:file-uploaded', onFile)
    window.addEventListener('datapipe:pipeline-created', onPipeline)
    window.addEventListener('datapipe:run-completed', onRun)
    window.addEventListener('datapipe:template-used', onTemplate)

    return () => {
      window.removeEventListener('datapipe:file-uploaded', onFile)
      window.removeEventListener('datapipe:pipeline-created', onPipeline)
      window.removeEventListener('datapipe:run-completed', onRun)
      window.removeEventListener('datapipe:template-used', onTemplate)
    }
  }, [setChecklistItem])

  return null
}

export function emitOnboardingEvent(name: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(name))
  }
}
