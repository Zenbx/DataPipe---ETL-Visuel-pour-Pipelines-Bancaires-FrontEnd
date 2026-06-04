import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ApiError } from '@/lib2/core/ApiError'
import { orgsApi, type AppOrg } from '@/lib/api/orgs'
import { workspacesApi, type AppWorkspace } from '@/lib/api/workspaces'

function isForbidden(err: unknown): boolean {
  return err instanceof ApiError && err.status === 403
}

function pickOrgId(orgs: AppOrg[], preferred: string | null): string | null {
  if (preferred && orgs.some((o) => o.id === preferred)) return preferred
  return orgs[0]?.id ?? null
}

function pickWorkspaceId(workspaces: AppWorkspace[], preferred: string): string {
  if (workspaces.some((w) => w.id === preferred)) return preferred
  return workspaces[0]?.id ?? 'default'
}

async function loadWorkspacesForOrg(orgId: string): Promise<AppWorkspace[]> {
  return workspacesApi.list(orgId)
}

interface WorkspaceState {
  orgs: AppOrg[]
  workspaces: AppWorkspace[]
  currentOrgId: string | null
  currentWorkspaceId: string
  loaded: boolean
  init: (opts?: { force?: boolean }) => Promise<void>
  reset: () => void
  selectOrg: (orgId: string) => Promise<void>
  selectWorkspace: (wsId: string) => void
  refreshOrgs: () => Promise<void>
  refreshWorkspaces: () => Promise<void>
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      orgs: [],
      workspaces: [],
      currentOrgId: null,
      // 'default' tant que les vrais workspaces ne sont pas chargés (compat backend).
      currentWorkspaceId: 'default',
      loaded: false,

      reset: () => {
        set({
          orgs: [],
          workspaces: [],
          currentOrgId: null,
          currentWorkspaceId: 'default',
          loaded: false,
        })
      },

      init: async (opts) => {
        if (get().loaded && !opts?.force) return
        try {
          const orgs = await orgsApi.list()
          set({ orgs })

          let orgId = pickOrgId(orgs, get().currentOrgId)
          if (!orgId) {
            set({ currentOrgId: null, workspaces: [], currentWorkspaceId: 'default' })
            return
          }

          let workspaces: AppWorkspace[] = []
          try {
            workspaces = await loadWorkspacesForOrg(orgId)
          } catch (err) {
            if (!isForbidden(err) || orgs.length <= 1) throw err
            // Org persistée mais plus accessible : basculer sur la première org valide.
            orgId = pickOrgId(orgs, null)
            if (!orgId) {
              set({ currentOrgId: null, workspaces: [], currentWorkspaceId: 'default' })
              return
            }
            workspaces = await loadWorkspacesForOrg(orgId)
          }

          set({
            currentOrgId: orgId,
            workspaces,
            currentWorkspaceId: pickWorkspaceId(workspaces, get().currentWorkspaceId),
          })
        } catch {
          /* offline / session expirée : conserver les IDs persistés */
        } finally {
          set({ loaded: true })
        }
      },

      selectOrg: async (orgId) => {
        const orgs = get().orgs
        if (!orgs.some((o) => o.id === orgId)) return
        set({ currentOrgId: orgId })
        try {
          const workspaces = await workspacesApi.list(orgId)
          set({
            workspaces,
            currentWorkspaceId: pickWorkspaceId(workspaces, get().currentWorkspaceId),
          })
        } catch {
          set({ workspaces: [], currentWorkspaceId: 'default' })
        }
      },

      selectWorkspace: (wsId) => {
        const workspaces = get().workspaces
        if (workspaces.length > 0 && !workspaces.some((w) => w.id === wsId)) return
        set({ currentWorkspaceId: wsId })
      },

      refreshOrgs: async () => {
        try { set({ orgs: await orgsApi.list() }) } catch { /* noop */ }
      },

      refreshWorkspaces: async () => {
        const orgId = get().currentOrgId
        if (!orgId) return
        try {
          const workspaces = await workspacesApi.list(orgId)
          set({
            workspaces,
            currentWorkspaceId: pickWorkspaceId(workspaces, get().currentWorkspaceId),
          })
        } catch { /* noop */ }
      },
    }),
    {
      name: 'datapipe-workspace',
      partialize: (s) => ({ currentOrgId: s.currentOrgId, currentWorkspaceId: s.currentWorkspaceId }),
    },
  ),
)
