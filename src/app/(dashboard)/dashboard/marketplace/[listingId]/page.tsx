'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Star, Play, ShoppingCart, Lock, CheckCircle2, User, Clock, Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { TemplateGraphPreview } from '@/components/templates/TemplateGraphPreview'
import { StakeholderViews } from '@/components/marketplace/StakeholderViews'
import { useMarketplaceStore } from '@/store/marketplace.store'
import { useAuthStore } from '@/store/auth.store'
import { splitRevenue } from '@/lib/marketplace/types'
import { toast } from 'sonner'
import { DashboardPageShell } from '@/components/layout/DashboardPageShell'

export default function MarketplaceListingPage({
  params,
}: {
  params: Promise<{ listingId: string }>
}) {
  const { listingId } = use(params)
  const router = useRouter()
  const user = useAuthStore((s) => s.user)

  const getListing = useMarketplaceStore((s) => s.getListing)
  const hasPurchased = useMarketplaceStore((s) => s.hasPurchased)
  const recordPurchase = useMarketplaceStore((s) => s.recordPurchase)

  const listing = getListing(listingId)
  const [demoOpen, setDemoOpen] = useState(false)
  const [buyOpen, setBuyOpen] = useState(false)
  const [demoRunning, setDemoRunning] = useState(false)
  const [demoDone, setDemoDone] = useState(false)

  if (!listing) {
    return (
      <DashboardPageShell helpKey="marketplace" width="default" hideContextPanel>
        <div className="text-center space-y-4">
          <p className="text-gray-500">Annonce introuvable</p>
          <Button variant="outline" asChild>
            <Link href="/dashboard/marketplace"><ArrowLeft className="h-4 w-4 mr-2" /> Retour</Link>
          </Button>
        </div>
      </DashboardPageShell>
    )
  }

  const isOwner = user?.id === listing.creatorId
  const purchased = user ? hasPurchased(user.id, listing.id) : false
  const { sellerPayoutEur, platformFeeEur } = splitRevenue(listing.priceEur)

  const runDemo = () => {
    setDemoRunning(true)
    setDemoDone(false)
    setTimeout(() => {
      setDemoRunning(false)
      setDemoDone(true)
    }, 2200)
  }

  const handleBuy = () => {
    if (!user) {
      toast.error('Connectez-vous pour acheter')
      return
    }
    if (isOwner) {
      toast.info('Vous êtes le vendeur de cette annonce')
      return
    }
    if (purchased) {
      toast.info('Vous possédez déjà ce pipeline')
      return
    }
    recordPurchase({ listing, buyerId: user.id, buyerName: user.name })
    setBuyOpen(false)
    toast.success('Achat simulé — pipeline licencié dans votre workspace (démo)')
  }

  return (
    <DashboardPageShell helpKey="marketplace" width="default" hideContextPanel>
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/dashboard/marketplace"><ArrowLeft className="h-4 w-4 mr-1" /> Marketplace</Link>
      </Button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{listing.category}</Badge>
            {listing.pricingModel === 'subscription' && (
              <Badge variant="outline">Abonnement</Badge>
            )}
            {isOwner && <Badge className="bg-primary/20 text-primary">Votre annonce</Badge>}
            {purchased && <Badge className="bg-emerald-500/15 text-emerald-400">Acheté</Badge>}
          </div>
          <h1 className="text-2xl font-bold text-foreground">{listing.title}</h1>
          <p className="text-sm text-gray-500 flex items-center gap-2">
            <User className="h-4 w-4" />
            {listing.creatorName}
            {listing.creatorOrg ? ` · ${listing.creatorOrg}` : ''}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-3xl font-bold text-foreground">
            {listing.priceEur} €
            {listing.pricingModel === 'subscription' && (
              <span className="text-sm font-normal text-gray-600"> /mois</span>
            )}
          </p>
          <p className="text-xs text-gray-600 mt-1">
            Créateur : {sellerPayoutEur} € · DataPipe : {platformFeeEur} €
          </p>
        </div>
      </div>

      <p className="text-sm text-gray-400 leading-relaxed">{listing.description}</p>

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 text-center text-xs">
        <Stat icon={<Star className="h-4 w-4 text-amber-400" />} label="Note" value={listing.rating > 0 ? listing.rating.toFixed(1) : '—'} />
        <Stat icon={<Zap className="h-4 w-4 text-primary" />} label="Succès" value={`${listing.successRate}%`} />
        <Stat icon={<Clock className="h-4 w-4 text-blue-400" />} label="Durée moy." value={`${listing.avgDurationSec}s`} />
        <Stat icon={<ShoppingCart className="h-4 w-4 text-emerald-400" />} label="Installs" value={String(listing.installCount)} />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            Aperçu du pipeline
            {!purchased && !isOwner && (
              <Badge variant="secondary" className="text-[10px] font-normal">
                <Lock className="h-2.5 w-2.5 mr-1" /> Config masquée
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TemplateGraphPreview nodes={listing.previewNodes} edges={listing.previewEdges} height={260} />
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button variant="outline" className="gap-2" onClick={() => { setDemoOpen(true); runDemo() }}>
          <Play className="h-4 w-4" /> Essayer la démo
        </Button>
        {!isOwner && !purchased && (
          <Button className="gap-2" onClick={() => setBuyOpen(true)}>
            <ShoppingCart className="h-4 w-4" /> Acheter · {listing.priceEur} €
          </Button>
        )}
        {purchased && (
          <Button className="gap-2" variant="secondary" onClick={() => router.push('/dashboard/pipelines')}>
            <CheckCircle2 className="h-4 w-4" /> Ouvrir mes pipelines
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Qui voit quoi ?</CardTitle>
        </CardHeader>
        <CardContent>
          <StakeholderViews listing={listing} isOwner={isOwner} isPurchased={purchased} />
        </CardContent>
      </Card>

      {/* Démo sandbox */}
      <Dialog open={demoOpen} onOpenChange={setDemoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Démo sandbox — données fictives</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {demoRunning && (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-6 text-center animate-pulse">
                <p className="text-sm text-primary">Exécution sur échantillon mock…</p>
              </div>
            )}
            {demoDone && (
              <div className="space-y-2 text-sm">
                <p className="text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" /> Run terminé en 2,1 s · 1 000 lignes fictives
                </p>
                <div className="rounded-md border border-border bg-card/50 p-3 font-mono text-[11px] text-gray-500 overflow-x-auto">
                  <pre>{`date       | region | montant  | is_anomaly
2026-06-01 | Abidjan| 125000   | false
2026-06-01 | Dakar  | 8900000  | true  ← seuil dépassé
2026-06-02 | Lomé   | 45000    | false
… (aperçu limité à 3 lignes)`}</pre>
                </div>
                <p className="text-xs text-gray-600">
                  Export et config complète réservés à l&apos;acheteur.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDemoOpen(false)}>Fermer</Button>
            {!purchased && !isOwner && (
              <Button onClick={() => { setDemoOpen(false); setBuyOpen(true) }}>Acheter pour débloquer</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Achat simulé */}
      <Dialog open={buyOpen} onOpenChange={setBuyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer l&apos;achat (simulation)</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm py-2">
            <p><strong>{listing.title}</strong> — {listing.priceEur} €</p>
            <ul className="text-xs text-gray-500 space-y-1">
              <li>✓ Instanciation dans votre workspace</li>
              <li>✓ Configuration complète des nœuds</li>
              <li>✓ Mises à jour vendeur (quand disponibles)</li>
              <li>✗ Pas d&apos;export JSON marketplace</li>
            </ul>
            <div className="rounded-md border border-border p-3 text-xs grid grid-cols-2 gap-2">
              <span className="text-gray-600">Vendeur reçoit</span>
              <span className="text-right text-emerald-400 font-medium">{sellerPayoutEur} €</span>
              <span className="text-gray-600">Commission DataPipe</span>
              <span className="text-right text-purple-400 font-medium">{platformFeeEur} €</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBuyOpen(false)}>Annuler</Button>
            <Button onClick={handleBuy}>Payer {listing.priceEur} € (démo)</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardPageShell>
  )
}

function Stat({
  icon, label, value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex justify-center mb-1 text-gray-600">{icon}</div>
      <p className="font-bold text-foreground">{value}</p>
      <p className="text-[10px] text-gray-700">{label}</p>
    </div>
  )
}
