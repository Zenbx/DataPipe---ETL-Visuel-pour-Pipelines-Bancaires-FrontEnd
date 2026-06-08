import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { SEED_LISTINGS } from '@/lib/marketplace/seed'
import {
  splitRevenue,
  type MarketplaceListing,
  type MarketplacePurchase,
  type PublishListingInput,
} from '@/lib/marketplace/types'

interface MarketplaceState {
  userListings: MarketplaceListing[]
  purchases: MarketplacePurchase[]

  getAllListings: () => MarketplaceListing[]
  getListing: (id: string) => MarketplaceListing | undefined
  getMyListings: (creatorId: string) => MarketplaceListing[]
  getMyPurchases: (buyerId: string) => MarketplacePurchase[]
  hasPurchased: (buyerId: string, listingId: string) => boolean

  publishListing: (input: PublishListingInput) => MarketplaceListing
  recordPurchase: (params: {
    listing: MarketplaceListing
    buyerId: string
    buyerName: string
  }) => MarketplacePurchase

  getSellerStats: (sellerId: string) => {
    totalSales: number
    grossRevenue: number
    netRevenue: number
    platformFees: number
  }

  getPlatformStats: () => {
    gmv: number
    commission: number
    transactions: number
    activeListings: number
    topSellers: { name: string; sales: number; revenue: number }[]
  }
}

function newId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export const useMarketplaceStore = create<MarketplaceState>()(
  persist(
    (set, get) => ({
      userListings: [],
      purchases: [],

      getAllListings: () => {
        const published = get().userListings.filter((l) => l.status === 'published')
        return [...SEED_LISTINGS, ...published]
      },

      getListing: (id) => get().getAllListings().find((l) => l.id === id),

      getMyListings: (creatorId) =>
        get().userListings.filter((l) => l.creatorId === creatorId),

      getMyPurchases: (buyerId) =>
        get().purchases.filter((p) => p.buyerId === buyerId),

      hasPurchased: (buyerId, listingId) =>
        get().purchases.some((p) => p.buyerId === buyerId && p.listingId === listingId),

      publishListing: (input) => {
        const listing: MarketplaceListing = {
          id: newId('mkt'),
          pipelineId: input.pipelineId,
          pipelineName: input.pipelineName,
          title: input.title,
          description: input.description,
          category: input.category,
          priceEur: input.priceEur,
          pricingModel: input.pricingModel,
          status: 'published',
          previewNodes: input.previewNodes,
          previewEdges: input.previewEdges,
          nodesCount: input.nodesCount,
          creatorId: input.creatorId,
          creatorName: input.creatorName,
          creatorOrg: input.creatorOrg,
          publishedAt: new Date().toISOString(),
          demoRuns: 0,
          successRate: 100,
          avgDurationSec: 0,
          installCount: 0,
          rating: 0,
          reviewCount: 0,
        }
        set((s) => ({
          userListings: [
            ...s.userListings.filter((l) => l.pipelineId !== input.pipelineId),
            listing,
          ],
        }))
        return listing
      },

      recordPurchase: ({ listing, buyerId, buyerName }) => {
        const { platformFeeEur, sellerPayoutEur } = splitRevenue(listing.priceEur)
        const purchase: MarketplacePurchase = {
          id: newId('pur'),
          listingId: listing.id,
          listingTitle: listing.title,
          buyerId,
          buyerName,
          sellerId: listing.creatorId,
          sellerName: listing.creatorName,
          priceEur: listing.priceEur,
          platformFeeEur,
          sellerPayoutEur,
          purchasedAt: new Date().toISOString(),
        }
        set((s) => ({
          purchases: [...s.purchases, purchase],
          userListings: s.userListings.map((l) =>
            l.id === listing.id
              ? { ...l, installCount: l.installCount + 1 }
              : l,
          ),
        }))
        return purchase
      },

      getSellerStats: (sellerId) => {
        const sales = get().purchases.filter((p) => p.sellerId === sellerId)
        return {
          totalSales: sales.length,
          grossRevenue: sales.reduce((a, p) => a + p.priceEur, 0),
          netRevenue: sales.reduce((a, p) => a + p.sellerPayoutEur, 0),
          platformFees: sales.reduce((a, p) => a + p.platformFeeEur, 0),
        }
      },

      getPlatformStats: () => {
        const purchases = get().purchases
        const gmv = purchases.reduce((a, p) => a + p.priceEur, 0)
        const commission = purchases.reduce((a, p) => a + p.platformFeeEur, 0)
        const sellerMap = new Map<string, { name: string; sales: number; revenue: number }>()
        for (const p of purchases) {
          const cur = sellerMap.get(p.sellerId) ?? {
            name: p.sellerName,
            sales: 0,
            revenue: 0,
          }
          cur.sales++
          cur.revenue += p.sellerPayoutEur
          sellerMap.set(p.sellerId, cur)
        }
        const topSellers = [...sellerMap.values()]
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5)
        return {
          gmv,
          commission,
          transactions: purchases.length,
          activeListings: get().getAllListings().length,
          topSellers,
        }
      },
    }),
    { name: 'dp-marketplace-demo' },
  ),
)
