'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Eye, Store, Building2, Lock, Unlock, Euro, Percent, TrendingUp,
} from 'lucide-react'
import { PLATFORM_COMMISSION_RATE, splitRevenue, type MarketplaceListing } from '@/lib/marketplace/types'

export function StakeholderViews({
  listing,
  isOwner,
  isPurchased,
}: {
  listing: MarketplaceListing
  isOwner?: boolean
  isPurchased?: boolean
}) {
  const { platformFeeEur, sellerPayoutEur } = splitRevenue(listing.priceEur)
  const commissionPct = Math.round(PLATFORM_COMMISSION_RATE * 100)

  return (
    <Tabs defaultValue="buyer" className="w-full">
      <TabsList className="flex-wrap h-auto w-full justify-start">
        <TabsTrigger value="buyer" className="gap-1.5">
          <Eye className="h-3.5 w-3.5" /> Acheteur
        </TabsTrigger>
        <TabsTrigger value="seller" className="gap-1.5">
          <Store className="h-3.5 w-3.5" /> Vendeur (créateur)
        </TabsTrigger>
        <TabsTrigger value="platform" className="gap-1.5">
          <Building2 className="h-3.5 w-3.5" /> DataPipe (plateforme)
        </TabsTrigger>
      </TabsList>

      <TabsContent value="buyer" className="mt-4 space-y-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ce que l&apos;acheteur voit avant achat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-400">
            <Row ok label="Fiche produit (titre, description, prix, avis)" />
            <Row ok label="Aperçu du graphe (noms des nœuds, sans config)" />
            <Row ok label="Bouton « Essayer la démo » sur données fictives" />
            <Row ok label="Statistiques publiques (runs démo, taux de succès)" />
            <Row locked label="Configuration des nœuds (seuils, SQL, mappings)" />
            <Row locked label="Export JSON / YAML du pipeline" />
            <Row locked label="Exécution sur ses propres données" />
          </CardContent>
        </Card>
        {isPurchased && (
          <p className="text-xs text-emerald-400 flex items-center gap-1.5">
            <Unlock className="h-3.5 w-3.5" /> Vous avez acheté ce pipeline — config complète débloquée dans votre workspace.
          </p>
        )}
        {!isPurchased && !isOwner && (
          <p className="text-xs text-amber-400/90">
            Après paiement simulé : instanciation licenciée dans le workspace, sans export libre.
          </p>
        )}
      </TabsContent>

      <TabsContent value="seller" className="mt-4 space-y-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tableau de bord vendeur</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <StatBox icon={<Euro className="h-4 w-4 text-emerald-400" />} label="Prix affiché" value={`${listing.priceEur} €`} />
              <StatBox icon={<TrendingUp className="h-4 w-4 text-blue-400" />} label="Vous recevez (≈)" value={`${sellerPayoutEur} €`} sub={`par vente · ${100 - commissionPct} %`} />
            </div>
            <Row ok label="Gérer l'annonce (titre, prix, description)" />
            <Row ok label="Voir ventes, revenus nets et installations" />
            <Row ok label="Pousser une mise à jour v1.1 aux acheteurs" />
            <Row ok label="Répondre aux avis acheteurs" />
            <p className="text-xs text-gray-600 pt-1">
              Créateur : <span className="text-foreground">{listing.creatorName}</span>
              {listing.creatorOrg ? ` · ${listing.creatorOrg}` : ''}
            </p>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="platform" className="mt-4 space-y-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Vue DataPipe (opérateur marketplace)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <StatBox icon={<Percent className="h-4 w-4 text-purple-400" />} label="Commission" value={`${commissionPct} %`} sub={`${platformFeeEur} € / vente`} />
              <StatBox icon={<Euro className="h-4 w-4 text-amber-400" />} label="GMV (démo locale)" value={`${listing.priceEur} €`} sub="par transaction" />
            </div>
            <Row ok label="Modération des annonces & signalements" />
            <Row ok label="Paiement, facturation, reversement vendeur (Stripe Connect)" />
            <Row ok label="Protection anti-contournement (pas d'export marketplace)" />
            <Row ok label="Analytics agrégées : GMV, top vendeurs, catégories" />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}

function Row({ label, ok, locked }: { label: string; ok?: boolean; locked?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      {ok && <Badge variant="secondary" className="h-5 text-[10px] shrink-0 bg-emerald-500/15 text-emerald-400">Visible</Badge>}
      {locked && <Badge variant="secondary" className="h-5 text-[10px] shrink-0 bg-red-500/10 text-red-400"><Lock className="h-2.5 w-2.5 mr-0.5" />Bloqué</Badge>}
      <span className="text-gray-400">{label}</span>
    </div>
  )
}

function StatBox({
  icon, label, value, sub,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
}) {
  return (
    <div className="rounded-lg border border-border bg-card/50 p-3">
      <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">{icon}{label}</div>
      <p className="text-lg font-bold text-foreground">{value}</p>
      {sub && <p className="text-[10px] text-gray-600">{sub}</p>}
    </div>
  )
}
