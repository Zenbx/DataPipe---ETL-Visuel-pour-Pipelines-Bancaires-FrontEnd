import type { WebhookEvent } from '@/lib/api/webhooks'

export interface WebhookEventDefinition {
  id: WebhookEvent
  label: string
  summary: string
  payload: string[]
  useWhen: string[]
}

export const WEBHOOK_EVENTS: WebhookEventDefinition[] = [
  {
    id: 'run.started',
    label: 'Exécution démarrée',
    summary: 'Notifie dès qu’un pipeline commence à s’exécuter.',
    payload: [
      'run_id, pipeline_id, statut « running »',
      'Horodatage de début (started_at)',
      'Déclencheur (manuel, planification, webhook entrant…)',
    ],
    useWhen: [
      'Afficher une alerte « en cours » dans Slack/Teams',
      'Démarrer un workflow externe en parallèle',
    ],
  },
  {
    id: 'run.success',
    label: 'Exécution réussie',
    summary: 'Envoyé quand tous les nœuds se terminent sans erreur.',
    payload: [
      'run_id, pipeline_id, statut « success »',
      'Durée totale et lignes traitées',
      'Résumé des sorties principales',
    ],
    useWhen: [
      'Confirmer un job CI/CD ou ETL nocturne',
      'Déclencher la suite du process métier (export, notification)',
    ],
  },
  {
    id: 'run.error',
    label: 'Exécution en échec',
    summary: 'Envoyé si un nœud échoue ou si le run est interrompu avec erreur.',
    payload: [
      'run_id, pipeline_id, statut « failed »',
      'Message d’erreur et nœud en cause si disponible',
      'Durée avant échec',
    ],
    useWhen: [
      'PagerDuty / alertes ops immédiates',
      'Ouvrir un ticket Jira automatiquement',
    ],
  },
  {
    id: 'run.cancelled',
    label: 'Exécution annulée',
    summary: 'Notifie quand un run est annulé manuellement ou par timeout.',
    payload: [
      'run_id, pipeline_id, statut « cancelled »',
      'Horodatage d’annulation',
    ],
    useWhen: [
      'Tracer les annulations utilisateur',
      'Éviter de relancer des jobs en double',
    ],
  },
]

export function getWebhookEvent(id: string): WebhookEventDefinition | undefined {
  return WEBHOOK_EVENTS.find((e) => e.id === id)
}

export function getWebhookEventLabel(id: string): string {
  return getWebhookEvent(id)?.label ?? id
}
