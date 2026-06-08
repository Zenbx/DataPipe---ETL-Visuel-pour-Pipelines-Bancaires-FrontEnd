'use client'

import { Ban, CheckCircle2, Clock, History, XCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatDuration, getRelativeTime } from '@/lib/utils'

type ScheduledRunItem = {
  status?: string
  started_at?: string
  finished_at?: string
  duration_ms?: number | null
  error_message?: string | null
}

function parseScheduledRuns(raw: unknown): ScheduledRunItem[] {
  if (!raw || typeof raw !== 'object') return []
  const root = raw as Record<string, unknown>
  const list = root.runs ?? root.data ?? root.items
  if (!Array.isArray(list)) return []
  return list
    .filter((r): r is Record<string, unknown> => r != null && typeof r === 'object')
    .map((r) => ({
      status: r.status != null ? String(r.status) : undefined,
      started_at: r.started_at != null ? String(r.started_at) : undefined,
      finished_at: r.finished_at != null ? String(r.finished_at) : undefined,
      duration_ms: typeof r.duration_ms === 'number' ? r.duration_ms : null,
      error_message: r.error_message != null ? String(r.error_message) : null,
    }))
}

function statusVariant(status?: string) {
  if (status === 'success') return 'success' as const
  if (status === 'failed') return 'destructive' as const
  if (status === 'running' || status === 'queued') return 'running' as const
  if (status === 'cancelled') return 'secondary' as const
  return 'secondary' as const
}

function statusLabel(status?: string) {
  if (!status) return 'inconnu'
  if (status === 'success') return 'réussi'
  if (status === 'failed') return 'échec'
  if (status === 'running') return 'en cours'
  if (status === 'queued') return 'en file'
  if (status === 'cancelled') return 'annulé'
  return status
}

function RunStatusIcon({ status }: { status?: string }) {
  if (status === 'success') return <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
  if (status === 'failed') return <XCircle className="h-4 w-4 text-red-400 shrink-0" />
  if (status === 'cancelled') return <Ban className="h-4 w-4 text-gray-500 shrink-0" />
  if (status === 'running' || status === 'queued') {
    return <div className="h-4 w-4 rounded-full border-2 border-blue-400 animate-spin border-t-transparent shrink-0" />
  }
  return <Clock className="h-4 w-4 text-gray-500 shrink-0" />
}

export function ScheduledRunsView({
  data,
  pipelineName,
}: {
  data: unknown
  pipelineName?: string
}) {
  const runs = parseScheduledRuns(data)

  if (runs.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center">
        <History className="mx-auto h-8 w-8 text-gray-700 mb-2" />
        <p className="text-sm text-gray-500">Aucune exécution planifiée enregistrée.</p>
        {pipelineName && <p className="text-xs text-gray-600 mt-1">Pipeline : {pipelineName}</p>}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {pipelineName && (
        <p className="text-xs text-gray-500">
          Pipeline <span className="text-foreground font-medium">{pipelineName}</span>
          {' · '}
          {runs.length} exécution{runs.length > 1 ? 's' : ''}
        </p>
      )}

      <div className="max-h-[55vh] overflow-y-auto space-y-2 pr-1">
        {runs.map((run, i) => (
          <div key={`${run.started_at ?? i}`} className="rounded-lg border border-border px-3 py-2.5 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <RunStatusIcon status={run.status} />
                <Badge variant={statusVariant(run.status)} className="text-[10px] h-5">
                  {statusLabel(run.status)}
                </Badge>
              </div>
              {run.duration_ms != null && run.duration_ms > 0 && (
                <span className="text-[10px] text-gray-500 shrink-0">
                  {formatDuration(run.duration_ms)}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <p className="text-gray-600">Démarré</p>
                <p className="text-gray-400">
                  {run.started_at ? getRelativeTime(run.started_at) : '—'}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Terminé</p>
                <p className="text-gray-400">
                  {run.finished_at ? getRelativeTime(run.finished_at) : run.status === 'running' ? 'en cours…' : '—'}
                </p>
              </div>
            </div>
            {run.error_message && (
              <p className="text-[11px] text-red-400/90 leading-snug border-t border-border/60 pt-1.5">
                {run.error_message}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
