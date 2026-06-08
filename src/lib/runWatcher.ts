import { runsApi } from '@/lib/api/runs'
import { connectRunWebSocket } from '@/lib/runWebSocket'
import { NODE_REGISTRY_MAP } from '@/lib/nodeRegistry'
import { useEditorStore } from '@/store/editor.store'
import type { LogEntry, NodeStatus, RunStatus } from '@/types'
import type { Node } from '@xyflow/react'

function logKey(log: LogEntry): string {
  return `${log.ts}|${log.node_id ?? ''}|${log.level}|${log.msg}`
}

function statusFromLog(log: LogEntry): NodeStatus | null {
  if (!log.node_id) return null
  if (log.level === 'ERROR') return 'error'
  const msg = log.msg.toLowerCase()
  if (/complete|done|loaded|finish|success|rows|exported|written|processed/.test(msg)) return 'success'
  if (/start|loading|execut|running|process|begin|failed|error/.test(msg)) return 'running'
  // Tout log lié à un nœud = activité sur ce nœud
  return 'running'
}

function applyNodeStatus(
  nodeId: string,
  status: NodeStatus,
  onNodeStatus?: (nodeId: string, status: NodeStatus) => void,
) {
  const cur = useEditorStore.getState().nodeStatuses[nodeId]
  if (cur === 'error') return
  if (cur === 'success' && status === 'running') return
  onNodeStatus?.(nodeId, status)
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

/** Ordre d'exécution approximatif (sources → sinks) pour l'animation progressive. */
export function computeExecutionOrder(
  nodes: Node[],
  edges: { source: string; target: string }[],
): string[] {
  const active = nodes
    .filter((n) => !(n.data as Record<string, unknown>).disabled)
    .map((n) => n.id)
  const activeSet = new Set(active)
  const indeg: Record<string, number> = {}
  const adj: Record<string, string[]> = {}
  for (const id of active) {
    indeg[id] = 0
    adj[id] = []
  }
  for (const e of edges) {
    if (!activeSet.has(e.source) || !activeSet.has(e.target)) continue
    adj[e.source].push(e.target)
    indeg[e.target] = (indeg[e.target] ?? 0) + 1
  }
  const q = active.filter((id) => indeg[id] === 0)
  const order: string[] = []
  while (q.length) {
    const id = q.shift()!
    order.push(id)
    for (const t of adj[id] ?? []) {
      indeg[t]--
      if (indeg[t] === 0) q.push(t)
    }
  }
  for (const id of active) {
    if (!order.includes(id)) order.push(id)
  }
  return order
}

/** Animation visuelle nœud par nœud si le backend ne pousse pas de statuts. */
function startProgressiveHighlight(
  order: string[],
  onNodeStatus: ((nodeId: string, status: NodeStatus) => void) | undefined,
  isStopped: () => boolean,
): () => void {
  let cancelled = false

  const run = async () => {
    for (const id of order) {
      if (cancelled || isStopped()) return
      const cur = useEditorStore.getState().nodeStatuses[id]
      if (cur === 'success' || cur === 'error') continue

      applyNodeStatus(id, 'running', onNodeStatus)

      const deadline = Date.now() + 1400
      while (!cancelled && !isStopped() && Date.now() < deadline) {
        const s = useEditorStore.getState().nodeStatuses[id]
        if (s === 'success' || s === 'error') break
        await sleep(80)
      }

      if (cancelled || isStopped()) return
      const final = useEditorStore.getState().nodeStatuses[id]
      if (final === 'running') {
        applyNodeStatus(id, 'success', onNodeStatus)
      }
      if (final === 'error') return
      await sleep(120)
    }
  }

  void run()
  return () => { cancelled = true }
}

function mapRunEndStatus(status: RunStatus): NodeStatus {
  if (status === 'success') return 'success'
  if (status === 'cancelled') return 'skipped'
  return 'error'
}

function normalizeConfig(raw: unknown): Record<string, unknown> {
  if (!raw) return {}
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw) as unknown
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : {}
    } catch {
      return {}
    }
  }
  if (typeof raw === 'object' && !Array.isArray(raw)) return raw as Record<string, unknown>
  return {}
}

/** @public parsing config nœud (backend peut renvoyer une string JSON). */
export function normalizeNodeConfig(raw: unknown): Record<string, unknown> {
  return normalizeConfig(raw)
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
    const config = normalizeConfig(d.config)
    const label = (d.label as string) ?? def.label

    for (const field of def.fields) {
      if (field.optional) continue
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
  executionOrder?: string[]
  onLog: (log: LogEntry) => void
  onNodeStatus?: (nodeId: string, status: NodeStatus) => void
  onComplete: (status: RunStatus) => void
}

/** Clôt les nœuds encore « en cours » à la fin du run (sans toucher les autres). */
export function finalizeRunNodeStatuses(
  current: Record<string, NodeStatus>,
  runStatus: RunStatus,
  onNodeStatus?: (nodeId: string, status: NodeStatus) => void,
) {
  const end = mapRunEndStatus(runStatus)
  for (const [id, cur] of Object.entries(current)) {
    if (cur === 'running') applyNodeStatus(id, end, onNodeStatus)
  }
}

/**
 * Run SYNCHRONE : le backend exécute le pipeline en bloc et renvoie un run déjà
 * terminé. On lit alors directement les logs du run (déjà persistés), on les
 * affiche, et on en dérive le statut final de chaque nœud — sans streaming.
 */
export function applyRunLogs(
  logs: LogEntry[],
  runStatus: RunStatus,
  onLog: (log: LogEntry) => void,
  onNodeStatus: (nodeId: string, status: NodeStatus) => void,
) {
  const perNode: Record<string, NodeStatus> = {}
  for (const log of logs) {
    onLog(log)
    if (!log.node_id) continue
    if (log.level === 'ERROR') perNode[log.node_id] = 'error'
    else if (!perNode[log.node_id]) perNode[log.node_id] = 'success'
  }
  // Si le run a échoué globalement, les nœuds sans verdict restent neutres ;
  // ceux marqués error le restent. Sinon, tout ce qui a loggué = succès.
  const fallback = mapRunEndStatus(runStatus)
  for (const [id, st] of Object.entries(perNode)) {
    onNodeStatus(id, st === 'error' ? 'error' : (fallback === 'error' ? 'success' : st))
  }
}

/**
 * Surveille un run : SSE + polling de secours (le proxy Next.js bufferise
 * souvent le SSE) + récupération finale des logs.
 */
export function watchRun({
  pipelineId,
  runId,
  executionOrder = [],
  onLog,
  onNodeStatus,
  onComplete,
}: WatchRunOptions): () => void {
  let stopped = false
  let finished = false
  const seen = new Set<string>()

  const stopProgress = startProgressiveHighlight(
    executionOrder,
    onNodeStatus,
    () => stopped || finished,
  )

  const emit = (log: LogEntry) => {
    const key = logKey(log)
    if (seen.has(key)) return
    seen.add(key)
    onLog(log)
    const ns = statusFromLog(log)
    if (ns && log.node_id) applyNodeStatus(log.node_id, ns, onNodeStatus)
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
    stopProgress()
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
    onNodeStatus: (nodeId, status) => applyNodeStatus(nodeId, status, onNodeStatus),
    onComplete: (status) => { void finish(status) },
  })

  return () => {
    stopped = true
    clearInterval(pollTimer)
    stopStream()
    stopWs()
    stopProgress()
  }
}
