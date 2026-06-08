'use client'

import { History, Send } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { WebhookEventBadge } from '@/components/webhooks/WebhookEventSelector'
import { getRelativeTime } from '@/lib/utils'

type WebhookHistoryItem = {
  event_type?: string
  status?: string
  response_code?: number | null
  sent_at?: string
}

function parseWebhookEvents(raw: unknown): WebhookHistoryItem[] {
  if (!raw || typeof raw !== 'object') return []
  const root = raw as Record<string, unknown>
  const list = root.events ?? root.data ?? root.items
  if (!Array.isArray(list)) return []
  return list
    .filter((e): e is Record<string, unknown> => e != null && typeof e === 'object')
    .map((e) => ({
      event_type: e.event_type != null ? String(e.event_type) : undefined,
      status: e.status != null ? String(e.status) : undefined,
      response_code: typeof e.response_code === 'number' ? e.response_code : null,
      sent_at: e.sent_at != null ? String(e.sent_at) : undefined,
    }))
}

function statusVariant(status?: string) {
  if (status === 'delivered' || status === 'success') return 'success' as const
  if (status === 'failed' || status === 'error') return 'destructive' as const
  if (status === 'pending') return 'running' as const
  return 'secondary' as const
}

function statusLabel(status?: string) {
  if (!status) return 'inconnu'
  if (status === 'delivered') return 'livré'
  if (status === 'pending') return 'en attente'
  if (status === 'failed') return 'échec'
  return status
}

function httpLabel(code?: number | null) {
  if (code == null) return '—'
  if (code >= 200 && code < 300) return `${code} OK`
  if (code >= 400) return `${code} erreur`
  return String(code)
}

export function WebhookEventHistoryView({
  data,
  webhookUrl,
}: {
  data: unknown
  webhookUrl?: string
}) {
  const events = parseWebhookEvents(data)

  if (events.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center">
        <History className="mx-auto h-8 w-8 text-gray-700 mb-2" />
        <p className="text-sm text-gray-500">Aucun événement envoyé pour l&apos;instant.</p>
        {webhookUrl && (
          <p className="text-xs text-gray-600 mt-2 truncate max-w-md mx-auto">{webhookUrl}</p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {webhookUrl && (
        <div className="flex items-start gap-2 rounded-lg bg-background/60 px-3 py-2 text-xs text-gray-500">
          <Send className="h-3.5 w-3.5 shrink-0 mt-0.5 text-primary" />
          <span className="break-all">{webhookUrl}</span>
        </div>
      )}

      <p className="text-xs text-gray-600">{events.length} événement{events.length > 1 ? 's' : ''} récent{events.length > 1 ? 's' : ''}</p>

      <div className="max-h-[55vh] overflow-y-auto space-y-2 pr-1">
        {events.map((evt, i) => (
          <div
            key={`${evt.sent_at ?? i}-${evt.event_type ?? i}`}
            className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5"
          >
            <div className="min-w-0 space-y-1">
              {evt.event_type ? (
                <WebhookEventBadge eventId={evt.event_type} />
              ) : (
                <span className="text-xs text-gray-500">Événement</span>
              )}
              <p className="text-[11px] text-gray-600">
                {evt.sent_at ? getRelativeTime(evt.sent_at) : 'Date inconnue'}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <Badge variant={statusVariant(evt.status)} className="text-[10px] h-5">
                {statusLabel(evt.status)}
              </Badge>
              <span className="text-[10px] font-mono text-gray-500">
                HTTP {httpLabel(evt.response_code)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
