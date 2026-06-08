'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Rocket, ChevronRight, ChevronLeft, Eye, Euro, Percent, CheckCircle2,
} from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { TemplateGraphPreview } from '@/components/templates/TemplateGraphPreview'
import { pipelinesApi } from '@/lib/api/pipelines'
import { sanitizePipelineForPreview } from '@/lib/marketplace/pipelinePreview'
import {
  PLATFORM_COMMISSION_RATE,
  splitRevenue,
  type MarketplaceCategory,
  type PricingModel,
} from '@/lib/marketplace/types'
import { useMarketplaceStore } from '@/store/marketplace.store'
import { useAuthStore } from '@/store/auth.store'
import { StakeholderViews } from './StakeholderViews'
import { toast } from 'sonner'
import type { Pipeline } from '@/types'

const CATEGORIES: MarketplaceCategory[] = ['Banque', 'Finance', 'OHADA', 'RH', 'Retail', 'Général']

const STEPS = ['Produit', 'Aperçu acheteur', 'Revenus', 'Confirmation']

export function PublishPipelineDialog({
  pipeline,
  open,
  onOpenChange,
}: {
  pipeline: Pipeline | null
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const currentOrg = useAuthStore((s) => s.currentOrg)
  const publishListing = useMarketplaceStore((s) => s.publishListing)

  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [publishedId, setPublishedId] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<MarketplaceCategory>('Général')
  const [priceEur, setPriceEur] = useState('49')
  const [pricingModel, setPricingModel] = useState<PricingModel>('one_time')
  const [preview, setPreview] = useState<{ nodes: ReturnType<typeof sanitizePipelineForPreview>['nodes']; edges: ReturnType<typeof sanitizePipelineForPreview>['edges'] }>({ nodes: [], edges: [] })

  useEffect(() => {
    if (!open || !pipeline) return
    setStep(0)
    setPublishedId(null)
    setTitle(pipeline.name)
    setDescription(pipeline.description ?? '')
    setLoading(true)
    pipelinesApi
      .get(pipeline.id)
      .then((full) => setPreview(sanitizePipelineForPreview(full)))
      .catch(() => toast.error('Impossible de charger le graphe'))
      .finally(() => setLoading(false))
  }, [open, pipeline])

  if (!pipeline) return null

  const price = Math.max(0, Number(priceEur) || 0)
  const { platformFeeEur, sellerPayoutEur } = splitRevenue(price)
  const commissionPct = Math.round(PLATFORM_COMMISSION_RATE * 100)

  const handlePublish = async () => {
    if (!user) return
    setLoading(true)
    try {
      await pipelinesApi.publish(pipeline.id).catch(() => {
        /* démo : publication marketplace même si l'API échoue */
      })
      const listing = publishListing({
        pipelineId: pipeline.id,
        pipelineName: pipeline.name,
        title: title.trim() || pipeline.name,
        description: description.trim(),
        category,
        priceEur: price,
        pricingModel,
        previewNodes: preview.nodes,
        previewEdges: preview.edges,
        nodesCount: pipeline.nodes_count ?? preview.nodes.length,
        creatorId: user.id,
        creatorName: user.name,
        creatorOrg: currentOrg?.name,
      })
      setPublishedId(listing.id)
      setStep(4)
      toast.success('Pipeline publié sur la marketplace (démo)')
    } catch {
      toast.error('Publication impossible')
    } finally {
      setLoading(false)
    }
  }

  const draftListing = {
    id: 'draft',
    pipelineId: pipeline.id,
    pipelineName: pipeline.name,
    title: title || pipeline.name,
    description,
    category,
    priceEur: price,
    pricingModel,
    status: 'published' as const,
    previewNodes: preview.nodes,
    previewEdges: preview.edges,
    nodesCount: preview.nodes.length,
    creatorId: user?.id ?? '',
    creatorName: user?.name ?? 'Vous',
    creatorOrg: currentOrg?.name,
    publishedAt: new Date().toISOString(),
    demoRuns: 0,
    successRate: 100,
    avgDurationSec: 0,
    installCount: 0,
    rating: 0,
    reviewCount: 0,
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            {step >= 4 ? 'Publication réussie' : 'Publier sur la Marketplace'}
          </DialogTitle>
          {step < 4 && (
            <div className="space-y-2 pt-2">
              <div className="flex justify-between text-xs text-gray-600">
                <span>Étape {step + 1} / {STEPS.length} — {STEPS[step]}</span>
                <span>{pipeline.name}</span>
              </div>
              <Progress value={((step + 1) / STEPS.length) * 100} className="h-1" />
            </div>
          )}
        </DialogHeader>

        {step === 0 && (
          <div className="space-y-4 py-2">
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-200/90">
              Démo frontend — annonce stockée localement. Le paiement et les reversements sont simulés.
            </div>
            <div className="space-y-2">
              <Label>Titre marketplace</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nom visible par les acheteurs" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Problème résolu, secteur, livrables…" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Catégorie</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as MarketplaceCategory)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Modèle</Label>
                <Select value={pricingModel} onValueChange={(v) => setPricingModel(v as PricingModel)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one_time">Achat unique</SelectItem>
                    <SelectItem value="subscription">Abonnement / mois</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Prix (EUR)</Label>
              <Input type="number" min={0} value={priceEur} onChange={(e) => setPriceEur(e.target.value)} />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4 py-2">
            <p className="text-sm text-gray-500 flex items-center gap-2">
              <Eye className="h-4 w-4" /> Aperçu public — structure visible, <strong className="text-foreground">config masquée</strong>
            </p>
            {loading ? (
              <div className="h-[220px] rounded-lg bg-card animate-pulse" />
            ) : (
              <TemplateGraphPreview nodes={preview.nodes} edges={preview.edges} />
            )}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-md border border-emerald-500/20 bg-emerald-500/5 p-2 text-emerald-400">✓ Types et labels des nœuds</div>
              <div className="rounded-md border border-red-500/20 bg-red-500/5 p-2 text-red-400">✗ Seuils, SQL, credentials</div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 py-2">
            <p className="text-sm text-gray-500">Répartition sur chaque vente à {price} €</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-center">
                <Euro className="h-6 w-6 text-emerald-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-foreground">{sellerPayoutEur} €</p>
                <p className="text-xs text-gray-500 mt-1">Vous (créateur) · {100 - commissionPct} %</p>
              </div>
              <div className="rounded-xl border border-purple-500/30 bg-purple-500/5 p-4 text-center">
                <Percent className="h-6 w-6 text-purple-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-foreground">{platformFeeEur} €</p>
                <p className="text-xs text-gray-500 mt-1">DataPipe · {commissionPct} %</p>
              </div>
            </div>
            <StakeholderViews listing={draftListing} isOwner />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 py-2">
            <div className="rounded-lg border border-border p-4 space-y-2 text-sm">
              <p className="font-semibold text-foreground">{title}</p>
              <p className="text-gray-500 text-xs line-clamp-2">{description}</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{category}</Badge>
                <Badge variant="secondary">{price} € {pricingModel === 'subscription' ? '/ mois' : ''}</Badge>
                <Badge variant="secondary">{preview.nodes.length} nœuds</Badge>
              </div>
            </div>
            <ul className="text-xs text-gray-500 space-y-1.5">
              <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Flag <code className="text-[10px]">is_public</code> via l&apos;API publish</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Fiche visible dans Marketplace → Découvrir</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Export JSON désactivé pour les acheteurs (démo)</li>
            </ul>
          </div>
        )}

        {step >= 4 && publishedId && (
          <div className="space-y-4 py-2">
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15">
                <CheckCircle2 className="h-8 w-8 text-emerald-400" />
              </div>
              <p className="font-semibold text-foreground">Votre pipeline est en ligne !</p>
              <p className="text-sm text-gray-500 max-w-md">
                Consultez la vue acheteur, votre tableau vendeur et la commission plateforme.
              </p>
            </div>
            <StakeholderViews listing={{ ...draftListing, id: publishedId }} isOwner />
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          {step >= 4 ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Fermer</Button>
              <Button onClick={() => router.push(`/dashboard/marketplace/${publishedId}`)}>
                Voir la fiche publique
              </Button>
              <Button variant="secondary" onClick={() => router.push('/dashboard/marketplace?tab=seller')}>
                Mes annonces
              </Button>
            </>
          ) : (
            <>
              {step > 0 && (
                <Button variant="outline" onClick={() => setStep((s) => s - 1)}>
                  <ChevronLeft className="h-4 w-4 mr-1" /> Retour
                </Button>
              )}
              {step < 3 ? (
                <Button onClick={() => setStep((s) => s + 1)} disabled={!title.trim()}>
                  Suivant <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button onClick={handlePublish} disabled={loading}>
                  {loading ? 'Publication…' : 'Publier maintenant'}
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
