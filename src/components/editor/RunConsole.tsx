'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Terminal, Table2, Box, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { useEditorStore } from '@/store/editor.store'
import { nodesApi } from '@/lib/api/nodes'
import { runsApi } from '@/lib/api/runs'
import { cn } from '@/lib/utils'

interface RunConsoleProps {
  height: number
  onClose: () => void
  onResize: (delta: number) => void
}

const LOG_COLORS: Record<string, string> = {
  INFO: 'text-gray-400',
  WARNING: 'text-amber-400',
  ERROR: 'text-red-400',
}

// Extrait un tableau de lignes depuis des formes de réponse variées
function extractRows(res: unknown): Record<string, unknown>[] {
  if (Array.isArray(res)) return res as Record<string, unknown>[]
  if (res && typeof res === 'object') {
    const o = res as Record<string, unknown>
    for (const k of ['data', 'rows', 'preview', 'output', 'result']) {
      if (Array.isArray(o[k])) return o[k] as Record<string, unknown>[]
    }
  }
  return []
}

function inferType(v: unknown): string {
  if (v === null || v === undefined) return 'null'
  if (typeof v === 'boolean') return 'booléen'
  if (typeof v === 'number') return Number.isInteger(v) ? 'entier' : 'nombre'
  if (typeof v === 'object') return Array.isArray(v) ? 'liste' : 'objet'
  return 'texte'
}

