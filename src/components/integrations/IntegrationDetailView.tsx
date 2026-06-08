'use client'

import type { ReactNode } from 'react'
import { Plug, Shield } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { INTEGRATION_CONFIG_FIELDS } from '@/lib/configFields'
import type { AppIntegration, IntegrationType } from '@/lib/api/integrations'
import { getRelativeTime } from '@/lib/utils'

const TYPE_LABELS: Record<IntegrationType, string> = {
  slack: 'Slack',
  email: 'Email (SMTP)',
  pagerduty: 'PagerDuty',
  jira: 'Jira',
  github: 'GitHub',
  teams: 'Microsoft Teams',
}

function maskValue(key: string, value: unknown, isSecret: boolean): string {
  if (value === undefined || value === null || value === '') return '—'
  const str = String(value)
  if (isSecret) return '••••••••'
  if (key.includes('webhook') || key.includes('url') || key.includes('token')) {
    if (str.length <= 12) return '••••••••'
    return `${str.slice(0, 8)}…${str.slice(-4)}`
  }
  return str
}

function DetailField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-gray-600 mb-0.5">{label}</p>
      <div className="text-sm text-foreground">{children}</div>
    </div>
  )
}

export function IntegrationDetailView({ integration }: { integration: AppIntegration }) {
  const typeLabel = TYPE_LABELS[integration.type] ?? integration.type
  const fieldDefs = INTEGRATION_CONFIG_FIELDS[integration.type] ?? []
  const config = integration.config ?? {}

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-lg border border-border bg-card/40 p-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Plug className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold text-foreground">{integration.name}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="text-[10px] h-5">{typeLabel}</Badge>
            <Badge variant={integration.active ? 'success' : 'secondary'} className="text-[10px] h-5">
              {integration.active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <DetailField label="Créée">
          {integration.created_at ? getRelativeTime(integration.created_at) : '—'}
        </DetailField>
        <DetailField label="Statut">
          {integration.active ? 'Prête à envoyer des alertes' : 'Désactivée'}
        </DetailField>
      </div>

      {fieldDefs.length > 0 && (
        <div className="rounded-lg border border-border/60 bg-background/40 p-3 space-y-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-600">
            Paramètres configurés
          </p>
          {fieldDefs.map((f) => {
            const raw = config[f.key]
            const hasValue = raw !== undefined && raw !== null && String(raw).trim() !== ''
            const isSecret = f.type === 'password' || f.key.includes('token') || f.key.includes('key')
            return (
              <div key={f.key} className="flex items-start justify-between gap-3 text-xs">
                <span className="text-gray-500 shrink-0">{f.label}</span>
                <span className="text-right font-mono text-gray-300 break-all">
                  {hasValue
                    ? maskValue(f.key, raw, isSecret)
                    : <span className="text-gray-600 italic">non renseigné</span>}
                </span>
              </div>
            )
          })}
          {Object.keys(config).length === 0 && (
            <div className="flex items-start gap-2 rounded-md bg-background/60 px-2.5 py-2">
              <Shield className="h-4 w-4 shrink-0 text-primary/80 mt-0.5" />
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Les identifiants sont stockés de façon sécurisée et ne sont pas renvoyés par l&apos;API.
                Seuls les champs attendus pour ce type d&apos;intégration sont listés ci-dessus.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
