import { authTokens, getWebSocketBase } from '@/lib/api/client'
import type { NodeStatus, RunStatus, WSEvent } from '@/types'

function mapWsNodeStatus(raw: string): NodeStatus {
  const s = raw.toLowerCase()
  if (s === 'running' || s === 'pending' || s === 'queued') return 'running'
  if (s === 'success' || s === 'completed') return 'success'
  if (s === 'error' || s === 'failed') return 'error'
  if (s === 'skipped') return 'skipped'
  return 'running'
}

type RunWebSocketCallbacks = {
  onNodeStatus: (nodeId: string, status: NodeStatus) => void
  onComplete?: (status: RunStatus) => void
}

/**
 * WebSocket /ws/runs/{run_id} — canal prévu par le backend pour animer les
 * nœuds (idle → running → success/error) pendant l'exécution.
 */
export function connectRunWebSocket(
  runId: string,
  { onNodeStatus, onComplete }: RunWebSocketCallbacks,
): () => void {
  const token = authTokens.getAccess()
  const base = getWebSocketBase()
  const qs = token ? `?token=${encodeURIComponent(token)}` : ''
  let ws: WebSocket | null = null
  let closed = false

  try {
    ws = new WebSocket(`${base}/ws/runs/${runId}${qs}`)
  } catch {
    return () => {}
  }

  ws.onmessage = (ev) => {
    try {
      const msg = JSON.parse(String(ev.data)) as WSEvent
      if (msg.type === 'node_status') {
        onNodeStatus(msg.node_id, mapWsNodeStatus(msg.status))
      } else if (msg.type === 'run_complete') {
        onComplete?.(msg.status)
      }
    } catch {
      /* message non-JSON ignoré */
    }
  }

  ws.onerror = () => { /* fallback polling dans runWatcher */ }

  return () => {
    closed = true
    if (ws && ws.readyState <= WebSocket.OPEN) ws.close()
    ws = null
    void closed
  }
}
