'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Play, Square, RotateCcw, Save, ChevronLeft, Zap,
  Clock, History, Sparkles, Terminal, CheckCircle2, XCircle, Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from '@/components/ui/tooltip'
import { useEditorStore } from '@/store/editor.store'
import { pipelinesApi } from '@/lib/api/pipelines'
import { runsApi } from '@/lib/api/runs'
import { validatePipelineForRun, watchRun, finalizeRunNodeStatuses } from '@/lib/runWatcher'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface EditorTopBarProps {
  pipelineId: string
}

export function EditorTopBar({ pipelineId }: EditorTopBarProps) {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const stopWatchRef = useRef<(() => void) | null>(null)
  const {
    pipeline, nodes, edges, isDirty, isRunning, runStatus,
    activeRunId, setActiveRun, setRunStatus, setNodeStatus, appendLog,
    resetRun, isConsoleOpen, setConsoleOpen, setAIChatOpen,
  } = useEditorStore()

  useEffect(() => () => { stopWatchRef.current?.() }, [])

  const handleSave = async () => {
    if (!pipeline) return
    setIsSaving(true)
    try {
      // Les nœuds et arêtes sont déjà persistés à chaque opération (ajout, drag,
      // édition). Ici on persiste les métadonnées du pipeline.
      await pipelinesApi.save(pipelineId, { name: pipeline.name })
      useEditorStore.getState().markClean()
      toast.success('Pipeline sauvegardé')
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setIsSaving(false)
    }
  }

  const handleRun = async () => {
    const issues = validatePipelineForRun(nodes)
    if (issues.length > 0) {
      setConsoleOpen(true)
      toast.error(issues[0], {
        description: issues.length > 1 ? `+ ${issues.length - 1} autre(s) problème(s)` : undefined,
      })
      return
    }
    try {
      if (isDirty) await handleSave()
      const run = await runsApi.run(pipelineId)
      stopWatchRef.current?.()
      setActiveRun(run.id)
      setRunStatus('running')
      setConsoleOpen(true)

      const activeNodeIds = nodes
        .filter((n) => !(n.data as Record<string, unknown>).disabled)
        .map((n) => n.id)

      stopWatchRef.current = watchRun({
        pipelineId,
        runId: run.id,
        nodeIds: activeNodeIds,
        onLog: (log) => appendLog(log),
        onNodeStatus: (nodeId, status) => setNodeStatus(nodeId, status),
        onComplete: (status) => {
          finalizeRunNodeStatuses(
            activeNodeIds,
            useEditorStore.getState().nodeStatuses,
            status,
            setNodeStatus,
          )
          setRunStatus(status)
          toast[status === 'success' ? 'success' : 'error'](
            status === 'success' ? 'Run terminé avec succès' : 'Run terminé avec erreurs',
          )
        },
      })
    } catch {
      toast.error('Erreur lors du lancement')
    }
  }

  const handleCancel = async () => {
    if (!activeRunId) return
    stopWatchRef.current?.()
    stopWatchRef.current = null
    try {
      await runsApi.cancel(pipelineId, activeRunId)
      setRunStatus('cancelled')
      resetRun()
      toast.info('Run annulé')
    } catch {
      toast.error('Impossible d\'annuler')
    }
  }

  const statusIcon = runStatus === 'running' || runStatus === 'queued'
    ? <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-400" />
    : runStatus === 'success'
    ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
    : runStatus === 'failed'
    ? <XCircle className="h-3.5 w-3.5 text-red-400" />
    : null

  return (
    <div className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-background px-4">
      {/* Left */}
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/15">
          <Zap className="h-3.5 w-3.5 text-primary" />
        </div>
        <span className="text-sm font-semibold text-foreground">{pipeline?.name}</span>
        {isDirty && (
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" title="Modifications non sauvegardées" />
        )}
      </div>

      {/* Right — les icônes outils sont passées dans la barre verticale du canvas */}
      <div className="flex items-center gap-1.5">
        {statusIcon && (
          <div className="flex items-center gap-1.5 mr-1 text-xs text-gray-500">
            {statusIcon}
            <span className="capitalize">{runStatus}</span>
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={handleSave}
          disabled={isSaving || !isDirty}
          className="gap-1.5"
        >
          <Save className="h-3.5 w-3.5" />
          {isSaving ? 'Sauvegarde…' : 'Sauvegarder'}
        </Button>
      </div>
    </div>
  )
}
