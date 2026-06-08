'use client'

import Link from 'next/link'
import { BookOpen, Lightbulb, ListOrdered, ArrowRight } from 'lucide-react'
import { getPageHelp } from '@/lib/pageHelp'

export function PageHelpPanel({ helpKey }: { helpKey: string }) {
  const help = getPageHelp(helpKey)
  if (!help) return null

  return (
    <div className="flex h-full flex-col gap-5 p-5 overflow-y-auto">
      <div className="flex items-start gap-2">
        <BookOpen className="h-4 w-4 shrink-0 text-primary mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-foreground">{help.title}</p>
          <p className="mt-1 text-xs text-gray-500 leading-relaxed">{help.summary}</p>
        </div>
      </div>

      <div>
        <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-gray-600 mb-2">
          <ListOrdered className="h-3 w-3" /> Comment faire
        </p>
        <ol className="space-y-2">
          {help.steps.map((step, i) => (
            <li key={step} className="flex gap-2 text-xs text-gray-400 leading-snug">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>

      {help.tips.length > 0 && (
        <div>
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-gray-600 mb-2">
            <Lightbulb className="h-3 w-3" /> Astuces
          </p>
          <ul className="space-y-1.5">
            {help.tips.map((tip) => (
              <li key={tip} className="text-xs text-gray-500 leading-snug pl-3 border-l-2 border-primary/30">
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}

      {help.related && help.related.length > 0 && (
        <div className="mt-auto pt-2 border-t border-border">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-600 mb-2">
            Voir aussi
          </p>
          <div className="flex flex-col gap-1">
            {help.related.map((r) => (
              <Link
                key={r.href}
                href={r.href}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                {r.label} <ArrowRight className="h-3 w-3" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
