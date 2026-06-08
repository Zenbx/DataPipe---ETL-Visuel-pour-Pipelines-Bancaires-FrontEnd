'use client'

import Link from 'next/link'
import { Star, User, Zap } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TemplateGraphPreview } from '@/components/templates/TemplateGraphPreview'
import type { MarketplaceListing } from '@/lib/marketplace/types'

export function ListingCard({ listing }: { listing: MarketplaceListing }) {
  return (
    <Link href={`/dashboard/marketplace/${listing.id}`}>
      <Card className="group h-full overflow-hidden transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-black/20">
        <div className="border-b border-border bg-card/30 px-2 pt-2">
          <TemplateGraphPreview nodes={listing.previewNodes} edges={listing.previewEdges} height={140} glyph={36} />
        </div>
        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                {listing.title}
              </p>
              <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                <User className="h-3 w-3 shrink-0" />
                <span className="truncate">{listing.creatorName}</span>
              </p>
            </div>
            <Badge variant="secondary" className="shrink-0 text-[10px]">{listing.category}</Badge>
          </div>
          <p className="text-xs text-gray-500 line-clamp-2">{listing.description}</p>
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1 text-amber-400">
              <Star className="h-3 w-3 fill-amber-400" />
              {listing.rating > 0 ? listing.rating.toFixed(1) : '—'}
              <span className="text-gray-700">({listing.reviewCount})</span>
            </span>
            <span className="flex items-center gap-1 text-gray-600">
              <Zap className="h-3 w-3" /> {listing.nodesCount} nœuds
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-border pt-3">
            <span className="text-lg font-bold text-foreground">
              {listing.priceEur} €
              {listing.pricingModel === 'subscription' && (
                <span className="text-xs font-normal text-gray-600"> /mois</span>
              )}
            </span>
            <span className="text-[10px] text-gray-700">{listing.installCount} installs</span>
          </div>
        </div>
      </Card>
    </Link>
  )
}
