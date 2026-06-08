'use client'

import { Check, ChevronDown, ChevronUp, Info } from 'lucide-react'
import { useState } from 'react'
import {
  API_KEY_SCOPES,
  expandApiKeyScopes,
  getApiKeyScope,
  type ApiKeyScopeDefinition,
} from '@/lib/api/apiKeyScopes'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

function ScopeCard({
  scope,
  selected,
  onToggle,
}: {
  scope: ApiKeyScopeDefinition
  selected: boolean
  onToggle: () => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <div
      className={`rounded-lg border transition-colors ${
        selected ? 'border-primary/50 bg-primary/5' : 'border-border bg-card/40'
      }`}
    >
      <div className="flex w-full items-start gap-3 p-3">
        <button
          type="button"
          onClick={onToggle}
          className="flex min-w-0 flex-1 items-start gap-3 text-left"
        >
          <div
            className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
              selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border'
            }`}
          >
            {selected && <Check className="h-3 w-3" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-foreground">{scope.label}</span>
              <code className="rounded bg-background px-1.5 py-0.5 text-[10px] text-gray-500">
                {scope.id}
              </code>
              {scope.includes && (
                <span className="text-[10px] text-primary/80">inclut {scope.includes}</span>
              )}
            </div>
            <p className="mt-1 text-xs text-gray-500 leading-relaxed">{scope.summary}</p>
          </div>
        </button>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="shrink-0 rounded p-1 text-gray-600 hover:bg-background hover:text-gray-400"
          aria-label={open ? 'Masquer le détail' : 'Voir le détail'}
        >
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border/60 px-3 pb-3 pt-2 space-y-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-500/90 mb-1.5">
              Autorisé
            </p>
            <ul className="space-y-1">
              {scope.allows.map((line) => (
                <li key={line} className="flex gap-2 text-[11px] text-gray-400 leading-snug">
                  <span className="text-emerald-500/70 shrink-0">✓</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-red-400/80 mb-1.5">
              Non autorisé
            </p>
            <ul className="space-y-1">
              {scope.denies.map((line) => (
                <li key={line} className="flex gap-2 text-[11px] text-gray-500 leading-snug">
                  <span className="text-red-400/60 shrink-0">✗</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

export function ApiKeyScopeSelector({
  value,
  onChange,
}: {
  value: string[]
  onChange: (scopes: string[]) => void
}) {
  const effective = expandApiKeyScopes(value)

  const toggle = (id: string) => {
    onChange(value.includes(id) ? value.filter((s) => s !== id) : [...value, id])
  }

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2 rounded-lg border border-border/60 bg-background/50 px-3 py-2">
        <Info className="h-4 w-4 shrink-0 text-primary mt-0.5" />
        <p className="text-[11px] text-gray-500 leading-relaxed">
          Chaque scope limite les appels API possibles avec cette clé. Activez uniquement les
          permissions nécessaires — par ex.{' '}
          <code className="text-[10px]">runs:write</code> +{' '}
          <code className="text-[10px]">pipelines:read</code> pour un job CI qui lit puis exécute.
        </p>
      </div>

      <div className="space-y-2">
        {API_KEY_SCOPES.map((scope) => (
          <ScopeCard
            key={scope.id}
            scope={scope}
            selected={value.includes(scope.id)}
            onToggle={() => toggle(scope.id)}
          />
        ))}
      </div>

      {effective.length > 0 && (
        <p className="text-[10px] text-gray-600 pt-1">
          Permissions effectives :{' '}
          {effective.map((id) => (
            <code key={id} className="mr-1.5 text-gray-500">
              {id}
            </code>
          ))}
        </p>
      )}
    </div>
  )
}

export function ApiKeyScopeBadge({ scopeId }: { scopeId: string }) {
  const scope = getApiKeyScope(scopeId)
  const label = scope?.label ?? scopeId

  if (!scope) {
    return (
      <span className="inline-flex rounded-full border border-border px-2 py-0.5 text-[10px] text-gray-500">
        {scopeId}
      </span>
    )
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="inline-flex max-w-[140px] truncate rounded-full border border-border bg-secondary/50 px-2 py-0.5 text-[10px] text-gray-400 hover:border-primary/40 hover:text-primary transition-colors"
          >
            {label}
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs p-3 space-y-2">
          <div>
            <p className="text-xs font-semibold text-foreground">{scope.label}</p>
            <code className="text-[10px] text-gray-500">{scope.id}</code>
          </div>
          <p className="text-[11px] text-gray-400 leading-relaxed">{scope.summary}</p>
          <ul className="space-y-0.5">
            {scope.allows.slice(0, 4).map((line) => (
              <li key={line} className="text-[10px] text-gray-500">• {line}</li>
            ))}
            {scope.allows.length > 4 && (
              <li className="text-[10px] text-gray-600">… et {scope.allows.length - 4} autres</li>
            )}
          </ul>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
