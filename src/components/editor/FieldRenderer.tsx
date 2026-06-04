'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { filesApi } from '@/lib/api/files'
import { datasourcesApi, type AppDatasource } from '@/lib/api/datasources'
import { useEditorStore } from '@/store/editor.store'
import { useWorkspaceStore } from '@/store/workspace.store'
import type { FieldDef } from '@/lib/nodeRegistry'

type Cfg = Record<string, unknown>

interface FieldRendererProps {
  field: FieldDef
  value: unknown
  onChange: (value: unknown) => void
}

// ── Tags input (string[]) ───────────────────────────────────────────────────
function TagsField({ value, onChange, placeholder }: { value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [draft, setDraft] = useState('')
  const tags = Array.isArray(value) ? value : []

  const add = () => {
    const v = draft.trim()
    if (v && !tags.includes(v)) onChange([...tags, v])
    setDraft('')
  }

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-1.5">
        {tags.map((t) => (
          <span key={t} className="flex items-center gap-1 rounded-md bg-white/6 border border-white/10 px-2 py-0.5 text-[11px] text-foreground">
            {t}
            <button onClick={() => onChange(tags.filter((x) => x !== t))} className="text-gray-600 hover:text-red-400">
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        ))}
      </div>
      <Input
        className="h-7 text-xs"
        placeholder={placeholder ?? 'Ajouter…'}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add() } }}
        onBlur={add}
      />
    </div>
  )
}

