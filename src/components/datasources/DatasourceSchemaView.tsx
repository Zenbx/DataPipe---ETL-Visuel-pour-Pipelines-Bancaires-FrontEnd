'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, Table2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type SchemaColumn = {
  name: string
  type: string
  primaryKey?: boolean
  nullable?: boolean
}

type SchemaTable = {
  name: string
  columns: SchemaColumn[]
}

function parseColumns(raw: unknown): SchemaColumn[] {
  if (!Array.isArray(raw)) return []
  const out: SchemaColumn[] = []
  for (const col of raw) {
    if (typeof col === 'string') {
      out.push({ name: col, type: '—' })
      continue
    }
    if (!col || typeof col !== 'object') continue
    const c = col as Record<string, unknown>
    const name = String(c.name ?? c.column ?? '')
    if (!name) continue
    out.push({
      name,
      type: String(c.type ?? c.data_type ?? '—'),
      primaryKey: Boolean(c.primary_key ?? c.primaryKey ?? c.pk),
      nullable: c.nullable === undefined ? undefined : Boolean(c.nullable),
    })
  }
  return out
}

export function parseDatasourceSchema(raw: unknown): SchemaTable[] {
  if (!raw || typeof raw !== 'object') return []
  const root = raw as Record<string, unknown>
  const inner = root.schema ?? root

  let tablesRaw: unknown[] = []
  if (Array.isArray(inner)) {
    tablesRaw = inner
  } else if (inner && typeof inner === 'object') {
    const obj = inner as Record<string, unknown>
    if (Array.isArray(obj.tables)) tablesRaw = obj.tables
    else if (Array.isArray(obj.collections)) tablesRaw = obj.collections
  }

  const out: SchemaTable[] = []
  for (const t of tablesRaw) {
    if (!t || typeof t !== 'object') continue
    const table = t as Record<string, unknown>
    const name = String(table.name ?? table.table ?? '')
    const columns = parseColumns(table.columns ?? table.fields ?? table.schema)
    if (!name && columns.length === 0) continue
    out.push({ name: name || 'Sans nom', columns })
  }
  return out
}

function TableBlock({ table }: { table: SchemaTable }) {
  const [open, setOpen] = useState(true)

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 bg-card/60 px-3 py-2.5 text-left hover:bg-card transition-colors"
      >
        {open ? <ChevronDown className="h-4 w-4 text-gray-500 shrink-0" /> : <ChevronRight className="h-4 w-4 text-gray-500 shrink-0" />}
        <Table2 className="h-4 w-4 text-primary shrink-0" />
        <span className="text-sm font-medium text-foreground">{table.name}</span>
        <Badge variant="secondary" className="ml-auto text-[10px] h-5">
          {table.columns.length} colonne{table.columns.length > 1 ? 's' : ''}
        </Badge>
      </button>

      {open && table.columns.length > 0 && (
        <div className="max-h-56 overflow-auto border-t border-border">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-background">
              <tr className="text-[10px] uppercase tracking-wide text-gray-600">
                <th className="px-3 py-2 font-semibold">Colonne</th>
                <th className="px-3 py-2 font-semibold">Type</th>
                <th className="px-3 py-2 font-semibold">Attributs</th>
              </tr>
            </thead>
            <tbody>
              {table.columns.map((col) => (
                <tr key={col.name} className="border-t border-border/60">
                  <td className="px-3 py-2 font-mono text-foreground">{col.name}</td>
                  <td className="px-3 py-2 font-mono text-gray-400">{col.type}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      {col.primaryKey && (
                        <Badge variant="outline" className="text-[9px] h-4 border-primary/40 text-primary">PK</Badge>
                      )}
                      {col.nullable === false && (
                        <Badge variant="outline" className="text-[9px] h-4">requis</Badge>
                      )}
                      {col.nullable === true && (
                        <Badge variant="secondary" className="text-[9px] h-4">nullable</Badge>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {open && table.columns.length === 0 && (
        <p className="border-t border-border px-3 py-2 text-xs text-gray-600">Aucune colonne décrite pour cette table.</p>
      )}
    </div>
  )
}

export function DatasourceSchemaView({
  schema,
  datasourceName,
  className,
}: {
  schema: unknown
  datasourceName?: string
  className?: string
}) {
  const tables = parseDatasourceSchema(schema)

  if (tables.length === 0) {
    return (
      <div className={cn('rounded-lg border border-dashed border-border px-4 py-8 text-center', className)}>
        <Table2 className="mx-auto h-8 w-8 text-gray-700 mb-2" />
        <p className="text-sm text-gray-500">Aucun schéma disponible pour cette source.</p>
        {datasourceName && (
          <p className="text-xs text-gray-600 mt-1">Source : {datasourceName}</p>
        )}
      </div>
    )
  }

  const totalColumns = tables.reduce((n, t) => n + t.columns.length, 0)

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
        <span>{tables.length} table{tables.length > 1 ? 's' : ''}</span>
        <span className="text-gray-700">·</span>
        <span>{totalColumns} colonne{totalColumns > 1 ? 's' : ''}</span>
      </div>

      <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
        {tables.map((table) => (
          <TableBlock key={table.name} table={table} />
        ))}
      </div>
    </div>
  )
}
