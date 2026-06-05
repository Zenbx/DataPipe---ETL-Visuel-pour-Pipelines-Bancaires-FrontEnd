import { ResultsService } from '@/lib2'

export type ExportItem = {
  id: string
  name?: string
  filename?: string
  pipeline_name?: string
  format?: string
  status?: string
  size_bytes?: number
  created_at?: string
  download_url?: string
  result_id?: string
}

export type ResultItem = {
  id: string
  run_id?: string
  pipeline_id?: string
  pipeline_name?: string
  name?: string
  rows?: number
  created_at?: string
  node_id?: string
}

/** Nom lisible d'un export : nom donné > fichier > pipeline > id court. */
export function exportName(e: ExportItem): string {
  return e.name || e.filename || e.pipeline_name || `Export ${e.id.slice(-8)}`
}

function triggerDownload(raw: unknown, fallbackName: string) {
  const obj = raw as { url?: string; download_url?: string } | string | null
  if (obj && typeof obj === 'object' && (obj.url || obj.download_url)) {
    window.open((obj.url ?? obj.download_url)!, '_blank')
    return
  }
  const content = typeof raw === 'string' ? raw : JSON.stringify(raw, null, 2)
  const blob = new Blob([content], { type: typeof raw === 'string' ? 'text/csv' : 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fallbackName
  a.click()
  URL.revokeObjectURL(url)
}

export const resultsApi = {
  async listExports(): Promise<ExportItem[]> {
    try {
      const raw = (await ResultsService.getExports()) as { exports?: ExportItem[]; data?: ExportItem[] }
      return raw.exports ?? raw.data ?? []
    } catch {
      // Le backend n'expose pas (ou pas encore) la liste globale /exports → 404.
      // On retombe gracieusement sur du vide ; le fallback par pipeline prend le relais.
      return []
    }
  },

  /**
   * Liste consolidée des exports/sorties en agrégeant les résultats de chaque
   * pipeline (endpoint /pipelines/{id}/results, lui, fonctionne). Sert de
   * source quand la liste globale /exports n'est pas disponible.
   */
  async listExportsAggregated(pipelines: { id: string; name: string }[]): Promise<ExportItem[]> {
    const all = await Promise.all(
      pipelines.map(async (p) => {
        try {
          const results = await resultsApi.getPipelineResults(p.id)
          return results.map((r): ExportItem => ({
            id: r.id,
            name: r.name || p.name,
            pipeline_name: p.name,
            result_id: r.id,
            status: 'ready',
            created_at: r.created_at,
            size_bytes: undefined,
          }))
        } catch {
          return [] as ExportItem[]
        }
      }),
    )
    return all.flat().sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))
  },

  async getExport(id: string) {
    return ResultsService.getExports1(id)
  },

  async removeExport(id: string) {
    await ResultsService.deleteExports(id)
  },

  async downloadExport(item: ExportItem) {
    const raw = await ResultsService.getExportsDownload(item.id)
    triggerDownload(raw, `export-${item.id}.${item.format ?? 'csv'}`)
  },

  async retryExport(id: string) {
    return ResultsService.postExportsRetry(id)
  },

  async getPipelineResults(pipelineId: string): Promise<ResultItem[]> {
    const raw = (await ResultsService.getPipelinesResults(pipelineId)) as {
      results?: (ResultItem & { run_id?: string })[]
      data?: (ResultItem & { run_id?: string })[]
    }
    const items = raw.results ?? raw.data ?? []
    // Résilience : certains backends renvoient `run_id` sans `id`. Or download/
    // export utilisent `id` (= run_id). On comble le `id` manquant.
    return items.map((r) => ({ ...r, id: r.id ?? r.run_id ?? '' }))
  },

  async getResult(resultId: string) {
    return ResultsService.getResults(resultId)
  },

  async downloadResult(resultId: string, format: 'csv' | 'json' = 'csv') {
    const raw = await ResultsService.getResultsDownload(resultId, format)
    triggerDownload(raw, `result-${resultId}.${format}`)
  },

  async createExport(resultId: string, format: 'csv' | 'json' | 'excel' = 'csv') {
    return ResultsService.postResultsExport(resultId, { format })
  },

  async getRunResults(runId: string) {
    return ResultsService.getRunsResults(runId)
  },
}
