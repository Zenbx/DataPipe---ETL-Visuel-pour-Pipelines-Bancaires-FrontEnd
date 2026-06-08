import type { TplEdge, TplNode } from '@/components/templates/TemplateGraphPreview'

export type MarketplaceCategory =
  | 'Banque'
  | 'Finance'
  | 'OHADA'
  | 'RH'
  | 'Retail'
  | 'Général'

export type PricingModel = 'one_time' | 'subscription'

export type ListingStatus = 'draft' | 'published' | 'suspended'

export interface MarketplaceListing {
  id: string
  pipelineId: string
  pipelineName: string
  title: string
  description: string
  category: MarketplaceCategory
  priceEur: number
  pricingModel: PricingModel
  status: ListingStatus
  /** Aperçu graphe sans config sensible (labels + types uniquement) */
  previewNodes: TplNode[]
  previewEdges: TplEdge[]
  nodesCount: number
  creatorId: string
  creatorName: string
  creatorOrg?: string
  publishedAt: string
  /** Métriques sociales (démo) */
  demoRuns: number
  successRate: number
  avgDurationSec: number
  installCount: number
  rating: number
  reviewCount: number
}

export interface MarketplacePurchase {
  id: string
  listingId: string
  listingTitle: string
  buyerId: string
  buyerName: string
  sellerId: string
  sellerName: string
  priceEur: number
  platformFeeEur: number
  sellerPayoutEur: number
  purchasedAt: string
}

export interface PublishListingInput {
  pipelineId: string
  pipelineName: string
  title: string
  description: string
  category: MarketplaceCategory
  priceEur: number
  pricingModel: PricingModel
  previewNodes: TplNode[]
  previewEdges: TplEdge[]
  nodesCount: number
  creatorId: string
  creatorName: string
  creatorOrg?: string
}

export const PLATFORM_COMMISSION_RATE = 0.2

export function splitRevenue(priceEur: number) {
  const platformFeeEur = Math.round(priceEur * PLATFORM_COMMISSION_RATE * 100) / 100
  const sellerPayoutEur = Math.round((priceEur - platformFeeEur) * 100) / 100
  return { platformFeeEur, sellerPayoutEur }
}