export function RunConsole({ height, onClose, onResize }: RunConsoleProps) {
  const { logs, consoleTab, setConsoleTab, activeRunId, runStatus, selectedNodeId } = useEditorStore()
  const pipelineId = useEditorStore((s) => s.pipeline?.id)
  const logsEndRef = useRef<HTMLDivElement>(null)

  const [rows, setRows] = useState<Record<string, unknown>[]>([])
  const [dataState, setDataState] = useState<'idle' | 'loading' | 'empty' | 'ok'>('idle')

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  // Charge les données du nœud sélectionné (sortie du run si dispo, sinon test-data)
  useEffect(() => {
    if (consoleTab === 'logs' || !selectedNodeId) { setRows([]); setDataState('idle'); return }
    let alive = true
    setDataState('loading')
    const load = async () => {
      try {
        let r: Record<string, unknown>[] = []
        if (activeRunId) {
          // Vraie sortie du run pour ce nœud
          r = extractRows(await runsApi.getNodeOutput(activeRunId, selectedNodeId))
        } else if (pipelineId) {
          // Données épinglées réelles uniquement — on IGNORE le mock du backend
          const res = (await nodesApi.getTestData(pipelineId, selectedNodeId)) as { source?: string }
          if (res?.source !== 'mock') r = extractRows(res)
        }
        if (!alive) return
        setRows(r)
        setDataState(r.length > 0 ? 'ok' : 'empty')
      } catch {
        if (alive) { setRows([]); setDataState('empty') }
      }
    }
    load()
    return () => { alive = false }
  }, [consoleTab, selectedNodeId, activeRunId, pipelineId])

  // ── Poignée de redimensionnement (drag vers le haut comme VS Code) ──
  const dragging = useRef(false)
  const onHandleDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    dragging.current = true
    document.body.style.cursor = 'ns-resize'
    document.body.style.userSelect = 'none'
    const onMove = (ev: MouseEvent) => { if (dragging.current) onResize(-ev.movementY) }
    const onUp = () => {
      dragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [onResize])

  const columns = rows.length > 0 ? Object.keys(rows[0]) : []

  return (
    <div className="relative flex flex-col border-t border-border bg-background" style={{ height }}>
      {/* Poignée de redimensionnement */}
      <div
        onMouseDown={onHandleDown}
        className="absolute -top-1 left-0 right-0 h-2 cursor-ns-resize z-10 group"
        title="Glisser pour redimensionner"
      >
        <div className="mx-auto mt-[3px] h-0.5 w-10 rounded-full bg-border group-hover:bg-primary transition-colors" />
      </div>

      {/* Header / onglets */}
      <div className="flex items-center justify-between border-b border-border px-4 py-1.5">
        <div className="flex items-center gap-3">
          <Tabs value={consoleTab} onValueChange={(v) => setConsoleTab(v as typeof consoleTab)}>
            <TabsList className="h-7 gap-0.5">
              <TabsTrigger value="logs" className="h-6 gap-1.5 px-2.5 text-xs">
                <Terminal className="h-3 w-3" />
                Logs
                {logs.filter((l) => l.level === 'ERROR').length > 0 && (
                  <Badge variant="destructive" className="h-3.5 min-w-3.5 px-1 text-[9px]">
                    {logs.filter((l) => l.level === 'ERROR').length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="data" className="h-6 gap-1.5 px-2.5 text-xs">
                <Table2 className="h-3 w-3" />
                Données
                {dataState === 'ok' && (
                  <Badge variant="secondary" className="h-3.5 min-w-3.5 px-1 text-[9px]">{rows.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="schema" className="h-6 gap-1.5 px-2.5 text-xs">
                <Box className="h-3 w-3" />
                Schéma
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {activeRunId && (
            <div className="flex items-center gap-1.5 text-[11px] text-gray-600">
              <span className={cn(
                'h-1.5 w-1.5 rounded-full',
                runStatus === 'running' ? 'bg-blue-400 animate-pulse' :
                runStatus === 'success' ? 'bg-emerald-400' :
                runStatus === 'failed' ? 'bg-red-400' : 'bg-gray-600'
              )} />
              Run #{activeRunId.slice(-6)}
              {runStatus && <span className="capitalize">· {runStatus}</span>}
            </div>
          )}
        </div>

        <Button variant="ghost" size="icon-sm" onClick={onClose}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Contenu */}
      <ScrollArea className="flex-1">
        {consoleTab === 'logs' && (
          <div className="p-3 font-mono text-xs space-y-0.5">
            {logs.length === 0 && (
              <p className="text-gray-700 py-4 text-center">
                {activeRunId ? 'En attente des logs…' : 'Lancez un run pour voir les logs'}
              </p>
            )}
            {logs.map((log, i) => (
              <div key={i} className="flex gap-3 py-0.5 border-b border-border/40">
                <span className="text-gray-700 shrink-0">{log.ts}</span>
                <span className={cn('shrink-0 w-14', LOG_COLORS[log.level] ?? 'text-gray-500')}>{log.level}</span>
                {log.node_id && <span className="text-gray-600 shrink-0 truncate max-w-[80px]">{log.node_id}</span>}
                <span className="text-foreground break-all">{log.msg}</span>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        )}

        {consoleTab === 'data' && (
          <div className="p-2 text-xs">
            {!selectedNodeId ? (
              <p className="py-6 text-center text-gray-600">Cliquez sur un nœud pour voir ses données</p>
            ) : dataState === 'loading' ? (
              <p className="py-6 text-center text-gray-600">Chargement des données…</p>
            ) : dataState === 'empty' ? (
              <p className="py-6 text-center text-gray-600">
                Aucune donnée pour ce nœud — lancez une exécution ou épinglez des données
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-[11px]">
                  <thead>
                    <tr className="border-b border-border">
                      {columns.map((c) => (
                        <th key={c} className="px-2 py-1.5 font-semibold text-foreground whitespace-nowrap">{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 100).map((row, i) => (
                      <tr key={i} className="border-b border-border/40 hover:bg-muted/40">
                        {columns.map((c) => (
                          <td key={c} className="px-2 py-1 text-gray-400 whitespace-nowrap max-w-[220px] truncate">
                            {String(row[c] ?? '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {rows.length > 100 && (
                  <p className="px-2 py-2 text-[10px] text-gray-600">… {rows.length - 100} lignes supplémentaires</p>
                )}
              </div>
            )}
          </div>
        )}

        {consoleTab === 'schema' && (
          <div className="p-3 text-xs">
            {!selectedNodeId ? (
              <p className="py-6 text-center text-gray-600">Sélectionnez un nœud pour voir son schéma</p>
            ) : columns.length === 0 ? (
              <p className="py-6 text-center text-gray-600">Aucun schéma — exécutez le pipeline d&apos;abord</p>
            ) : (
              <div className="space-y-1">
                {columns.map((c) => (
                  <div key={c} className="flex items-center justify-between rounded-md px-3 py-1.5 hover:bg-muted/40">
                    <span className="font-mono text-foreground">{c}</span>
                    <Badge variant="secondary" className="text-[10px] h-5">{inferType(rows[0]?.[c])}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
