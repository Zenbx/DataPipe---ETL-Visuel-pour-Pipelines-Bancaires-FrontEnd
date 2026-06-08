import { AnalyticsService, RunsService } from '@/lib2'
import { filesApi } from '@/lib/api/files'
import { orgsApi } from '@/lib/api/orgs'
import { pipelinesApi } from '@/lib/api/pipelines'
import { runsApi } from '@/lib/api/runs'
import { schedulingApi } from '@/lib/api/scheduling'
import type { WorkspaceUsage, PipelineAnalytics } from '@/types'
import type { Run } from '@/types'

const PLAN_STORAGE_LIMIT_MB: Record<string, number> = {
  free: 1024,
  pro: 10_240,
  enterprise: 102_400,
}

const FAILED_STATUSES = new Set(['failed', 'error', 'cancelled'])

function monthStartIso(): string {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString()
}

function isThisMonth(iso?: string): boolean {
  if (!iso) return false
  return iso >= monthStartIso()
}

function mapTimelinePoint(raw: Record<string, unknown>): TimelinePoint {
  const runs = Number(raw.runs ?? raw.total ?? 0)
  const success = Number(raw.success ?? 0)
  const failed = Number(
    raw.failed ?? raw.error ?? Math.max(0, runs - success),
  )
  return {
    date: String(raw.date ?? ''),
    runs,
    success,
    failed,
  }
}

/** Timeline 30 jours reconstruite depuis les runs réels du workspace. */
export function buildTimelineFromRuns(runs: Run[], days = 30): TimelinePoint[] {
  const buckets: Record<string, { runs: number; failed: number; success: number }> = {}
  const today = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    buckets[d.toISOString().slice(0, 10)] = { runs: 0, failed: 0, success: 0 }
  }
  for (const r of runs) {
    const key = (r.started_at ?? '').slice(0, 10)
    const b = buckets[key]
    if (!b) continue
    b.runs++
    if (r.status === 'success') b.success++
    if (FAILED_STATUSES.has(r.status)) b.failed++
  }
  return Object.entries(buckets).map(([date, v]) => ({
    date,
    runs: v.runs,
    success: v.success,
    failed: v.failed,
  }))
}

async function workspacePipelineIds(workspaceId: string): Promise<string[]> {
  if (!workspaceId || workspaceId === 'default') return []
  const res = await pipelinesApi.list({ workspace_id: workspaceId, per_page: 50 })
  return res.data.map((p) => p.id)
}

async function sumRowsProcessed(runs: Run[], maxDetail = 15): Promise<number> {
  const monthRuns = runs.filter((r) => isThisMonth(r.started_at)).slice(0, maxDetail)
  let total = 0
  await Promise.all(
    monthRuns.map(async (r) => {
      if (!r.pipeline_id) return
      try {
        const detail = (await RunsService.getPipelinesRuns1(r.pipeline_id, r.id)) as {
          node_results?: Record<string, { rows_output?: number }>
        }
        const results = detail.node_results
        if (!results) return
        for (const v of Object.values(results)) {
          total += v?.rows_output ?? 0
        }
      } catch { /* run sans résultats détaillés */ }
    }),
  )
  return total
}

/**
 * Analytics branchés sur le workspace courant (côté front).
 * Les endpoints /analytics/* du backend renvoient parfois des champs mockés ou
 * des noms différents (`total` vs `runs`) : on normalise et on reconstitue
 * les KPIs depuis pipelines / runs / fichiers / schedules quand c'est nécessaire.
 */
export const analyticsApi = {
  async getWorkspaceUsage(workspaceId: string, orgId?: string): Promise<WorkspaceUsage> {
    const listed = workspaceId && workspaceId !== 'default'
      ? await pipelinesApi.list({ workspace_id: workspaceId, per_page: 50 }).catch(() => ({ data: [] }))
      : { data: [] as Awaited<ReturnType<typeof pipelinesApi.list>>['data'] }
    const pipelineIds = listed.data.map((p) => p.id)

    const [runs, schedules] = await Promise.all([
      pipelineIds.length > 0
        ? runsApi.aggregate(pipelineIds, 30, 30)
        : Promise.resolve([] as Run[]),
      schedulingApi.listAll(workspaceId).catch(() => []),
    ])

    const runsThisMonth = runs.filter((r) => isThisMonth(r.started_at))
    const pipelineSet = new Set(pipelineIds)
    const scheduledActive = schedules.filter(
      (s) => s.active && pipelineSet.has(s.pipeline_id),
    ).length
    const activePipelines = listed.data.filter((p) => p.status === 'active').length

    const usage: WorkspaceUsage = {
      storage_used_mb: 0,
      storage_limit_mb: PLAN_STORAGE_LIMIT_MB.free,
      runs_this_month: runsThisMonth.length,
      rows_processed_this_month: await sumRowsProcessed(runs),
      active_pipelines: activePipelines,
      scheduled_runs: scheduledActive,
    }

    try {
      usage.storage_used_mb = await filesApi.getStorageUsageMb(workspaceId)
    } catch { /* ignore */ }

    if (orgId) {
      try {
        const org = await orgsApi.get(orgId)
        if (org.plan) {
          usage.storage_limit_mb = PLAN_STORAGE_LIMIT_MB[org.plan] ?? usage.storage_limit_mb
        }
      } catch { /* ignore */ }
    }

    return usage
  },

  async getOverview(workspaceId: string) {
    return AnalyticsService.getAnalyticsOverview(workspaceId)
  },

  async getPipelineStats(pipelineId: string): Promise<PipelineAnalytics> {
    return (await AnalyticsService.getAnalyticsPipelinesStats(pipelineId)) as unknown as PipelineAnalytics
  },

  async getRunsTimeline(workspaceId: string, days = 30): Promise<TimelinePoint[]> {
    const raw = (await AnalyticsService.getAnalyticsRunsTimeline(workspaceId, days)) as {
      timeline?: Record<string, unknown>[]
      data?: Record<string, unknown>[]
      items?: Record<string, unknown>[]
    }
    const points = (raw.timeline ?? raw.data ?? raw.items ?? []).map((p) => mapTimelinePoint(p))

    const hasData = points.some((p) => (p.runs ?? 0) > 0)
    if (hasData) return points

    const pipelineIds = await workspacePipelineIds(workspaceId)
    if (pipelineIds.length === 0) return points

    const runs = await runsApi.aggregate(pipelineIds, days, 30)
    return buildTimelineFromRuns(runs, days)
  },

  async getAuditLogs(
    params: { orgId?: string; action?: string; resourceType?: string; page?: number } = {},
  ): Promise<AuditLog[]> {
    const raw = (await AnalyticsService.getAuditLogs(
      params.orgId,
      params.action,
      params.resourceType,
      params.page,
    )) as {
      logs?: AuditLog[]
      data?: AuditLog[]
      items?: AuditLog[]
    }
    return raw.logs ?? raw.data ?? raw.items ?? []
  },

  async getAuditLog(logId: string) {
    return AnalyticsService.getAuditLogs1(logId)
  },
}

export type TimelinePoint = { date: string; runs?: number; success?: number; failed?: number }
export type AuditLog = {
  id?: string
  action?: string
  resource_type?: string
  resource_id?: string
  actor?: string
  user?: string
  created_at?: string
  ts?: string
}