// ── Key/Value (object) ──────────────────────────────────────────────────────
function KVField({ value, onChange }: { value: Cfg; onChange: (v: Cfg) => void }) {
  const obj = (value && typeof value === 'object') ? (value as Cfg) : {}
  const entries = Object.entries(obj)

  const setEntry = (oldKey: string, newKey: string, val: string) => {
    const next: Cfg = {}
    entries.forEach(([k, v]) => { if (k !== oldKey) next[k] = v })
    if (newKey) next[newKey] = val
    onChange(next)
  }

  return (
    <div className="space-y-1.5">
      {entries.map(([k, v], i) => (
        <div key={i} className="flex gap-1.5">
          <Input className="h-7 text-xs flex-1" placeholder="clé" value={k} onChange={(e) => setEntry(k, e.target.value, String(v))} />
          <Input className="h-7 text-xs flex-1" placeholder="valeur" value={String(v)} onChange={(e) => setEntry(k, k, e.target.value)} />
          <button onClick={() => setEntry(k, '', '')} className="text-gray-600 hover:text-red-400 px-1">
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
      <button
        onClick={() => onChange({ ...obj, '': '' })}
        className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-foreground"
      >
        <Plus className="h-3 w-3" /> Ajouter une paire
      </button>
    </div>
  )
}

// ── List of objects (conditions, aggregations, …) ───────────────────────────
function ListField({ field, value, onChange }: { field: FieldDef; value: Cfg[]; onChange: (v: Cfg[]) => void }) {
  const items = Array.isArray(value) ? value : []
  const itemFields = field.itemFields ?? []

  const defaultItem = (): Cfg => {
    const o: Cfg = {}
    itemFields.forEach((f) => { if (f.default !== undefined) o[f.key] = f.default })
    return o
  }

  const update = (idx: number, key: string, val: unknown) => {
    onChange(items.map((it, i) => (i === idx ? { ...it, [key]: val } : it)))
  }

  return (
    <div className="space-y-2">
      {items.map((item, idx) => (
        <div key={idx} className="rounded-lg border border-white/8 bg-white/2 p-2.5 space-y-2 relative">
          <button
            onClick={() => onChange(items.filter((_, i) => i !== idx))}
            className="absolute top-2 right-2 text-gray-600 hover:text-red-400"
          >
            <X className="h-3 w-3" />
          </button>
          {itemFields.map((f) => (
            <FieldRenderer key={f.key} field={f} value={item[f.key]} onChange={(v) => update(idx, f.key, v)} />
          ))}
        </div>
      ))}
      <button
        onClick={() => onChange([...items, defaultItem()])}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-white/12 py-2 text-[11px] text-gray-500 hover:border-primary/40 hover:text-foreground transition-colors"
      >
        <Plus className="h-3 w-3" /> Ajouter {field.itemLabel ?? 'un élément'}
      </button>
    </div>
  )
}

// ── File picker : Select listant les fichiers uploadés (par nom) ─────────────
type PickFile = { id: string; name: string; rows?: number; columns?: number }

function FileField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const pipelineWorkspaceId = useEditorStore((s) => s.pipeline?.workspace_id)
  const currentWorkspaceId = useWorkspaceStore((s) => s.currentWorkspaceId)
  const workspaceId = pipelineWorkspaceId ?? currentWorkspaceId

  const [files, setFiles] = useState<PickFile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError(null)
    filesApi.list(workspaceId)
      .then((res) => { if (alive) setFiles(res as PickFile[]) })
      .catch(() => {
        if (alive) {
          setFiles([])
          setError('Impossible de charger les fichiers')
        }
      })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [workspaceId])

  if (loading) {
    return <div className="h-8 rounded-md border border-border bg-muted/40 px-3 flex items-center text-xs text-muted-foreground">Chargement des fichiers…</div>
  }

  if (files.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border px-3 py-2.5 text-center">
        <p className="text-[11px] text-muted-foreground">
          {error ?? 'Aucun fichier uploadé'}
        </p>
        {!error && (
          <Link href="/dashboard/files" className="text-[11px] text-primary hover:underline">
            Uploader un fichier →
          </Link>
        )}
      </div>
    )
  }

  return (
    <Select value={String(value ?? '')} onValueChange={onChange}>
      <SelectTrigger className="h-8 text-xs">
        <SelectValue placeholder="Sélectionner un fichier" />
      </SelectTrigger>
      <SelectContent>
        {value && !files.some((f) => f.id === value) && (
          <SelectItem value={String(value)} className="text-xs">
            Fichier enregistré ({String(value).slice(-8)})
          </SelectItem>
        )}
        {files.map((f) => (
          <SelectItem key={f.id} value={f.id} className="text-xs">
            <span className="flex items-center gap-2">
              <span className="truncate">{f.name}</span>
              {f.rows != null && (
                <span className="text-[10px] text-muted-foreground">· {f.rows.toLocaleString('fr-FR')} lignes</span>
              )}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

// ── Datasource picker ───────────────────────────────────────────────────────
function DatasourceField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const pipelineWorkspaceId = useEditorStore((s) => s.pipeline?.workspace_id)
  const currentWorkspaceId = useWorkspaceStore((s) => s.currentWorkspaceId)
  const workspaceId = pipelineWorkspaceId ?? currentWorkspaceId

  const [items, setItems] = useState<AppDatasource[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError(null)
    datasourcesApi.list(workspaceId)
      .then((res) => { if (alive) setItems(res) })
      .catch(() => {
        if (alive) {
          setItems([])
          setError('Impossible de charger les sources')
        }
      })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [workspaceId])

  if (loading) {
    return <div className="h-8 rounded-md border border-border bg-muted/40 px-3 flex items-center text-xs text-muted-foreground">Chargement des sources…</div>
  }

  if (items.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border px-3 py-2.5 text-center">
        <p className="text-[11px] text-muted-foreground">
          {error ?? 'Aucune source de données'}
        </p>
        {!error && (
          <Link href="/dashboard/datasources" className="text-[11px] text-primary hover:underline">
            Ajouter une source →
          </Link>
        )}
      </div>
    )
  }

  return (
    <Select value={String(value ?? '')} onValueChange={onChange}>
      <SelectTrigger className="h-8 text-xs">
        <SelectValue placeholder="Sélectionner une source" />
      </SelectTrigger>
      <SelectContent>
        {items.map((ds) => (
          <SelectItem key={ds.id} value={ds.id} className="text-xs">
            <span className="flex items-center gap-2">
              <span className="truncate">{ds.name}</span>
              <span className="text-[10px] text-muted-foreground">· {ds.type}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

// ── Main renderer ───────────────────────────────────────────────────────────
export function FieldRenderer({ field, value, onChange }: FieldRendererProps) {
  const labelEl = (
    <div className="flex items-baseline justify-between">
      <Label className="text-[11px] text-gray-400">{field.label}</Label>
      {field.optional && <span className="text-[9px] text-gray-700">optionnel</span>}
    </div>
  )

  const help = field.help && <p className="text-[10px] text-gray-700 leading-snug">{field.help}</p>

  switch (field.type) {
    case 'boolean':
      return (
        <div className="flex items-center justify-between py-1">
          <Label className="text-[11px] text-gray-400">{field.label}</Label>
          <Switch checked={Boolean(value ?? field.default)} onCheckedChange={onChange} />
        </div>
      )

    case 'select':
      return (
        <div className="space-y-1">
          {labelEl}
          <Select value={String(value ?? field.default ?? '')} onValueChange={onChange}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Choisir…" /></SelectTrigger>
            <SelectContent>
              {field.options?.map((o) => <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
          {help}
        </div>
      )

    case 'sql':
    case 'textarea':
      return (
        <div className="space-y-1">
          {labelEl}
          <Textarea
            className={`text-xs min-h-[70px] ${field.type === 'sql' ? 'font-mono' : ''}`}
            placeholder={field.placeholder}
            value={String(value ?? '')}
            onChange={(e) => onChange(e.target.value)}
          />
          {help}
        </div>
      )

    case 'number':
      return (
        <div className="space-y-1">
          {labelEl}
          <Input
            type="number" className="h-8 text-xs"
            placeholder={field.placeholder}
            value={value === undefined || value === null ? String(field.default ?? '') : String(value)}
            onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
          />
          {help}
        </div>
      )

    case 'tags':
      return (
        <div className="space-y-1">
          {labelEl}
          <TagsField value={value as string[]} onChange={onChange} placeholder={field.placeholder} />
          {help}
        </div>
      )

    case 'kv':
      return (
        <div className="space-y-1">
          {labelEl}
          <KVField value={value as Cfg} onChange={onChange} />
          {help}
        </div>
      )

    case 'list':
      return (
        <div className="space-y-1.5">
          {labelEl}
          <ListField field={field} value={value as Cfg[]} onChange={onChange} />
          {help}
        </div>
      )

    case 'file':
      return (
        <div className="space-y-1">
          {labelEl}
          <FileField value={value as string} onChange={onChange} />
          {help}
        </div>
      )

    case 'datasource':
      return (
        <div className="space-y-1">
          {labelEl}
          <DatasourceField value={value as string} onChange={onChange} />
          {help}
        </div>
      )

    case 'text':
    default:
      return (
        <div className="space-y-1">
          {labelEl}
          <Input
            className="h-8 text-xs"
            placeholder={field.placeholder}
            value={value === undefined || value === null ? String(field.default ?? '') : String(value)}
            onChange={(e) => onChange(e.target.value)}
          />
          {help}
        </div>
      )
  }
}
