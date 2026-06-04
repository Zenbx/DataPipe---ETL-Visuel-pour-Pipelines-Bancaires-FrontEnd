import { AiService } from '@/lib2'
import type { AIUsage } from '@/types'
import { API_BASE, authTokens, refreshAccessToken } from './client'

export interface AgentAction { action: string; ok: boolean; message: string; run_id?: string | null }
export interface AgentExecuteResult {
  type: 'reply' | 'action' | 'plan'
  reply: string
  pipeline_id?: string | null
  pipeline?: { id: string; name: string; nodes_count?: number } | null
  actions: AgentAction[]
  run_id?: string | null
  model?: string
}

/** POST authentifié (fetch direct) avec un retry 401 -> refresh -> rejoue. */
async function authPost<T>(path: string, body: unknown): Promise<T> {
  const call = () =>
    fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authTokens.getAccess() ? { Authorization: `Bearer ${authTokens.getAccess()}` } : {}),
      },
      body: JSON.stringify(body),
    })
  let res = await call()
  if (res.status === 401 && (await refreshAccessToken())) res = await call()
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json() as Promise<T>
}

/**
 * Helpers IA mappés sur les endpoints réellement exposés par le backend.
 *
 * Remappings (fonctions front sans endpoint dédié) :
 *  - generateSQL   → /ai/generate-transform
 *  - generatePipeline / suggestPipeline → /ai/generate-pipeline / /ai/suggest-pipeline
 *
 * Le chat backend est mono-message + session_id (pas d'historique de messages
 * dans le body), on s'aligne dessus.
 */
export const aiApi = {
  async chat(message: string, sessionId?: string) {
    return AiService.postAiChat({ message, session_id: sessionId })
  },

  async getChatHistory(sessionId: string) {
    return AiService.getAiChatHistory(sessionId)
  },

  /**
   * Chat « mode action » : message naturel -> l'agent backend PLANIFIE et
   * EXÉCUTE (crée/modifie/exécute des pipelines), comme le bot Telegram.
   * `pipelineId` donne le contexte du pipeline courant (facultatif).
   */
  async agentExecute(message: string, pipelineId?: string | null, columns?: string[]) {
    return authPost<AgentExecuteResult>('/ai/agent/execute', {
      message,
      pipeline_id: pipelineId ?? undefined,
      context: columns && columns.length ? { columns } : undefined,
    })
  },

  /** Génère une requête SQL depuis une description naturelle. */
  async generateSQL(description: string, columns?: string[]) {
    return AiService.postAiGenerateTransform({
      description,
      context: columns ? { columns } : undefined,
    })
  },

  async generatePipeline(prompt: string) {
    return AiService.postAiGeneratePipeline({ prompt })
  },

  async suggestPipeline(goal: string) {
    return AiService.postAiSuggestPipeline({ goal })
  },

  async detectAnomalies(data: unknown[], amountField?: string) {
    return AiService.postAiDetectAnomalies({ data, amount_field: amountField })
  },

  async detectAnomaliesBatch() {
    return AiService.getAiDetectAnomaliesBatch()
  },

  async embed(texts: string[]) {
    return AiService.postAiEmbed({ texts })
  },

  async cleanData(data: unknown[]) {
    return AiService.postAiCleanData({ data })
  },

  async generateSchema(sampleData: unknown[]) {
    return AiService.postAiGenerateSchema({ sample_data: sampleData })
  },

  async classify(data: unknown[], categories: string[]) {
    return AiService.postAiClassify({ data, categories })
  },

  async extractEntities(texts: string[]) {
    return AiService.postAiExtractEntities({ texts })
  },

  async explainNode(nodeType: string, config?: unknown) {
    return AiService.postAiExplainNode({ node_type: nodeType, config })
  },

  async getModels() {
    return AiService.getAiModels()
  },

  async getUsage(): Promise<AIUsage> {
    const raw = (await AiService.getAiUsage()) as Record<string, unknown>
    const breakdown = (raw.breakdown ?? {}) as Record<string, number>
    return {
      month: String(raw.month ?? ''),
      tokens_used: Number(raw.tokens_used ?? 0),
      tokens_limit: Number(raw.tokens_limit ?? 1),
      cost_usd: Number(raw.cost_usd ?? 0),
      breakdown: {
        generate_pipeline: Number(breakdown.generate_pipeline ?? 0),
        generate_sql: Number(breakdown.generate_sql ?? breakdown.generate_transform ?? 0),
        chat: Number(breakdown.chat ?? 0),
      },
    }
  },
}
