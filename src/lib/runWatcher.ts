import { runsApi } from '@/lib/api/runs'
import { connectRunWebSocket } from '@/lib/runWebSocket'
import { NODE_REGISTRY_MAP } from '@/lib/nodeRegistry'
import type { LogEntry, NodeStatus, RunStatus } from '@/types'
import type { Node } from '@xyflow/react'

function logKey(log: LogEntry): string {
  return `${log.ts}|${log.node_id ?? ''}|${log.level}|${log.msg}`
}

function statusFromLog(log: LogEntry): NodeStatus | null {
  if (!log.node_id) return null
  if (log.level === 'ERROR') return 'error'
  const msg = log.msg.toLowerCase()
  if (/start|loading|execut|running|process/.test(msg)) return 'running'
  if (/complete|done|loaded|finish|success|rows/.test(msg)) return 'success'
  return 'running'
}

function mapRunEndStatus(status: RunStatus): NodeStatus {
  if (status === 'success') return 'success'
  if (status === 'cancelled') return 'skipped'
  return 'error'
}

/** Erreurs bloquantes avant lancement (nœud source sans fichier / datasource). */
export function validatePipelineForRun(nodes: Node[]): string[] {
  const errors: string[] = []
  for (const node of nodes) {
    const d = node.data as Record<string, unknown>
    if (d.disabled) continue
    const slug = (d.type_slug as string) ?? node.type ?? ''
    const def = NODE_REGISTRY_MAP[slug]
    if (!def) continue
    const config = (d.config as Record<string, unknown>) ?? {}
    const label = (d.label as string) ?? def.label

    for (const field of def.fields) {
      const val = config[field.key]
      const empty = val === undefined || val === null || val === ''
      if (empty && field.type === 'file') {
        errors.push(`« ${label} » : aucun fichier sélectionné`)
      }
      if (empty && field.type === 'datasource') {
        errors.push(`« ${label} » : aucune source de données sélectionnée`)
      }
    }
  }
  return errors
}

type WatchRunOptions = {
  pipelineId: string
  runId: string
  nodeIds?: string[]
  onLog: (log: LogEntry) => void
  onNodeStatus?: (nodeId: string, status: NodeStatus) => void
  onComplete: (status: RunStatus) => void
}

/** Marque tous les nœuds actifs en « running » dès le début du run. */
export function initRunNodeStatuses(
  nodeIds: string[],
  onNodeStatus?: (nodeId: string, status: NodeStatus) => void,
) {
  for (const id of nodeIds) onNodeStatus?.(id, 'running')
}

/** Finalise les nœuds encore en cours quand le run se termine. */
export function finalizeRunNodeStatuses(
  nodeIds: string[],
  current: Record<string, NodeStatus>,
  runStatus: RunStatus,
  onNodeStatus?: (nodeId: string, status: NodeStatus) => void,
) {
  const end = mapRunEndStatus(runStatus)
  for (const id of nodeIds) {
    const cur = current[id]
    if (!cur || cur === 'running') onNodeStatus?.(id, end)
  }
}

/**
 * Surveille un run : SSE + polling de secours (le proxy Next.js bufferise
 * souvent le SSE) + récupération finale des logs.
 */
export function watchRun({
  pipelineId,
  runId,
  nodeIds = [],
  onLog,
  onNodeStatus,
  onComplete,
}: WatchRunOptions): () => void {
  let stopped = false
  let finished = false
  const seen = new Set<string>()
  const tracked = new Set(nodeIds)

  initRunNodeStatuses(nodeIds, onNodeStatus)

  const emit = (log: LogEntry) => {
    const key = logKey(log)
    if (seen.has(key)) return
    seen.add(key)
    onLog(log)
    const ns = statusFromLog(log)
    if (ns && log.node_id && onNodeStatus) {
      tracked.add(log.node_id)
      onNodeStatus(log.node_id, ns)
    }
  }

  const syncLogs = async () => {
    const logs = await runsApi.getLogs(runId)
    logs.forEach(emit)
  }

  const finish = async (statusOverride?: RunStatus) => {
    if (stopped || finished) return
    finished = true
    stopped = true
    clearInterval(pollTimer)
    stopStream()
    stopWs()
    try { await syncLogs() } catch { /* noop */ }
    let status: RunStatus = statusOverride ?? 'failed'
    if (!statusOverride) {
      try {
        const run = await runsApi.get(pipelineId, runId)
        status = run.status
      } catch { /* keep failed */ }
    }
    onComplete(status)
  }

  const pollTimer = setInterval(async () => {
    if (stopped) return
    try {
      await syncLogs()
      const run = await runsApi.get(pipelineId, runId)
      if (run.status !== 'running' && run.status !== 'queued') {
        await finish(run.status)
      }
    } catch { /* noop */ }
  }, 1500)

  void syncLogs()

  const stopStream = runsApi.streamLogs(runId, emit, () => { /* polling gère la fin */ })

  const stopWs = connectRunWebSocket(runId, {
    onNodeStatus: (nodeId, status) => {
      tracked.add(nodeId)
      onNodeStatus?.(nodeId, status)
    },
    onComplete: (status) => { void finish(status) },
  })

  return () => {
    stopped = true
    clearInterval(pollTimer)
    stopStream()
    stopWs()
  }
}
