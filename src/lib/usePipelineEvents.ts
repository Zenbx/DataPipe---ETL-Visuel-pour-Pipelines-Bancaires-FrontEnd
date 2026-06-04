'use client'

import { useEffect, useRef } from 'react'
import { API_BASE } from '@/lib/api/client'

export interface PipelineEvent {
  type: 'pipeline.updated' | 'run.finished' | string
  payload?: Record<string, unknown>
}

/**
 * S'abonne au flux temps-réel d'un pipeline (`/pipelines/:id/events`, SSE).
 * Le backend y publie `pipeline.updated` (ajout/connexion/suppression de nœud,
 * auto-câblage…) et `run.finished` — déclenchés aussi bien par le web que par le
 * BOT TELEGRAM. Permet au front de se redessiner en direct quand le bot agit.
 *
 * EventSource ne peut pas envoyer d'en-tête Authorization : l'endpoint est ouvert
 * (notifications non sensibles) et se reconnecte tout seul (retry).
 */
export function usePipelineEvents(
  pipelineId: string | undefined,
  onEvent: (e: PipelineEvent) => void,
) {
  const cbRef = useRef(onEvent)
  cbRef.current = onEvent

  useEffect(() => {
    if (!pipelineId) return
    const es = new EventSource(`${API_BASE}/pipelines/${pipelineId}/events`)
    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data) as PipelineEvent
        if (data && data.type) cbRef.current(data)
      } catch {
        /* keep-alive / ligne non-JSON ignorée */
      }
    }
    es.onerror = () => {
      /* le navigateur reconnecte automatiquement (directive retry du serveur) */
    }
    return () => es.close()
  }, [pipelineId])
}
