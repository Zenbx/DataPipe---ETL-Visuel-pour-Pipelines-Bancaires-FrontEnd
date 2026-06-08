'use client'

import { useEffect, useState } from 'react'
import { NodeGlyph } from '@/components/marketing/MiniPipeline'

const BORDER = {
  gray: 'rgba(255,255,255,0.14)',
  orange: '#ff6d35',
  green: '#22c55e',
} as const

const NODE_SIZE = 52
const NODE_R = 2.6

const PIPELINES = [
  {
    nodes: [
      { id: 'r1n0', slug: 'csv_reader', x: 7, y: 34 },
      { id: 'r1n1', slug: 'mask_pii', x: 24, y: 34 },
      { id: 'r1n2', slug: 'filter', x: 41, y: 34 },
      { id: 'r1n3', slug: 'ai_transform', x: 58, y: 34 },
      { id: 'r1n4', slug: 'file_export', x: 75, y: 34 },
      { id: 'r1n5', slug: 'validate', x: 92, y: 34 },
    ],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5]],
  },
  {
    nodes: [
      { id: 'r2n0', slug: 'json_reader', x: 10, y: 68 },
      { id: 'r2n1', slug: 'map', x: 27, y: 68 },
      { id: 'r2n2', slug: 'join', x: 44, y: 68 },
      { id: 'r2n3', slug: 'aggregate', x: 61, y: 68 },
      { id: 'r2n4', slug: 'detect_anomalies', x: 78, y: 68 },
      { id: 'r2n5', slug: 'chart', x: 95, y: 68 },
    ],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5]],
  },
] as const

type FlatNode = (typeof PIPELINES)[number]['nodes'][number] & { flatIdx: number }

const FLAT_NODES: FlatNode[] = PIPELINES.flatMap((p, pi) =>
  p.nodes.map((n, ni) => ({ ...n, flatIdx: PIPELINES.slice(0, pi).reduce((s, g) => s + g.nodes.length, 0) + ni })),
)

const FLAT_EDGES: { from: FlatNode; to: FlatNode; edgeIdx: number }[] = PIPELINES.flatMap((p, pi) => {
  const offset = PIPELINES.slice(0, pi).reduce((s, g) => s + g.nodes.length, 0)
  return p.edges.map(([a, b], i) => ({
    from: { ...p.nodes[a], flatIdx: offset + a },
    to: { ...p.nodes[b], flatIdx: offset + b },
    edgeIdx: offset + i,
  }))
})

function port(node: { x: number; y: number }, side: 'in' | 'out') {
  return { x: node.x + (side === 'out' ? NODE_R : -NODE_R), y: node.y }
}

function AuthEdge({
  from,
  to,
  color,
  active,
  markerId,
}: {
  from: { x: number; y: number }
  to: { x: number; y: number }
  color: string
  active: boolean
  markerId: string
}) {
  const dx = Math.max(4, Math.abs(to.x - from.x) * 0.42)
  const cp1 = { x: from.x + dx, y: from.y }
  const cp2 = { x: to.x - dx, y: to.y }
  const pathD = `M ${from.x} ${from.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${to.x} ${to.y}`

  return (
    <g>
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={active ? 0.95 : 0.75}
        strokeLinecap="round"
        markerEnd={`url(#${markerId})`}
        style={{ transition: 'stroke 0.35s ease' }}
      />
      {active && (
        <circle r="0.55" fill={BORDER.orange}>
          <animateMotion dur="1.4s" repeatCount="indefinite" path={pathD} />
        </circle>
      )}
    </g>
  )
}

export function AuthPipelineBackground() {
  const [activeIdx, setActiveIdx] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setActiveIdx((p) => (p + 1) % FLAT_NODES.length), 1400)
    return () => clearInterval(t)
  }, [])

  return (
    <div
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
      style={{ opacity: 0.32 }}
      aria-hidden
    >
      <div className="relative w-[min(1100px,96vw)]" style={{ aspectRatio: '11 / 5' }}>
        <svg
          className="absolute inset-0 h-full w-full overflow-visible"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <defs>
            {FLAT_EDGES.map((e) => (
              <marker
                key={e.edgeIdx}
                id={`auth-arr-${e.edgeIdx}`}
                markerWidth="3"
                markerHeight="3"
                refX="2.4"
                refY="1.5"
                orient="auto"
                markerUnits="strokeWidth"
              >
                <path d="M0,0 L2.6,1.5 L0,3 Z" fill="currentColor" />
              </marker>
            ))}
          </defs>

          {FLAT_EDGES.map((e) => {
            const from = port(e.from, 'out')
            const to = port(e.to, 'in')
            const lit = activeIdx === e.from.flatIdx || activeIdx === e.to.flatIdx
            const done = activeIdx > e.from.flatIdx
            const color = lit ? BORDER.orange : done ? BORDER.green : 'rgba(255,255,255,0.1)'
            return (
              <g key={e.edgeIdx} style={{ color }}>
                <AuthEdge
                  from={from}
                  to={to}
                  color={color}
                  active={lit}
                  markerId={`auth-arr-${e.edgeIdx}`}
                />
              </g>
            )
          })}
        </svg>

        {FLAT_NODES.map((node) => {
          const isActive = activeIdx === node.flatIdx
          const isDone = activeIdx > node.flatIdx
          const border = isActive ? BORDER.orange : isDone ? BORDER.green : BORDER.gray
          return (
            <div
              key={node.id}
              className="absolute z-10"
              style={{
                left: `${node.x}%`,
                top: `${node.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              {isActive && (
                <div
                  className="absolute inset-0 rounded-xl"
                  style={{
                    margin: -6,
                    border: `1px solid ${BORDER.orange}`,
                    opacity: 0.35,
                    animation: 'auth-node-pulse 1s ease-in-out infinite',
                  }}
                />
              )}
              <NodeGlyph slug={node.slug} label="" size={NODE_SIZE} borderColor={border} />
            </div>
          )
        })}
      </div>

      <style>{`
        @keyframes auth-node-pulse {
          0%, 100% { opacity: 0.25; }
          50% { opacity: 0.55; }
        }
      `}</style>
    </div>
  )
}
