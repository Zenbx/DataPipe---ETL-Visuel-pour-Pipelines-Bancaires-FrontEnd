'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { SimpleConfigField } from '@/lib/configFields'

export function StructuredConfigForm({
  fields,
  values,
  onChange,
}: {
  fields: SimpleConfigField[]
  values: Record<string, string | boolean>
  onChange: (values: Record<string, string | boolean>) => void
}) {
  if (fields.length === 0) {
    return <p className="text-xs text-gray-600">Aucun paramètre requis pour ce type.</p>
  }

  const set = (key: string, value: string | boolean) => onChange({ ...values, [key]: value })

  return (
    <div className="space-y-3 rounded-lg border border-border/60 bg-background/40 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-600">
        Paramètres de connexion
      </p>
      {fields.map((f) => (
        <div key={f.key} className="space-y-1.5">
          <Label className="flex items-center gap-2">
            {f.label}
            {f.optional && <span className="text-[10px] font-normal text-gray-600">optionnel</span>}
          </Label>
          {f.type === 'boolean' ? (
            <div className="flex items-center gap-2">
              <Switch
                checked={values[f.key] === true}
                onCheckedChange={(v) => set(f.key, v)}
              />
              <span className="text-xs text-gray-500">{values[f.key] ? 'Activé' : 'Désactivé'}</span>
            </div>
          ) : f.type === 'select' && f.options ? (
            <Select value={String(values[f.key] ?? f.default ?? '')} onValueChange={(v) => set(f.key, v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {f.options.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              type={f.type === 'password' ? 'password' : f.type === 'number' ? 'number' : 'text'}
              placeholder={f.placeholder}
              value={String(values[f.key] ?? '')}
              onChange={(e) => set(f.key, e.target.value)}
            />
          )}
          {f.help && <p className="text-[11px] text-gray-600">{f.help}</p>}
        </div>
      ))}
    </div>
  )
}
