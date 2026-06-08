'use client'

import { Check, ChevronDown, ChevronUp, Info } from 'lucide-react'
import { useState } from 'react'
import {
  WEBHOOK_EVENTS,
  getWebhookEvent,
  type WebhookEventDefinition,
} from '@/lib/api/webhookEvents'
import type { WebhookEvent } from '@/lib/api/webhooks'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

function EventCard({
  event,
  selected,
  onToggle,
}: {
  event: WebhookEventDefinition
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
              <span className="text-sm font-medium text-foreground">{event.label}</span>
              <code className="rounded bg-background px-1.5 py-0.5 text-[10px] text-gray-500">
                {event.id}
              </code>
            </div>
            <p className="mt-1 text-xs text-gray-500 leading-relaxed">{event.summary}</p>
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
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-600 mb-1.5">
              Contenu du payload
            </p>
            <ul className="space-y-1">
              {event.payload.map((line) => (
                <li key={line} className="flex gap-2 text-[11px] text-gray-400 leading-snug">
                  <span className="text-primary/70 shrink-0">•</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-600 mb-1.5">
              Cas d&apos;usage
            </p>
            <ul className="space-y-1">
              {event.useWhen.map((line) => (
                <li key={line} className="flex gap-2 text-[11px] text-gray-500 leading-snug">
                  <span className="text-emerald-500/70 shrink-0">✓</span>
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

export function WebhookEventSelector({
  value,
  onChange,
}: {
  value: WebhookEvent[]
  onChange: (events: WebhookEvent[]) => void
}) {
  const toggle = (id: WebhookEvent) => {
    onChange(value.includes(id) ? value.filter((e) => e !== id) : [...value, id])
  }

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2 rounded-lg border border-border/60 bg-background/50 px-3 py-2">
        <Info className="h-4 w-4 shrink-0 text-primary mt-0.5" />
        <p className="text-[11px] text-gray-500 leading-relaxed">
          Choisissez les événements qui déclencheront un POST vers votre URL. Vous pouvez
          combiner succès + erreur pour un monitoring complet.
        </p>
      </div>
      <div className="space-y-2 max-h-[42vh] overflow-y-auto pr-1">
        {WEBHOOK_EVENTS.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            selected={value.includes(event.id)}
            onToggle={() => toggle(event.id)}
          />
        ))}
      </div>
      {value.length === 0 && (
        <p className="text-[11px] text-amber-500/90">Sélectionnez au moins un événement.</p>
      )}
    </div>
  )
}

export function WebhookEventBadge({ eventId }: { eventId: string }) {
  const event = getWebhookEvent(eventId)
  const label = event?.label ?? eventId

  if (!event) {
    return (
      <span className="inline-flex rounded-full border border-border px-2 py-0.5 text-[10px] text-gray-500">
        {eventId}
      </span>
    )
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="inline-flex rounded-full border border-border bg-secondary/50 px-2 py-0.5 text-[10px] text-gray-400 hover:border-primary/40 hover:text-primary transition-colors"
          >
            {label}
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs p-3 space-y-1">
          <p className="text-xs font-semibold text-foreground">{event.label}</p>
          <code className="text-[10px] text-gray-500">{event.id}</code>
          <p className="text-[11px] text-gray-400">{event.summary}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
