'use client'

import { useEffect, useState } from 'react'
import { Camera, RotateCcw, GitCompare, Plus, Minus, PencilLine, ArrowRight } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { pipelinesApi } from '@/lib/api/pipelines'
import { getRelativeTime } from '@/lib/utils'
import { toast } from 'sonner'
import type { Pipeline, PipelineVersion } from '@/types'

export function PipelineVersionsDialog({
  pipeline,
  onClose,
}: {
  pipeline: Pipeline | null
  onClose: () => void
}) {
  const [versions, setVersions] = useState<PipelineVersion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [label, setLabel] = useState('')
  const [busy, setBusy] = useState(false)
  const [versionA, setVersionA] = useState<string>('')
  const [versionB, setVersionB] = useState<string>('')
  const [diff, setDiff] = useState<unknown>(null)

  useEffect(() => {
    if (!pipeline) return
    load(pipeline.id)
    setDiff(null)
    setVersionA('')
    setVersionB('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pipeline])

  const load = async (id: string) => {
    setIsLoading(true)
    try {
      setVersions(await pipelinesApi.getVersions(id))
    } catch {
      toast.error('Erreur de chargement des versions')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSnapshot = async () => {
    if (!pipeline) return
    setBusy(true)
    try {
      await pipelinesApi.createSnapshot(pipeline.id, label || undefined)
      toast.success('Snapshot créé')
      setLabel('')
      load(pipeline.id)
    } catch { toast.error('Erreur') } finally { setBusy(false) }
  }

  const handleRestore = async (v: PipelineVersion) => {
    if (!pipeline) return
    try {
      await pipelinesApi.restoreVersion(pipeline.id, v.id)
      toast.success(`Version ${v.version} restaurée`)
    } catch { toast.error('Erreur de restauration') }
  }

  const handleDiff = async () => {
    if (!pipeline || !versionA || !versionB) return
    try {
      setDiff(await pipelinesApi.getDiff(pipeline.id, versionA, versionB))
    } catch { toast.error('Comparaison impossible') }
  }

  return (
    <Dialog open={Boolean(pipeline)} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Versions — {pipeline?.name}</DialogTitle>
        </DialogHeader>

        {/* Snapshot */}
        <div className="flex items-center gap-2">
          <Input placeholder="Label du snapshot (optionnel)" value={label} onChange={(e) => setLabel(e.target.value)} />
          <Button className="gap-2 shrink-0" onClick={handleSnapshot} disabled={busy}>
            <Camera className="h-4 w-4" /> Snapshot
          </Button>
        </div>

        {/* Liste */}
        <div className="max-h-64 overflow-auto space-y-2">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12" />)
          ) : versions.length === 0 ? (
            <p className="text-center text-sm text-gray-600 py-6">Aucune version enregistrée</p>
          ) : (
            versions.map((v) => (
              <div key={v.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                <div className="flex items-center gap-2.5">
                  <Badge variant="secondary" className="h-5">v{v.version}</Badge>
                  <div>
                    <p className="text-sm text-foreground">{v.label ?? `Version ${v.version}`}</p>
                    <p className="text-xs text-gray-600">{v.author} · {getRelativeTime(v.created_at)} · {v.nodes_count} nœuds</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => handleRestore(v)}>
                  <RotateCcw className="h-3.5 w-3.5" /> Restaurer
                </Button>
              </div>
            ))
          )}
        </div>

        {/* Diff */}
        {versions.length >= 2 && (
          <div className="space-y-2 border-t border-border pt-3">
            <p className="text-xs font-medium text-gray-500">Comparer deux versions</p>
            <div className="flex items-center gap-2">
              <Select value={versionA} onValueChange={setVersionA}>
                <SelectTrigger className="flex-1"><SelectValue placeholder="Version A" /></SelectTrigger>
                <SelectContent>
                  {versions.map((v) => <SelectItem key={v.id} value={v.id}>v{v.version}{v.label ? ` — ${v.label}` : ''}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={versionB} onValueChange={setVersionB}>
                <SelectTrigger className="flex-1"><SelectValue placeholder="Version B" /></SelectTrigger>
                <SelectContent>
                  {versions.map((v) => <SelectItem key={v.id} value={v.id}>v{v.version}{v.label ? ` — ${v.label}` : ''}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={handleDiff} disabled={!versionA || !versionB} title="Comparer">
                <GitCompare className="h-4 w-4" />
              </Button>
            </div>
            {diff != null && <VersionDiffView diff={diff as DiffShape} />}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ── Diff visuel entre deux versions ──────────────────────────────────────────
type DiffNode = { id?: string; type?: string; label?: string; config?: Record<string, unknown> }
type DiffEdge = { source?: string; target?: string }
type DiffShape = {
  nodes?: { added?: DiffNode[]; removed?: DiffNode[]; modified?: { before: DiffNode; after: DiffNode }[] }
  edges?: { added?: DiffEdge[]; removed?: DiffEdge[] }
}

function nodeName(n?: DiffNode): string {
  return n?.label || n?.type || (n?.id ? n.id.slice(0, 8) : '—')
}

// Liste des clés de config qui ont changé entre deux nœuds
function changedKeys(before?: DiffNode, after?: DiffNode): { key: string; from: string; to: string }[] {
  const a = (before?.config ?? {}) as Record<string, unknown>
  const b = (after?.config ?? {}) as Record<string, unknown>
  const keys = new Set([...Object.keys(a), ...Object.keys(b)])
  const out: { key: string; from: string; to: string }[] = []
  if ((before?.label ?? '') !== (after?.label ?? '')) {
    out.push({ key: 'nom', from: String(before?.label ?? '—'), to: String(after?.label ?? '—') })
  }
  for (const k of keys) {
    const fa = JSON.stringify(a[k] ?? null), fb = JSON.stringify(b[k] ?? null)
    if (fa !== fb) out.push({ key: k, from: fa === 'null' ? '—' : fa.replace(/^"|"$/g, ''), to: fb === 'null' ? '—' : fb.replace(/^"|"$/g, '') })
  }
  return out
}

function VersionDiffView({ diff }: { diff: DiffShape }) {
  const added = diff.nodes?.added ?? []
  const removed = diff.nodes?.removed ?? []
  const modified = diff.nodes?.modified ?? []
  const edgesAdded = diff.edges?.added ?? []
  const edgesRemoved = diff.edges?.removed ?? []

  const total = added.length + removed.length + modified.length + edgesAdded.length + edgesRemoved.length
  if (total === 0) {
    return (
      <div className="rounded-lg border border-border bg-background py-6 text-center text-sm text-gray-500">
        Aucune différence — les deux versions sont identiques.
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-background p-3 space-y-3 max-h-64 overflow-auto">
      {/* Compteurs */}
      <div className="flex flex-wrap gap-1.5 text-[11px]">
        {added.length > 0 && <span className="rounded-full bg-emerald-500/15 text-emerald-400 px-2 py-0.5">+{added.length} nœud{added.length > 1 ? 's' : ''}</span>}
        {removed.length > 0 && <span className="rounded-full bg-red-500/15 text-red-400 px-2 py-0.5">−{removed.length} nœud{removed.length > 1 ? 's' : ''}</span>}
        {modified.length > 0 && <span className="rounded-full bg-amber-500/15 text-amber-400 px-2 py-0.5">~{modified.length} modifié{modified.length > 1 ? 's' : ''}</span>}
        {(edgesAdded.length + edgesRemoved.length) > 0 && <span className="rounded-full bg-blue-500/15 text-blue-400 px-2 py-0.5">arêtes +{edgesAdded.length} / −{edgesRemoved.length}</span>}
      </div>

      {/* Nœuds ajoutés */}
      {added.map((n, i) => (
        <div key={`a${i}`} className="flex items-center gap-2 text-sm">
          <Plus className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
          <span className="text-foreground">{nodeName(n)}</span>
          {n.type && <Badge variant="secondary" className="h-4 text-[9px]">{n.type}</Badge>}
        </div>
      ))}

      {/* Nœuds supprimés */}
      {removed.map((n, i) => (
        <div key={`r${i}`} className="flex items-center gap-2 text-sm">
          <Minus className="h-3.5 w-3.5 shrink-0 text-red-400" />
          <span className="text-gray-500 line-through">{nodeName(n)}</span>
          {n.type && <Badge variant="secondary" className="h-4 text-[9px]">{n.type}</Badge>}
        </div>
      ))}

      {/* Nœuds modifiés */}
      {modified.map((m, i) => {
        const changes = changedKeys(m.before, m.after)
        return (
          <div key={`m${i}`} className="space-y-1">
            <div className="flex items-center gap-2 text-sm">
              <PencilLine className="h-3.5 w-3.5 shrink-0 text-amber-400" />
              <span className="text-foreground">{nodeName(m.after)}</span>
            </div>
            <div className="ml-5 space-y-0.5">
              {changes.length === 0 ? (
                <p className="text-[11px] text-gray-600">position / ordre modifié</p>
              ) : changes.map((c) => (
                <div key={c.key} className="flex items-center gap-1.5 text-[11px]">
                  <span className="font-mono text-gray-500">{c.key}</span>
                  <span className="font-mono text-red-400/80 truncate max-w-[120px]">{c.from}</span>
                  <ArrowRight className="h-3 w-3 shrink-0 text-gray-600" />
                  <span className="font-mono text-emerald-400/90 truncate max-w-[120px]">{c.to}</span>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {/* Arêtes */}
      {(edgesAdded.length > 0 || edgesRemoved.length > 0) && (
        <div className="space-y-0.5 border-t border-border pt-2">
          {edgesAdded.map((e, i) => (
            <div key={`ea${i}`} className="flex items-center gap-1.5 text-[11px]">
              <Plus className="h-3 w-3 shrink-0 text-emerald-400" />
              <span className="font-mono text-gray-400">{(e.source ?? '?').slice(0, 8)}</span>
              <ArrowRight className="h-3 w-3 text-gray-600" />
              <span className="font-mono text-gray-400">{(e.target ?? '?').slice(0, 8)}</span>
            </div>
          ))}
          {edgesRemoved.map((e, i) => (
            <div key={`er${i}`} className="flex items-center gap-1.5 text-[11px]">
              <Minus className="h-3 w-3 shrink-0 text-red-400" />
              <span className="font-mono text-gray-500 line-through">{(e.source ?? '?').slice(0, 8)}</span>
              <ArrowRight className="h-3 w-3 text-gray-600" />
              <span className="font-mono text-gray-500 line-through">{(e.target ?? '?').slice(0, 8)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
