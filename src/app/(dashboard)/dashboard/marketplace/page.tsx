'use client'

import { useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Store, ShoppingBag, Building2, Search, Sparkles, Euro, TrendingUp, Package,
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ListingCard } from '@/components/marketplace/ListingCard'
import { useMarketplaceStore } from '@/store/marketplace.store'
import { useAuthStore } from '@/store/auth.store'
import { cn } from '@/lib/utils'
import { PLATFORM_COMMISSION_RATE } from '@/lib/marketplace/types'
import { DashboardPageShell } from '@/components/layout/DashboardPageShell'

export default function MarketplacePage() {
  const searchParams = useSearchParams()
  const defaultTab = searchParams.get('tab') ?? 'browse'
  const user = useAuthStore((s) => s.user)

  const getAllListings = useMarketplaceStore((s) => s.getAllListings)
  const getMyListings = useMarketplaceStore((s) => s.getMyListings)
  const getMyPurchases = useMarketplaceStore((s) => s.getMyPurchases)
  const getSellerStats = useMarketplaceStore((s) => s.getSellerStats)
  const getPlatformStats = useMarketplaceStore((s) => s.getPlatformStats)

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')

  const allListings = getAllListings()
  const myListings = user ? getMyListings(user.id) : []
  const myPurchases = user ? getMyPurchases(user.id) : []
  const sellerStats = user ? getSellerStats(user.id) : null
  const platformStats = getPlatformStats()

  const categories = useMemo(
    () => ['all', ...Array.from(new Set(allListings.map((l) => l.category)))],
    [allListings],
  )

  const filtered = useMemo(() => {
    let list = allListings
    if (category !== 'all') list = list.filter((l) => l.category === category)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          l.description.toLowerCase().includes(q) ||
          l.creatorName.toLowerCase().includes(q),
      )
    }
    return list
  }, [allListings, category, search])

  const commissionPct = Math.round(PLATFORM_COMMISSION_RATE * 100)

  return (
    <DashboardPageShell
      helpKey="marketplace"
      width="wide"
      title="Marketplace"
      description={`Les clients vendent leurs pipelines · DataPipe prélève ${commissionPct} % · démo locale`}
      actions={(
        <Badge variant="outline" className="w-fit border-amber-500/40 text-amber-400/90">
          <Sparkles className="h-3 w-3 mr-1" /> Paiements simulés
        </Badge>
      )}
    >
      <Tabs defaultValue={defaultTab} className="space-y-4">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="browse" className="gap-1.5">
            <Search className="h-3.5 w-3.5" /> Découvrir
          </TabsTrigger>
          <TabsTrigger value="seller" className="gap-1.5">
            <Store className="h-3.5 w-3.5" /> Mes annonces
          </TabsTrigger>
          <TabsTrigger value="purchases" className="gap-1.5">
            <ShoppingBag className="h-3.5 w-3.5" /> Mes achats
          </TabsTrigger>
          <TabsTrigger value="platform" className="gap-1.5">
            <Building2 className="h-3.5 w-3.5" /> Vue plateforme
          </TabsTrigger>
        </TabsList>

        {/* ── Acheteur : catalogue ── */}
        <TabsContent value="browse" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
              <Input
                className="pl-9"
                placeholder="Rechercher un pipeline, un créateur…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs transition-colors capitalize',
                    category === c
                      ? 'border-primary bg-primary/15 text-primary'
                      : 'border-border text-gray-500 hover:border-[#3a3a3a]',
                  )}
                >
                  {c === 'all' ? 'Tous' : c}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState icon={<Package className="h-10 w-10" />} text="Aucune annonce trouvée" />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((l) => <ListingCard key={l.id} listing={l} />)}
            </div>
          )}
        </TabsContent>

        {/* ── Vendeur : mes annonces ── */}
        <TabsContent value="seller" className="space-y-4">
          {!user ? (
            <EmptyState icon={<Store className="h-10 w-10" />} text="Connectez-vous pour gérer vos annonces" />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <MiniStat label="Annonces" value={String(myListings.length)} />
                <MiniStat label="Ventes (démo)" value={String(sellerStats?.totalSales ?? 0)} />
                <MiniStat label="Revenus nets" value={`${(sellerStats?.netRevenue ?? 0).toFixed(0)} €`} icon={<Euro className="h-4 w-4 text-emerald-400" />} />
                <MiniStat label="Commission payée" value={`${(sellerStats?.platformFees ?? 0).toFixed(0)} €`} />
              </div>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Comment publier ?</CardTitle>
                  <CardDescription>
                    Pipelines → menu ⋯ sur un pipeline → <strong>Publier sur la marketplace</strong>
                  </CardDescription>
                </CardHeader>
              </Card>
              {myListings.length === 0 ? (
                <EmptyState
                  icon={<Store className="h-10 w-10" />}
                  text="Vous n'avez pas encore publié de pipeline"
                  hint="Depuis la liste Pipelines, ouvrez le menu d'un pipeline et choisissez « Publier sur la marketplace »."
                />
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {myListings.map((l) => <ListingCard key={l.id} listing={l} />)}
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* ── Acheteur : historique achats ── */}
        <TabsContent value="purchases" className="space-y-4">
          {!user ? (
            <EmptyState icon={<ShoppingBag className="h-10 w-10" />} text="Connectez-vous pour voir vos achats" />
          ) : myPurchases.length === 0 ? (
            <EmptyState
              icon={<ShoppingBag className="h-10 w-10" />}
              text="Aucun achat pour l'instant"
              hint="Parcourez le catalogue et utilisez « Acheter » sur une fiche produit."
            />
          ) : (
            <div className="space-y-2">
              {myPurchases.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg border border-border px-4 py-3 text-sm">
                  <div>
                    <p className="font-medium text-foreground">{p.listingTitle}</p>
                    <p className="text-xs text-gray-600">Vendeur : {p.sellerName}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{p.priceEur} €</p>
                    <p className="text-[10px] text-gray-700">
                      {new Date(p.purchasedAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Plateforme DataPipe ── */}
        <TabsContent value="platform" className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MiniStat label="GMV (démo)" value={`${platformStats.gmv.toFixed(0)} €`} icon={<TrendingUp className="h-4 w-4 text-blue-400" />} />
            <MiniStat label={`Commission (${commissionPct} %)`} value={`${platformStats.commission.toFixed(0)} €`} icon={<Euro className="h-4 w-4 text-purple-400" />} />
            <MiniStat label="Transactions" value={String(platformStats.transactions)} />
            <MiniStat label="Annonces actives" value={String(platformStats.activeListings)} />
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Top vendeurs (démo locale)</CardTitle>
              <CardDescription>Revenus nets reversés aux créateurs après commission</CardDescription>
            </CardHeader>
            <CardContent>
              {platformStats.topSellers.length === 0 ? (
                <p className="text-sm text-gray-600 py-4 text-center">Aucune vente simulée — achetez un pipeline pour alimenter les stats.</p>
              ) : (
                <div className="space-y-2">
                  {platformStats.topSellers.map((s, i) => (
                    <div key={s.name} className="flex items-center justify-between text-sm border-b border-border/50 pb-2 last:border-0">
                      <span className="text-gray-400">#{i + 1} {s.name}</span>
                      <span className="text-foreground font-medium">{s.revenue.toFixed(0)} € · {s.sales} vente(s)</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardPageShell>
  )
}

function MiniStat({
  label, value, icon,
}: {
  label: string
  value: string
  icon?: React.ReactNode
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-gray-600 flex items-center gap-1.5 mb-1">{icon}{label}</p>
        <p className="text-xl font-bold text-foreground">{value}</p>
      </CardContent>
    </Card>
  )
}

function EmptyState({
  icon, text, hint,
}: {
  icon: React.ReactNode
  text: string
  hint?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 gap-3 text-center px-6">
      <div className="text-gray-700">{icon}</div>
      <p className="text-sm text-gray-600">{text}</p>
      {hint && <p className="text-xs text-gray-700 max-w-md">{hint}</p>}
    </div>
  )
}
