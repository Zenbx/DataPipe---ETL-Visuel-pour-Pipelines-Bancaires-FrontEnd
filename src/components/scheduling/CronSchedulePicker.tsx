'use client'

import { useEffect, useState } from 'react'
import { Info } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  CRON_MODE_OPTIONS,
  EVERY_MINUTES_OPTIONS,
  WEEKDAYS_FR,
  builderFromCron,
  cronFromBuilder,
  describeCron,
  type CronBuilderState,
  type CronMode,
} from '@/lib/cronSchedule'

function CronHelpTooltip() {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="inline-flex h-6 w-6 items-center justify-center rounded-md text-gray-500 hover:bg-card hover:text-primary transition-colors"
            aria-label="Aide sur le format cron"
          >
            <Info className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="left" className="max-w-sm p-3 space-y-2 text-left">
          <p className="text-xs font-semibold text-foreground">Comment fonctionne le cron ?</p>
          <p className="text-[11px] text-gray-400 leading-relaxed">
            Une planification utilise 5 champs séparés par des espaces :
          </p>
          <div className="rounded-md bg-background/80 p-2 font-mono text-[10px] text-gray-300">
            minute · heure · jour du mois · mois · jour de la semaine
          </div>
          <ul className="space-y-1 text-[11px] text-gray-400">
            <li><span className="text-primary">*</span> = toutes les valeurs</li>
            <li><span className="text-primary">*/15</span> = toutes les 15 unités</li>
            <li><span className="text-primary">0 9 * * *</span> = chaque jour à 09:00</li>
            <li><span className="text-primary">0 9 * * 1</span> = chaque lundi à 09:00</li>
          </ul>
          <p className="text-[10px] text-gray-600">
            Utilisez le mode guidé ci-dessous : l&apos;expression est générée automatiquement.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export function CronSchedulePicker({
  value,
  onChange,
}: {
  value: string
  onChange: (cron: string) => void
}) {
  const [state, setState] = useState<CronBuilderState>(() => builderFromCron(value || '0 9 * * *'))

  useEffect(() => {
    setState(builderFromCron(value || '0 9 * * *'))
  }, [value])

  const apply = (next: CronBuilderState) => {
    setState(next)
    onChange(cronFromBuilder(next))
  }

  const setMode = (mode: CronMode) => {
    const next = { ...state, mode }
    if (mode === 'custom' && !next.custom) next.custom = value
    apply(next)
  }

  const human = describeCron(cronFromBuilder(state))

  return (
    <div className="space-y-3 rounded-lg border border-border/60 bg-background/40 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Label className="text-sm">Fréquence d&apos;exécution</Label>
          <CronHelpTooltip />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-gray-500">Type de planification</Label>
        <Select value={state.mode} onValueChange={(v) => setMode(v as CronMode)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {CRON_MODE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {state.mode === 'every_minutes' && (
        <div className="space-y-1.5">
          <Label className="text-xs text-gray-500">Intervalle</Label>
          <Select
            value={String(state.everyMinutes)}
            onValueChange={(v) => apply({ ...state, everyMinutes: Number(v) })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {EVERY_MINUTES_OPTIONS.map((n) => (
                <SelectItem key={n} value={String(n)}>Toutes les {n} minutes</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {state.mode === 'hourly' && (
        <div className="space-y-1.5">
          <Label className="text-xs text-gray-500">Minute de l&apos;heure (0–59)</Label>
          <Input
            type="number"
            min={0}
            max={59}
            value={state.minute}
            onChange={(e) => apply({ ...state, minute: Number(e.target.value) || 0 })}
          />
        </div>
      )}

      {(state.mode === 'daily' || state.mode === 'weekly' || state.mode === 'monthly') && (
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-500">Heure (0–23)</Label>
            <Input
              type="number"
              min={0}
              max={23}
              value={state.hour}
              onChange={(e) => apply({ ...state, hour: Number(e.target.value) || 0 })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-500">Minute (0–59)</Label>
            <Input
              type="number"
              min={0}
              max={59}
              value={state.minute}
              onChange={(e) => apply({ ...state, minute: Number(e.target.value) || 0 })}
            />
          </div>
        </div>
      )}

      {state.mode === 'weekly' && (
        <div className="space-y-1.5">
          <Label className="text-xs text-gray-500">Jour de la semaine</Label>
          <Select
            value={String(state.dayOfWeek)}
            onValueChange={(v) => apply({ ...state, dayOfWeek: Number(v) })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {WEEKDAYS_FR.map((d) => (
                <SelectItem key={d.value} value={String(d.value)}>{d.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {state.mode === 'monthly' && (
        <div className="space-y-1.5">
          <Label className="text-xs text-gray-500">Jour du mois (1–31)</Label>
          <Input
            type="number"
            min={1}
            max={31}
            value={state.dayOfMonth}
            onChange={(e) => apply({ ...state, dayOfMonth: Number(e.target.value) || 1 })}
          />
        </div>
      )}

      {state.mode === 'custom' && (
        <div className="space-y-1.5">
          <Label className="text-xs text-gray-500">Expression cron (5 champs)</Label>
          <Input
            className="font-mono text-sm"
            placeholder="0 9 * * *"
            value={state.custom}
            onChange={(e) => apply({ ...state, custom: e.target.value })}
          />
        </div>
      )}

      <div className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2 space-y-1">
        <p className="text-xs font-medium text-foreground">{human}</p>
        <p className="text-[10px] font-mono text-gray-500">cron : {cronFromBuilder(state)}</p>
      </div>
    </div>
  )
}
