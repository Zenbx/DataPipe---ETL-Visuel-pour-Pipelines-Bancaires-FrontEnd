'use client'

import { useEffect, useMemo, useState } from 'react'
import { CalendarClock, Plus, Play, Pause, Zap, Trash2, History as HistoryIcon, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { schedulingApi, type AppSchedule } from '@/lib/api/scheduling'
import { pipelinesApi } from '@/lib/api/pipelines'
import { useWorkspaceStore } from '@/store/workspace.store'
import { getRelativeTime } from '@/lib/utils'
import { toast } from 'sonner'
import type { Pipeline } from '@/types'
import { DashboardPageShell } from '@/components/layout/DashboardPageShell'
import { CronSchedulePicker } from '@/components/scheduling/CronSchedulePicker'
import { ScheduledRunsView } from '@/components/scheduling/ScheduledRunsView'
import { describeCron, TIMEZONE_OPTIONS } from '@/lib/cronSchedule'

export default function SchedulingPage() {
  const [schedules, setSchedules] = useState<AppSchedule[]>([])
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<AppSchedule | null>(null)
  const [form, setForm] = useState({ pipelineId: '', cron: '0 0 * * *', timezone: 'UTC' })
  const [busy, setBusy] = useState(false)
  const [runsFor, setRunsFor] = useState<AppSchedule | null>(null)
  const [runs, setRuns] = useState<unknown>(null)
  const workspaceId = useWorkspaceStore((s) => s.currentWorkspaceId)

  const pipelineName = useMemo(() => {
    const m = new Map<string, string>()
    pipelines.forEach((p) => m.set(p.id, p.name))
    return m
  }, [pipelines])

  const timezoneOptions = useMemo(() => {
    if (form.timezone && !TIMEZONE_OPTIONS.some((t) => t.value === form.timezone)) {
      return [...TIMEZONE_OPTIONS, { value: form.timezone, label: form.timezone }]
    }
    return TIMEZONE_OPTIONS
  }, [form.timezone])

  useEffect(() => { load() }, [workspaceId]) // eslint-disable-line react-hooks/exhaustive-deps

  const load = async () => {
    if (!workspaceId || workspaceId === 'default') return
    setIsLoading(true)
    try {
      const [sch, pls] = await Promise.all([
        schedulingApi.listAll(workspaceId),
        pipelinesApi.list({ workspace_id: workspaceId, per_page: 50 }),
      ])
      setSchedules(sch)
      setPipelines(pls.data)
    } catch { toast.error('Erreur de chargement') }
    finally { setIsLoading(false) }
  }

  const openCreate = () => {
    setEditing(null)
    setForm({ pipelineId: '', cron: '0 0 * * *', timezone: 'UTC' })
    setShowForm(true)
  }

  const openEdit = (s: AppSchedule) => {
    setEditing(s)
    setForm({ pipelineId: s.pipeline_id, cron: s.cron, timezone: s.timezone })
    setShowForm(true)
  }

  const handleSubmit = async () => {
    if (!form.pipelineId || !form.cron.trim()) { toast.error('Pipeline et cron requis'); return }
    setBusy(true)
    try {
      if (editing) {
        await schedulingApi.update(form.pipelineId, { cron: form.cron, timezone: form.timezone })
        toast.success('Planning mis à jour')
      } else {
        await schedulingApi.create(form.pipelineId, { cron: form.cron, timezone: form.timezone })
        toast.success('Planning créé')
      }
      setShowForm(false)
      load()
    } catch { toast.error('Erreur') } finally { setBusy(false) }
  }

  const toggleActive = async (s: AppSchedule) => {
    try {
      if (s.active) { await schedulingApi.pause(s.pipeline_id); toast.success('Planning suspendu') }
      else { await schedulingApi.resume(s.pipeline_id); toast.success('Planning repris') }
      load()
    } catch { toast.error('Erreur') }
  }

  const handleTrigger = async (s: AppSchedule) => {
    try { await schedulingApi.trigger(s.id); toast.success('Exécution déclenchée') }
    catch { toast.error('Erreur') }
  }

  const handleRemove = async (s: AppSchedule) => {
    try { await schedulingApi.remove(s.pipeline_id); setSchedules((p) => p.filter((x) => x.id !== s.id)); toast.success('Planning supprimé') }
    catch { toast.error('Erreur') }
  }

  const openRuns = async (s: AppSchedule) => {
    setRunsFor(s)
    setRuns(null)
    try { setRuns(await schedulingApi.getRuns(s.id)) } catch { toast.error('Runs indisponibles') }
  }

  return (
    <DashboardPageShell
      helpKey="scheduling"
      width="default"
      title="Planification"
      description={`${schedules.length} planning${schedules.length > 1 ? 's' : ''}`}
      actions={(
        <Button className="gap-2" onClick={openCreate}><Plus className="h-4 w-4" /> Nouveau planning</Button>
      )}
    >
      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : schedules.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 gap-3">
          <CalendarClock className="h-10 w-10 text-gray-700" />
          <p className="text-sm text-gray-600">Aucune planification</p>
        </div>
      ) : (
        <div className="space-y-2">
          {schedules.map((s) => (
            <Card key={s.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10"><CalendarClock className="h-4 w-4 text-primary" /></div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{pipelineName.get(s.pipeline_id) ?? s.pipeline_id.slice(0, 8)}</p>
                    <Badge variant={s.active ? 'success' : 'secondary'} className="text-[10px] h-5">{s.active ? 'actif' : 'en pause'}</Badge>
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {describeCron(s.cron)}
                    <span className="text-gray-700"> · </span>
                    {s.timezone}
                    {s.next_run_at && ` · prochain ${getRelativeTime(s.next_run_at)}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Button variant="ghost" size="icon-sm" title="Déclencher" onClick={() => handleTrigger(s)}><Zap className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon-sm" title={s.active ? 'Suspendre' : 'Reprendre'} onClick={() => toggleActive(s)}>
                  {s.active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="icon-sm" title="Runs" onClick={() => openRuns(s)}><HistoryIcon className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon-sm" title="Modifier" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon-sm" title="Supprimer" onClick={() => handleRemove(s)} className="text-red-400 hover:text-red-300"><Trash2 className="h-4 w-4" /></Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Form */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Modifier le planning' : 'Nouveau planning'}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <Label>Pipeline</Label>
              <Select value={form.pipelineId} onValueChange={(v) => setForm({ ...form, pipelineId: v })} disabled={Boolean(editing)}>
                <SelectTrigger><SelectValue placeholder="Choisir un pipeline" /></SelectTrigger>
                <SelectContent>
                  {pipelines.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <CronSchedulePicker
              value={form.cron}
              onChange={(cron) => setForm({ ...form, cron })}
            />
            <div className="space-y-1.5">
              <Label>Fuseau horaire</Label>
              <Select value={form.timezone} onValueChange={(v) => setForm({ ...form, timezone: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {timezoneOptions.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Annuler</Button>
            <Button onClick={handleSubmit} disabled={busy}>{busy ? 'Enregistrement…' : editing ? 'Mettre à jour' : 'Créer'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Runs */}
      <Dialog open={Boolean(runsFor)} onOpenChange={(v) => { if (!v) setRunsFor(null) }}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>Runs planifiés — {runsFor ? (pipelineName.get(runsFor.pipeline_id) ?? '') : ''}</DialogTitle></DialogHeader>
          {runs == null ? <Skeleton className="h-32" /> : (
            <ScheduledRunsView
              data={runs}
              pipelineName={runsFor ? (pipelineName.get(runsFor.pipeline_id) ?? undefined) : undefined}
            />
          )}
        </DialogContent>
      </Dialog>
    </DashboardPageShell>
  )
}
