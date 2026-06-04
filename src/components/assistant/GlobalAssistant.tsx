'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Send, X, Loader2, ArrowUpRight, Zap, Bot } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { aiApi } from '@/lib/api/ai'
import { useAuthStore } from '@/store/auth.store'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface AssistantMessage {
  role: 'user' | 'assistant'
  content: string
  pipelineId?: string | null
}

const SUGGESTIONS = [
  'Crée un pipeline « Conformité » avec une source CSV puis un masquage RGPD',
  'Ajoute une détection d\'anomalies sur les montants',
  'Exécute le pipeline et montre-moi le résultat',
]

/**
 * Assistant IA global « mode action ». Disponible partout sur le dashboard.
 * Branché sur l'agent backend (/ai/agent/execute) : il PLANIFIE puis EXÉCUTE
 * (crée/modifie/exécute des pipelines), exactement comme le bot Telegram.
 */
export function GlobalAssistant() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      role: 'assistant',
      content:
        "Bonjour 👋 Je suis l'assistant DataPipe en mode action. Dis-moi ce que tu veux faire — je crée, modifie et exécute tes pipelines.",
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  if (!isAuthenticated) return null

  const send = async (text: string) => {
    const content = text.trim()
    if (!content || loading) return
    setMessages((prev) => [...prev, { role: 'user', content }])
    setInput('')
    setLoading(true)
    try {
      const res = await aiApi.agentExecute(content)
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: res.reply || 'C\'est fait.', pipelineId: res.pipeline_id },
      ])
      // Une action a (potentiellement) modifié les données -> on prévient les
      // pages ouvertes (dashboard, pipelines…) pour qu'elles se rafraîchissent.
      if (res.actions?.some((a) => a.ok)) {
        window.dispatchEvent(new CustomEvent('datapipe:pipelines-changed'))
      }
    } catch {
      toast.error('L\'assistant n\'a pas pu traiter la demande')
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '⚠️ Une erreur est survenue. Réessaie.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Bouton flottant — pilule en accord avec l'interface (surface card + accent) */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          title="Assistant IA"
          className="group fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl border border-border bg-card py-2 pl-2 pr-4 transition-all hover:-translate-y-0.5 hover:border-primary/40"
          style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.18)' }}
        >
          {/* Carré accent avec icône bot + point "en ligne" */}
          <span
            className="relative flex h-9 w-9 items-center justify-center rounded-xl"
            style={{ background: 'var(--primary)' }}
          >
            <Bot className="h-5 w-5 text-white" />
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-card" style={{ animation: 'pulse-dot 2s ease-in-out infinite' }} />
          </span>
          <span className="text-sm font-semibold text-foreground">Assistant IA</span>
        </button>
      )}

      {/* Panneau */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 flex h-[560px] max-h-[80vh] w-[400px] max-w-[calc(100vw-2rem)] flex-col rounded-2xl border border-border bg-card shadow-2xl">
          {/* En-tête — cohérent avec le bouton flottant (carré accent + point en ligne) */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: 'var(--primary)' }}>
                <Bot className="h-5 w-5 text-white" />
                <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-card" style={{ animation: 'pulse-dot 2s ease-in-out infinite' }} />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">Assistant IA</p>
                <p className="text-[11px] text-muted-foreground">Mode action · pilote tes pipelines</p>
              </div>
            </div>
            <Button variant="ghost" size="icon-sm" onClick={() => setOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 px-4 py-3">
            <div className="space-y-3">
              {messages.map((m, i) => (
                <div key={i} className={cn('flex items-end gap-2', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                  {m.role === 'assistant' && (
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg" style={{ background: 'var(--primary)' }}>
                      <Bot className="h-3.5 w-3.5 text-white" />
                    </span>
                  )}
                  <div
                    className={cn(
                      'max-w-[82%] px-3 py-2 text-sm whitespace-pre-wrap',
                      m.role === 'user'
                        ? 'rounded-2xl rounded-br-sm bg-primary text-primary-foreground'
                        : 'rounded-2xl rounded-bl-sm border border-border bg-muted text-foreground',
                    )}
                  >
                    {m.content}
                    {m.pipelineId && (
                      <Link
                        href={`/dashboard/pipelines/${m.pipelineId}/editor`}
                        className="mt-2 flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                      >
                        Ouvrir dans l&apos;éditeur <ArrowUpRight className="h-3 w-3" />
                      </Link>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-xl bg-muted px-3 py-2 text-sm text-gray-400">
                    <Loader2 className="h-4 w-4 animate-spin" /> L'agent réfléchit…
                  </div>
                </div>
              )}
              <div ref={scrollRef} />
            </div>

            {/* Suggestions (seulement au début) */}
            {messages.length === 1 && !loading && (
              <div className="mt-4 space-y-1.5">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="flex w-full items-start gap-2 rounded-lg border border-border px-3 py-2 text-left text-xs text-gray-400 transition-colors hover:border-primary/50 hover:text-foreground"
                  >
                    <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                    {s}
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Saisie */}
          <div className="border-t border-border p-3">
            <div className="flex items-end gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    send(input)
                  }
                }}
                placeholder="Demande une action… (ex: crée un pipeline)"
                rows={1}
                className="min-h-[40px] max-h-32 resize-none text-sm"
                disabled={loading}
              />
              <Button size="icon" onClick={() => send(input)} disabled={loading || !input.trim()}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
