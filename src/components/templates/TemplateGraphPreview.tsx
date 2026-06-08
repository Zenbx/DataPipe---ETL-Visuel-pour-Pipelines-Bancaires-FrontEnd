'use client'

import { NodeGlyph } from '@/components/marketing/MiniPipeline'

export interface TplNode { id: string; type?: string; slug?: string; label?: string; position?: { x: number; y: number } }
export interface TplEdge { source?: string; target?: string }

/**
 * Aperçu visuel d'un template : rend le graphe réel (nœuds + arêtes) à partir
 * des positions absolues du template, recadré et mis à l'échelle pour tenir
 * dans une zone fixe. Réutilise NodeGlyph (formes/icônes/couleurs des nœuds).
 */
export function TemplateGraphPreview({
  nodes,
  edges,
  height = 220,
  glyph = 46,
}: {
  nodes: TplNode[]
  edges: TplEdge[]
  height?: number
  glyph?: number
}) {
  if (!nodes || nodes.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed border-border text-xs text-gray-600" style={{ height }}>
        Aperçu indisponible
      </div>
    )
  }

  // Coordonnées sources (fallback en grille si positions absentes)
  const pts = nodes.map((n, i) => ({
    id: n.id,
    slug: n.slug ?? n.type ?? 'csv_reader',
    label: n.label,
    x: n.position?.x ?? (i % 4) * 200,
    y: n.position?.y ?? Math.floor(i / 4) * 130,
  }))

  const PAD = glyph / 2 + 18
  const minX = Math.min(...pts.map((p) => p.x))
  const maxX = Math.max(...pts.map((p) => p.x))
  const minY = Math.min(...pts.map((p) => p.y))
  const maxY = Math.max(...pts.map((p) => p.y))
  const spanX = Math.max(1, maxX - minX)
  const spanY = Math.max(1, maxY - minY)

  // Largeur de référence du conteneur (le dialog fait ~460px utiles)
  const innerW = 440 - PAD * 2
  const innerH = height - PAD * 2
  const scale = Math.min(innerW / spanX, innerH / spanY, 1.4)

  const place = (p: { x: number; y: number }) => ({
    cx: PAD + (p.x - minX) * scale,
    cy: PAD + (p.y - minY) * scale,
  })
  const byId: Record<string, (typeof pts)[number]> = Object.fromEntries(pts.map((p) => [p.id, p]))

  return (
    <div
      className="relative overflow-hidden rounded-lg border border-border"
      style={{ height, background: 'var(--canvas-bg, var(--background))' }}
    >
      {/* Arêtes */}
      <svg className="absolute inset-0 h-full w-full" style={{ pointerEvents: 'none' }}>
        {edges.map((e, i) => {
          const a = e.source ? byId[e.source] : undefined
          const b = e.target ? byId[e.target] : undefined
          if (!a || !b) return null
          const s = place(a), t = place(b)
          const sx = s.cx + glyph / 2, sy = s.cy
          const tx = t.cx - glyph / 2, ty = t.cy
          const dx = Math.max(22, (tx - sx) / 2)
          const path = `M ${sx} ${sy} C ${sx + dx} ${sy}, ${tx - dx} ${ty}, ${tx} ${ty}`
          return (
            <g key={i}>
              <path d={path} fill="none" stroke="var(--edge, rgba(148,163,184,0.4))" strokeWidth={1.6} />
              <path d={`M ${tx - 6} ${ty - 4} L ${tx} ${ty} L ${tx - 6} ${ty + 4} Z`} fill="var(--edge, rgba(148,163,184,0.4))" />
            </g>
          )
        })}
      </svg>

      {/* Nœuds */}
      {pts.map((p) => {
        const { cx, cy } = place(p)
        return (
          <div key={p.id} style={{ position: 'absolute', left: cx, top: cy - glyph / 2, transform: 'translateX(-50%)' }}>
            <NodeGlyph slug={p.slug} label={p.label} size={glyph} />
          </div>
        )
      })}
    </div>
  )
}
