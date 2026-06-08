'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import {
  LayoutDashboard, GitBranch, FileUp, BarChart3, Settings,
  Bell, Key, ChevronLeft, History, Database, LayoutTemplate,
  CalendarClock, Webhook, Activity, Terminal, FileDown, Users, Sparkles, Store, Plug,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNotificationStore } from '@/store/notification.store'
import { useUIStore } from '@/store/ui.store'
import { useTranslation } from '@/lib/i18n'
import type { TranslationKey } from '@/lib/i18n/locales/fr'
import { ThemeToggle } from './ThemeToggle'
import { LanguageToggle } from './LanguageToggle'
import { Badge } from '@/components/ui/badge'

type NavItem = { key: TranslationKey; icon: LucideIcon; href: string; badge?: boolean }

// Section principale : le flux de travail courant, accessible d'emblée.
const mainNav: NavItem[] = [
  { key: 'nav.dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { key: 'nav.pipelines', icon: GitBranch, href: '/dashboard/pipelines' },
  { key: 'nav.runs', icon: History, href: '/dashboard/runs' },
  { key: 'nav.files', icon: FileUp, href: '/dashboard/files' },
  { key: 'nav.datasources', icon: Database, href: '/dashboard/datasources' },
  { key: 'nav.transform', icon: Terminal, href: '/dashboard/transform' },
  { key: 'nav.aiTools', icon: Sparkles, href: '/dashboard/ai-tools' },
  { key: 'nav.analytics', icon: BarChart3, href: '/dashboard/analytics' },
  { key: 'nav.marketplace', icon: Store, href: '/dashboard/marketplace' },
  { key: 'nav.notifications', icon: Bell, href: '/dashboard/notifications', badge: true },
]

// Section secondaire (bas) : ce qu'on utilise moins intuitivement au démarrage.
const secondaryNav: NavItem[] = [
  { key: 'nav.exports', icon: FileDown, href: '/dashboard/exports' },
  { key: 'nav.templates', icon: LayoutTemplate, href: '/dashboard/templates' },
  { key: 'nav.scheduling', icon: CalendarClock, href: '/dashboard/scheduling' },
  { key: 'nav.webhooks', icon: Webhook, href: '/dashboard/webhooks' },
  { key: 'nav.status', icon: Activity, href: '/dashboard/status' },
  { key: 'nav.team', icon: Users, href: '/dashboard/settings/organisation' },
  { key: 'nav.apiKeys', icon: Key, href: '/dashboard/settings/api-keys' },
  { key: 'nav.integrations', icon: Plug, href: '/dashboard/settings/integrations' },
  { key: 'nav.settings', icon: Settings, href: '/dashboard/settings' },
]

export function Sidebar() {
  const pathname = usePathname()
  const unreadCount = useNotificationStore((s) => s.unreadCount)
  const { sidebarCollapsed, toggleSidebar } = useUIStore()
  const { t } = useTranslation()

  return (
    <aside className={cn(
      'flex h-full flex-col border-r border-border bg-background transition-all duration-300',
      sidebarCollapsed ? 'w-12' : 'w-[220px]'
    )}>
      {/* Logo / toggle */}
      <div className="flex h-14 items-center border-b border-border px-3">
        {sidebarCollapsed ? (
          /* Collapsed : uniquement le bouton pour réouvrir, centré */
          <button
            onClick={toggleSidebar}
            className="flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-card hover:text-foreground transition-colors mx-auto"
            title="Déplier la sidebar"
          >
            <ChevronLeft className="h-4 w-4 rotate-180" />
          </button>
        ) : (
          /* Expanded : logo + nom + bouton collapse */
          <>
            <div className="flex flex-1 items-center gap-2.5 min-w-0">
              <Image src="/logo.png" alt="DataPipe" width={44} height={44} className="rounded-lg shrink-0" />
              <span className="text-sm font-bold tracking-tight text-foreground truncate">DataPipe</span>
            </div>
            <button
              onClick={toggleSidebar}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-gray-500 hover:bg-card hover:text-foreground transition-colors"
              title="Réduire la sidebar"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      {/* Nav principale */}
      <nav className={cn('flex-1 overflow-y-auto py-3 space-y-0.5', sidebarCollapsed ? 'px-1.5' : 'px-2')}>
        {mainNav.map(renderLink)}
      </nav>

      {/* Nav secondaire (bas) */}
      <div className={cn('space-y-0.5 border-t border-border py-3', sidebarCollapsed ? 'px-1.5' : 'px-2')}>
        {secondaryNav.map(renderLink)}
      </div>

      {/* Footer : langue + thème + statut API */}
      <div className="border-t border-border p-3 space-y-1">
        {sidebarCollapsed
          ? <LanguageToggle compact className="mx-auto" />
          : <LanguageToggle />}

        {sidebarCollapsed
          ? <ThemeToggle compact className="mx-auto" />
          : <ThemeToggle />}

        <div className={cn('flex items-center rounded-md px-2 py-1.5 text-xs text-gray-600 transition-all', sidebarCollapsed && 'justify-center')}>
          <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
          {!sidebarCollapsed && <span className="ml-2">{t('nav.apiConnected')}</span>}
        </div>
      </div>
    </aside>
  )

  function renderLink(item: NavItem) {
    const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
    return (
      <Link
        key={item.href}
        href={item.href}
        title={sidebarCollapsed ? t(item.key) : undefined}
        className={cn(
          'flex items-center gap-2.5 rounded-md py-2 text-sm font-medium transition-colors',
          isActive
            ? 'bg-primary/15 text-primary'
            : 'text-gray-500 hover:bg-card hover:text-foreground',
          sidebarCollapsed ? 'justify-center px-0' : 'px-3'
        )}
      >
        <item.icon className="h-4 w-4 shrink-0" />
        {!sidebarCollapsed && (
          <>
            <span className="flex-1">{t(item.key)}</span>
            {item.badge && unreadCount > 0 && (
              <Badge variant="destructive" className="h-4 min-w-4 px-1 text-[10px]">
                {unreadCount}
              </Badge>
            )}
          </>
        )}
      </Link>
    )
  }
}
