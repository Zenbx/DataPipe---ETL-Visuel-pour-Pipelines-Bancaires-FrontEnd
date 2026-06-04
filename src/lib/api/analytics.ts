import { AnalyticsService } from '@/lib2'
import { filesApi } from '@/lib/api/files'
import { orgsApi } from '@/lib/api/orgs'
import type { WorkspaceUsage, PipelineAnalytics } from '@/types'

const PLAN_STORAGE_LIMIT_MB: Record<string, number> = {
  free: 1024,
  pro: 10_240,
  enterprise: 102_400,
}

function mapWorkspaceUsage(raw: Record<string, unknown>): WorkspaceUsage {
  return {
    storage_used_mb: Number(
      raw.storage_used_mb ?? raw.storage_mb ?? raw.used_storage_mb ?? 0,
    ),
    storage_limit_mb: Number(raw.storage_limit_mb ?? raw.storage_limit ?? 1024),
    runs_this_month: Number(raw.runs_this_month ?? raw.total_runs ?? 0),
    rows_processed_this_month: Number(
      raw.rows_processed_this_month ?? raw.rows_processed ?? raw.data_processed ?? 0,
    ),
    active_pipelines: Number(raw.active_pipelines ?? raw.pipelines_count ?? 0),
    scheduled_runs: Number(raw.scheduled_runs ?? 0),
  }
}

function unwrapRecord(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== 'object') return {}
  const obj = raw as Record<string, unknown>
  const nested = obj.data ?? obj.usage ?? obj.overview ?? obj.metrics
  if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
    return nested as Record<string, unknown>
  }
  return obj
}

/**
 * Analytics branchés sur le workspace courant.
 * - KPIs : GET /analytics/overview?workspace_id=…
 * - Stockage utilisé : somme réelle des fichiers du workspace
 * - Limite stockage : GET /analytics/usage ou plan org
 */
export const analyticsApi = {
  async getWorkspaceUsage(workspaceId: string, orgId?: string): Promise<WorkspaceUsage> {
    const overview = unwrapRecord(await AnalyticsService.getAnalyticsOverview(workspaceId))
    const usage = mapWorkspaceUsage(overview)

    try {
      usage.storage_used_mb = await filesApi.getStorageUsageMb(workspaceId)
    } catch { /* conserver la valeur overview si listing fichiers indisponible */ }

    try {
      const quota = unwrapRecord(await AnalyticsService.getAnalyticsUsage())
      const limit = Number(quota.storage_limit_mb ?? quota.storage_limit ?? 0)
      if (limit > 0) usage.storage_limit_mb = limit
    } catch { /* quota org indisponible */ }

    if (orgId) {
      try {
        const org = await orgsApi.get(orgId)
        if (org.plan && usage.storage_limit_mb <= 1024) {
          usage.storage_limit_mb = PLAN_STORAGE_LIMIT_MB[org.plan] ?? usage.storage_limit_mb
        }
      } catch { /* plan org indisponible */ }
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
      timeline?: TimelinePoint[]
      data?: TimelinePoint[]
      items?: TimelinePoint[]
    }
    return raw.timeline ?? raw.data ?? raw.items ?? []
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
