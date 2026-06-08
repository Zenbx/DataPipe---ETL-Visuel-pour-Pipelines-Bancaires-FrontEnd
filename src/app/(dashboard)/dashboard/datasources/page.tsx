'use client'

import { useEffect, useState } from 'react'
import { Database, Plus, Trash2, RefreshCw, PlugZap, Table2, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { StructuredConfigForm } from '@/components/forms/StructuredConfigForm'
import {
  DATASOURCE_CONFIG_FIELDS,
  buildConfigObject,
  defaultConfigValues,
  validateConfigFields,
} from '@/lib/configFields'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { datasourcesApi, type AppDatasource, type DatasourceType } from '@/lib/api/datasources'
import { useWorkspaceStore } from '@/store/workspace.store'
import { getRelativeTime } from '@/lib/utils'
import { toast } from 'sonner'
import { DashboardPageShell } from '@/components/layout/DashboardPageShell'
import { DatasourceSchemaView } from '@/components/datasources/DatasourceSchemaView'

const TYPES: { value: DatasourceType; label: string }[] = [
  { value: 'postgresql', label: 'PostgreSQL' },
  { value: 'mysql', label: 'MySQL' },
  { value: 'sqlite', label: 'SQLite' },
  { value: 'mongodb', label: 'MongoDB' },
  { value: 'api', label: 'API REST' },
  { value: 's3', label: 'Amazon S3' },
]

const SYNC_VARIANT = { idle: 'secondary', syncing: 'running', error: 'destructive' } as const

export default function DatasourcesPage() {
  const [items, setItems] = useState<AppDatasource[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({
    name: '',
    type: 'postgresql' as DatasourceType,
    configValues: defaultConfigValues(DATASOURCE_CONFIG_FIELDS.postgresql ?? []),
  })
  const [busy, setBusy] = useState(false)
  const [editing, setEditing] = useState<AppDatasource | null>(null)
  const [schemaFor, setSchemaFor] = useState<AppDatasource | null>(null)
  const [schema, setSchema] = useState<unknown>(null)
  const [testingId, setTestingId] = useState<string | null>(null)
  const [syncingId, setSyncingId] = useState<string | null>(null)
  const workspaceId = useWorkspaceStore((s) => s.currentWorkspaceId)

  useEffect(() => { load() }, [workspaceId]) // eslint-disable-line react-hooks/exhaustive-deps

  const load = async () => {
    if (!workspaceId || workspaceId === 'default') return
    setIsLoading(true)
    try { setItems(await datasourcesApi.list(workspaceId)) }
    catch { toast.error('Erreur de chargement') }
    finally { setIsLoading(false) }
  }

  const openCreate = () => setShowCreate(true)

  const configFields = DATASOURCE_CONFIG_FIELDS[form.type] ?? []

  const handleTypeChange = (type: DatasourceType) => {
    setForm({
      ...form,
      type,
      configValues: defaultConfigValues(DATASOURCE_CONFIG_FIELDS[type] ?? []),
    })
  }

  const handleCreate = async () => {
    if (!form.name.trim()) return
    const err = validateConfigFields(configFields, form.configValues)
    if (err) { toast.error(err); return }
    const config = buildConfigObject(configFields, form.configValues)
    setBusy(true)
    try {
      await datasourcesApi.create({ name: form.name, type: form.type, config, workspace_id: workspaceId })
      toast.success('Source créée')
      setShowCreate(false)
      setForm({
        name: '',
        type: 'postgresql',
        configValues: defaultConfigValues(DATASOURCE_CONFIG_FIELDS.postgresql ?? []),
      })
      load()
    } catch { toast.error('Création impossible') } finally { setBusy(false) }
  }

  const handleTest = async (ds: AppDatasource) => {
    setTestingId(ds.id)
    try {
      const res = await datasourcesApi.test(ds.id)
      res.ok ? toast.success(res.message ?? 'Connexion réussie') : toast.error(res.message ?? 'Connexion échouée')
    } catch { toast.error('Test impossible') } finally { setTestingId(null) }
  }

  const handleSync = async (ds: AppDatasource) => {
    setSyncingId(ds.id)
    try {
      await datasourcesApi.sync(ds.id)
      const status = (await datasourcesApi.getSyncStatus(ds.id)) as { sync_status?: string }
      toast.success(`Synchronisation : ${status.sync_status ?? 'lancée'}`)
      load()
    } catch { toast.error('Synchronisation impossible') } finally { setSyncingId(null) }
  }

  const openSchema = async (ds: AppDatasource) => {
    setSchemaFor(ds)
    setSchema(null)
    try { setSchema(await datasourcesApi.getSchema(ds.id)) }
    catch { toast.error('Schéma indisponible') }
  }

  const openEdit = async (ds: AppDatasource) => {
    try { setEditing(await datasourcesApi.get(ds.id)) }
    catch { setEditing(ds) }
  }

  const handleUpdate = async () => {
    if (!editing) return
    setBusy(true)
    try {
      await datasourcesApi.update(editing.id, { name: editing.name, active: editing.active })
      toast.success('Source mise à jour')
      setEditing(null)
      load()
    } catch { toast.error('Erreur') } finally { setBusy(false) }
  }

  const handleDelete = async (ds: AppDatasource) => {
    try {
      await datasourcesApi.remove(ds.id)
      setItems((prev) => prev.filter((d) => d.id !== ds.id))
      toast.success('Source supprimée')
    } catch { toast.error('Erreur') }
  }

  return (
    <DashboardPageShell
      helpKey="datasources"
      width="wide"
      title="Sources de données"
      description={`${items.length} source${items.length > 1 ? 's' : ''} connectée${items.length > 1 ? 's' : ''}`}
      actions={(
        <Button className="gap-2" onClick={openCreate}>
          <Plus className="h-4 w-4" /> Nouvelle source
        </Button>
      )}
    >
      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 gap-3">
          <Database className="h-10 w-10 text-gray-700" />
          <p className="text-sm text-gray-600">Aucune source de données connectée</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((ds) => (
            <Card key={ds.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <Database className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{ds.name}</p>
                    <Badge variant="secondary" className="text-[10px] h-5 uppercase">{ds.type}</Badge>
                    <Badge variant={SYNC_VARIANT[ds.sync_status]} className="text-[10px] h-5">{ds.sync_status}</Badge>
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {ds.last_synced_at ? `Sync ${getRelativeTime(ds.last_synced_at)}` : 'Jamais synchronisée'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Button variant="ghost" size="icon-sm" title="Tester la connexion" onClick={() => handleTest(ds)} disabled={testingId === ds.id}>
                  <PlugZap className={`h-4 w-4 ${testingId === ds.id ? 'animate-pulse text-amber-400' : ''}`} />
                </Button>
                <Button variant="ghost" size="icon-sm" title="Synchroniser" onClick={() => handleSync(ds)} disabled={syncingId === ds.id}>
                  <RefreshCw className={`h-4 w-4 ${syncingId === ds.id ? 'animate-spin' : ''}`} />
                </Button>
                <Button variant="ghost" size="icon-sm" title="Schéma" onClick={() => openSchema(ds)}>
                  <Table2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon-sm" title="Modifier" onClick={() => openEdit(ds)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon-sm" title="Supprimer" onClick={() => handleDelete(ds)} className="text-red-400 hover:text-red-300">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Création */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nouvelle source de données</DialogTitle></DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <Label>Nom</Label>
              <Input placeholder="Ex: Prod PostgreSQL" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => handleTypeChange(v as DatasourceType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <StructuredConfigForm
              fields={configFields}
              values={form.configValues}
              onChange={(configValues) => setForm({ ...form, configValues })}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Annuler</Button>
            <Button onClick={handleCreate} disabled={busy || !form.name.trim()}>{busy ? 'Création…' : 'Créer'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Édition */}
      <Dialog open={Boolean(editing)} onOpenChange={(v) => { if (!v) setEditing(null) }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Modifier la source</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3 py-1">
              <div className="space-y-1.5">
                <Label>Nom</Label>
                <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                <span className="text-sm text-gray-400">Source active</span>
                <Switch checked={editing.active} onCheckedChange={(v) => setEditing({ ...editing, active: v })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Annuler</Button>
            <Button onClick={handleUpdate} disabled={busy}>{busy ? 'Enregistrement…' : 'Enregistrer'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schéma */}
      <Dialog open={Boolean(schemaFor)} onOpenChange={(v) => { if (!v) setSchemaFor(null) }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Schéma — {schemaFor?.name}</DialogTitle></DialogHeader>
          {schema == null ? (
            <Skeleton className="h-40" />
          ) : (
            <DatasourceSchemaView schema={schema} datasourceName={schemaFor?.name} />
          )}
        </DialogContent>
      </Dialog>
    </DashboardPageShell>
  )
}
