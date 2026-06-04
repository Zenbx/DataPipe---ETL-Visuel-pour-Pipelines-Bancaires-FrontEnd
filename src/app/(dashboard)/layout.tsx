'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Navbar } from '@/components/layout/Navbar'
import { GlobalAssistant } from '@/components/assistant/GlobalAssistant'
import { useAuthStore } from '@/store/auth.store'
import { useWorkspaceStore } from '@/store/workspace.store'
import { getCurrentUser } from '@/lib/api/auth'
import { initApiClient } from '@/lib/api/client'
import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const isEditor = pathname?.includes('/editor')
  const { isLoading, setUser, clearAuth, setLoading } = useAuthStore()

  useEffect(() => {
    let cancelled = false

    const bootstrap = async () => {
      setLoading(true)
      try {
        // Toujours restaurer l'access_token depuis le refresh_token (perdu au reload).
        const ok = await initApiClient()
        if (!ok) {
          useWorkspaceStore.getState().reset()
          clearAuth()
          router.push('/login')
          return
        }
        const user = await getCurrentUser()
        if (cancelled) return
        // Valider org/workspace persistés avant d'afficher le dashboard.
        await useWorkspaceStore.getState().init({ force: true })
        if (cancelled) return
        setUser(user)
      } catch {
        if (!cancelled) {
          useWorkspaceStore.getState().reset()
          clearAuth()
          router.push('/login')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void bootstrap()
    return () => { cancelled = true }
  }, [setUser, clearAuth, router, setLoading])

  if (isLoading) {
    return (
      <div className="flex h-screen bg-background">
        <div className="w-[220px] border-r border-border p-4 space-y-3">
          <Skeleton className="h-8 w-32" />
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
        </div>
        <div className="flex-1 p-6 space-y-4">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {!isEditor && <Navbar />}
        <main className={isEditor ? 'flex flex-1 overflow-hidden' : 'flex-1 overflow-auto'}>
          {children}
        </main>
      </div>
      {/* Assistant IA global (mode action). L'éditeur a déjà son propre panneau. */}
      {!isEditor && <GlobalAssistant />}
    </div>
  )
}
