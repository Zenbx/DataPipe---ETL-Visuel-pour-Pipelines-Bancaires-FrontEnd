'use client'

import { useEffect, useState } from 'react'
import { Download, Trash2, RotateCcw, FileDown, Database, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { resultsApi, exportName, type ExportItem, type ResultItem } from '@/lib/api/results'
import { pipelinesApi } from '@/lib/api/pipelines'
import { useWorkspaceStore } from '@/store/workspace.store'
import { formatBytes, formatNumber, getRelativeTime } from '@/lib/utils'
import { toast } from 'sonner'
import type { Pipeline } from '@/types'
import { DashboardPageShell } from '@/components/layout/DashboardPageShell'

function statusVariant(s?: string) {
  if (s === 'completed' || s === 'ready' || s === 'success') return 'success' as const
  if (s === 'failed' || s === 'error') return 'destructive' as const
  if (s === 'pending' || s === 'processing') return 'running' as const
  return 'secondary' as const
}

export default function ExportsPage() {
  const [exports, setExports] = useState<ExportItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [selectedPipeline, setSelectedPipeline] = useState('')
  const [results, setResults] = useState<ResultItem[]>([])
  const [resultsLoading, setResultsLoading] = useState(false)
  const [detail, setDetail] = useState<unknown>(null)

  const workspaceId = useWorkspaceStore((s) => s.currentWorkspaceId)

  useEffect(() => {
    if (!workspaceId || workspaceId === 'default') { setIsLoading(false); return }
    let alive = true
    setIsLoading(true)
    ;(async () => {
      let pipes: Pipeline[] = []
      try {
        const r = await pipelinesApi.list({ workspace_id: workspaceId, per_page: 50 })
        pipes = r.data
        if (alive) setPipelines(pipes)
      } catch { /* ignore */ }
      // 1. liste globale /exports ; 2. fallback : agrégation par pipeline (qui marche)
      let list = await resultsApi.listExports()
      if (list.length === 0 && pipes.length > 0) {
        list = await resultsApi.listExportsAggregated(pipes.map((p) => ({ id: p.id, name: p.name })))
      }
      if (alive) { setExports(list); setIsLoading(false) }
    })()
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId])

  const loadExports = async () => {
    let list = await resultsApi.listExports()
    if (list.length === 0 && pipelines.length > 0) {
      list = await resultsApi.listExportsAggregated(pipelines.map((p) => ({ id: p.id, name: p.name })))
    }
    setExports(list)
  }

  const loadResults = async (pipelineId: string) => {
    setSelectedPipeline(pipelineId)
    setResultsLoading(true)
    try { setResults(await resultsApi.getPipelineResults(pipelineId)) }
    catch { toast.error('Erreur de chargement des résultats') }
    finally { setResultsLoading(false) }
  }

  const handleRemove = async (e: ExportItem) => {
    try { await resultsApi.removeExport(e.id); setExports((p) => p.filter((x) => x.id !== e.id)); toast.success('Export supprimé') }
    catch { toast.error('Erreur') }
  }

  const handleRetry = async (e: ExportItem) => {
    try { await resultsApi.retryExport(e.id); toast.success('Export relancé'); loadExports() }
    catch { toast.error('Erreur') }
  }

  const handleCreateExport = async (r: ResultItem, format: 'csv' | 'json' | 'excel') => {
    try { await resultsApi.createExport(r.id, format); toast.success(`Export ${format.toUpperCase()} créé`); loadExports() }
    catch { toast.error('Erreur') }
  }

  const showExportDetail = async (e: ExportItem) => {
    setDetail(null)
    try { setDetail(await resultsApi.getExport(e.id)) } catch { toast.error('Détail indisponible') }
  }

  const showRunResults = async (r: ResultItem) => {
    if (!r.run_id) { toast.info('Pas de run associé'); return }
    setDetail(null)
    try { setDetail(await resultsApi.getRunResults(r.run_id)) } catch { toast.error('Données indisponibles') }
  }

  return (
    <DashboardPageShell
      helpKey="exports"
      width="wide"
      title="Exports & résultats"
      description="Téléchargez les sorties de vos pipelines"
    >
      <Tabs defaultValue="exports">
        <TabsList>
          <TabsTrigger value="exports">Exports</TabsTrigger>
          <TabsTrigger value="results">Résultats par pipeline</TabsTrigger>
        </TabsList>

        <TabsContent value="exports" className="space-y-2">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14" />)
          ) : exports.length === 0 ? (
            <Empty icon={<FileDown className="h-8 w-8 text-gray-700" />} label="Aucun export" />
          ) : (
            exports.map((e) => (
              <Card key={e.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10"><FileDown className="h-4 w-4 text-primary" /></div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground truncate">{exportName(e)}</p>
                      {e.format && <Badge variant="secondary" className="text-[10px] h-5 uppercase">{e.format}</Badge>}
                      <Badge variant={statusVariant(e.status)} className="text-[10px] h-5">{e.status ?? 'inconnu'}</Badge>
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {e.pipeline_name ? `${e.pipeline_name} · ` : ''}{e.size_bytes ? `${formatBytes(e.size_bytes)} · ` : ''}{e.created_at ? getRelativeTime(e.created_at) : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button variant="ghost" size="icon-sm" title="Détail" onClick={() => showExportDetail(e)}><Info className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon-sm" title="Télécharger" onClick={() => resultsApi.downloadExport(e)}><Download className="h-4 w-4" /></Button>
                  {statusVariant(e.status) === 'destructive' && (
                    <Button variant="ghost" size="icon-sm" title="Relancer" onClick={() => handleRetry(e)}><RotateCcw className="h-4 w-4" /></Button>
                  )}
                  <Button variant="ghost" size="icon-sm" title="Supprimer" onClick={() => handleRemove(e)} className="text-red-400 hover:text-red-300"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="results" className="space-y-3">
          <Select value={selectedPipeline} onValueChange={loadResults}>
            <SelectTrigger className="w-72"><SelectValue placeholder="Choisir un pipeline" /></SelectTrigger>
            <SelectContent>
              {pipelines.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>

          {resultsLoading ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
          ) : !selectedPipeline ? (
            <Empty icon={<Database className="h-8 w-8 text-gray-700" />} label="Sélectionnez un pipeline" />
          ) : results.length === 0 ? (
            <Empty icon={<Database className="h-8 w-8 text-gray-700" />} label="Aucun résultat" />
          ) : (
            results.map((r) => (
              <Card key={r.id} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{r.name || `Résultat ${r.id.slice(-8)}`}</p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {r.rows != null ? `${r.rows} lignes · ` : ''}{r.created_at ? getRelativeTime(r.created_at) : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button variant="ghost" size="icon-sm" title="Données du run" onClick={() => showRunResults(r)}><Info className="h-4 w-4" /></Button>
                  <Button variant="outline" size="sm" onClick={() => resultsApi.downloadResult(r.id, 'csv')}>CSV</Button>
                  <Button variant="outline" size="sm" onClick={() => resultsApi.downloadResult(r.id, 'json')}>JSON</Button>
                  <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => handleCreateExport(r, 'excel')}>
                    <FileDown className="h-3.5 w-3.5" /> Exporter
                  </Button>
                </div>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={detail != null} onOpenChange={(v) => { if (!v) setDetail(null) }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Détail</DialogTitle></DialogHeader>
          <DetailView detail={detail} />
        </DialogContent>
      </Dialog>
    </DashboardPageShell>
  )
}

// ── Détail visuel (export ou résultat de run) ────────────────────────────────
function DetailView({ detail }: { detail: unknown }) {
  if (detail == null) return null
  const d = detail as Record<string, unknown>

  // Champs « connus » présentés joliment
  const fields: { label: string; value: React.ReactNode }[] = []
  const push = (label: string, val: unknown, fmt?: (v: unknown) => React.ReactNode) => {
    if (val === undefined || val === null || val === '') return
    fields.push({ label, value: fmt ? fmt(val) : String(val) })
  }
  push('Nom', d.name ?? d.filename)
  push('Pipeline', d.pipeline_name)
  push('Format', typeof d.format === 'string' ? d.format.toUpperCase() : undefined)
  push('Statut', d.status, (v) => <Badge variant={statusVariant(String(v))} className="h-5 text-[10px]">{String(v)}</Badge>)
  push('Lignes', d.rows ?? d.rows_count, (v) => formatNumber(Number(v)))
  push('Taille', d.size_bytes, (v) => formatBytes(Number(v)))
  push('Créé', d.created_at, (v) => getRelativeTime(String(v)))
  push('Run', d.run_id, (v) => <span className="font-mono">#{String(v).slice(-8)}</span>)

  // Aperçu tabulaire si des lignes sont présentes
  const previewRows = (Array.isArray(d.preview) ? d.preview : Array.isArray(d.data) ? d.data : Array.isArray(d.rows) ? d.rows : []) as Record<string, unknown>[]
  const cols = previewRows.length > 0 && typeof previewRows[0] === 'object' ? Object.keys(previewRows[0]) : []

  return (
    <div className="space-y-4">
      {fields.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {fields.map((f) => (
            <div key={f.label}>
              <p className="text-[10px] uppercase tracking-wide text-gray-600">{f.label}</p>
              <div className="text-sm text-foreground truncate">{f.value}</div>
            </div>
          ))}
        </div>
      )}

      {cols.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-medium text-gray-500">Aperçu ({previewRows.length} lignes)</p>
          <div className="max-h-[40vh] overflow-auto rounded-lg border border-border">
            <table className="w-full text-left text-[11px] font-mono">
              <thead className="sticky top-0 bg-card">
                <tr>{cols.map((c) => <th key={c} className="px-2 py-1.5 font-semibold text-gray-400 whitespace-nowrap">{c}</th>)}</tr>
              </thead>
              <tbody>
                {previewRows.slice(0, 100).map((row, i) => (
                  <tr key={i} className="border-t border-border">
                    {cols.map((c) => <td key={c} className="px-2 py-1 text-gray-400 whitespace-nowrap max-w-55 truncate">{row[c] == null ? '—' : typeof row[c] === 'object' ? JSON.stringify(row[c]) : String(row[c])}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* JSON brut repliable (pour les devs) */}
      <details className="group">
        <summary className="cursor-pointer text-xs text-gray-600 hover:text-gray-400 select-none">Voir le JSON brut</summary>
        <pre className="mt-2 max-h-60 overflow-auto rounded-lg bg-background p-3 text-[11px] text-gray-500 font-mono">
          {JSON.stringify(detail, null, 2)}
        </pre>
      </details>
    </div>
  )
}

function Empty({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 gap-3">
      {icon}
      <p className="text-sm text-gray-600">{label}</p>
    </div>
  )
}
