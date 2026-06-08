'use client'

import { useEffect, useState } from 'react'
import { Play } from 'lucide-react'
import { NodeGlyph } from '@/components/marketing/MiniPipeline'

const STEPS = [
  { id: 'n1', slug: 'csv_reader', label: 'Relevé bancaire' },
  { id: 'n2', slug: 'mask_pii', label: 'Masquage RGPD' },
  { id: 'n3', slug: 'detect_anomalies', label: 'Anomalies' },
  { id: 'n4', slug: 'file_export', label: 'Export alertes' },
] as const

const NODE_KEYS = ['n1', 'n2', 'n3', 'n4'] as const
type NodeKey = (typeof NODE_KEYS)[number]

const NODE_SIZE = 48
const GHOST_SIZE = 44

const BORDER = {
  gray: 'rgba(255,255,255,0.18)',
  orange: '#ff6d35',
  green: '#22c55e',
} as const

/** Positions des nœuds (% du canvas pleine largeur) */
const NODE_POS: Record<NodeKey, { x: number; y: number }> = {
  n1: { x: 16, y: 40 },
  n2: { x: 38, y: 40 },
  n3: { x: 62, y: 40 },
  n4: { x: 84, y: 40 },
}

/** Décalage du centre du bloc (icône+label) vers le centre de l'icône seule */
const ICON_ANCHOR_OFFSET_PX = 10

function iconCenter(key: NodeKey) {
  return NODE_POS[key]
}

const PORT_OFFSET_X = 6.5

function edgePort(key: NodeKey, side: 'out' | 'in') {
  const c = iconCenter(key)
  return {
    x: c.x + (side === 'out' ? PORT_OFFSET_X : -PORT_OFFSET_X),
    y: c.y,
  }
}

/** Point de départ hors canvas (gauche) */
function dragOrigin(key: NodeKey) {
  const c = iconCenter(key)
  return { x: -11, y: c.y }
}

type Phase =
  | 'pause'
  | 'drag1' | 'drop1'
  | 'drag2' | 'drop2'
  | 'drag3' | 'drop3'
  | 'drag4' | 'drop4'
  | 'connect1' | 'connect2' | 'connect3'
  | 'move-run' | 'click-run'
  | 'running' | 'success'

const TIMELINE: { phase: Phase; at: number }[] = [
  { phase: 'pause', at: 0 },
  { phase: 'drag1', at: 500 },
  { phase: 'drop1', at: 1300 },
  { phase: 'drag2', at: 1500 },
  { phase: 'drop2', at: 2300 },
  { phase: 'drag3', at: 2500 },
  { phase: 'drop3', at: 3300 },
  { phase: 'drag4', at: 3500 },
  { phase: 'drop4', at: 4300 },
  { phase: 'connect1', at: 4500 },
  { phase: 'connect2', at: 5100 },
  { phase: 'connect3', at: 5700 },
  { phase: 'move-run', at: 6300 },
  { phase: 'click-run', at: 6900 },
  { phase: 'running', at: 7100 },
  { phase: 'success', at: 9500 },
  { phase: 'pause', at: 10800 },
]

const LOOP_MS = 11000

function ease(t: number) {
  const x = Math.min(1, Math.max(0, t))
  return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function phaseAt(elapsed: number): Phase {
  let p: Phase = 'pause'
  for (const entry of TIMELINE) {
    if (elapsed >= entry.at) p = entry.phase
  }
  return p
}

function phaseStart(phase: Phase) {
  return TIMELINE.find((t) => t.phase === phase)?.at ?? 0
}

function phaseEnd(phase: Phase) {
  const i = TIMELINE.findIndex((t) => t.phase === phase)
  if (i < 0 || i >= TIMELINE.length - 1) return LOOP_MS
  return TIMELINE[i + 1].at
}

function phaseT(elapsed: number, phase: Phase) {
  const start = phaseStart(phase)
  const end = phaseEnd(phase)
  const dur = Math.max(1, end - start)
  return ease((elapsed - start) / dur)
}

function droppedCount(phase: Phase): number {
  if (phase.startsWith('drag')) return parseInt(phase.replace('drag', ''), 10) - 1
  if (phase.startsWith('drop')) return parseInt(phase.replace('drop', ''), 10)
  if (['connect1', 'connect2', 'connect3', 'move-run', 'click-run', 'running', 'success'].includes(phase)) {
    return 4
  }
  return 0
}

function dragIndex(phase: Phase): number | null {
  if (!phase.startsWith('drag')) return null
  return parseInt(phase.replace('drag', ''), 10) - 1
}

function nodeKeyAt(i: number): NodeKey {
  return NODE_KEYS[i]
}

function cursorPos(elapsed: number, phase: Phase): { x: number; y: number; down: boolean } {
  const t = phaseT(elapsed, phase)

  if (phase.startsWith('drag')) {
    const i = parseInt(phase.replace('drag', ''), 10) - 1
    const key = nodeKeyAt(i)
    const from = dragOrigin(key)
    const to = NODE_POS[key]
    return { x: lerp(from.x, to.x, t), y: lerp(from.y, to.y, t), down: true }
  }

  if (phase.startsWith('drop')) {
    const i = parseInt(phase.replace('drop', ''), 10) - 1
    const p = NODE_POS[nodeKeyAt(i)]
    return { x: p.x, y: p.y, down: false }
  }

  if (phase === 'connect1' || phase === 'connect2' || phase === 'connect3') {
    const idx = phase === 'connect1' ? 0 : phase === 'connect2' ? 1 : 2
    const from = edgePort(NODE_KEYS[idx], 'out')
    const to = edgePort(NODE_KEYS[idx + 1], 'in')
    return { x: lerp(from.x, to.x, t), y: lerp(from.y, to.y, t), down: true }
  }

  if (phase === 'move-run') {
    const from = NODE_POS.n4
    const to = { x: 50, y: 90 }
    return { x: lerp(from.x, to.x, t), y: lerp(from.y, to.y, t), down: false }
  }

  if (phase === 'click-run') {
    return { x: 50, y: 90, down: true }
  }

  if (phase === 'running' || phase === 'success') {
    return { x: 52, y: 91, down: false }
  }

  return { x: -8, y: iconCenter('n1').y, down: false }
}

function connectProgress(phase: Phase, elapsed: number): [number, number, number] {
  const prog = (p: Phase) => phaseT(elapsed, p)
  return [
    phase === 'connect1' ? prog('connect1')
      : ['connect2', 'connect3', 'move-run', 'click-run', 'running', 'success'].includes(phase) ? 1 : 0,
    phase === 'connect2' ? prog('connect2')
      : ['connect3', 'move-run', 'click-run', 'running', 'success'].includes(phase) ? 1 : 0,
    phase === 'connect3' ? prog('connect3')
      : ['move-run', 'click-run', 'running', 'success'].includes(phase) ? 1 : 0,
  ]
}

function runningIndex(phase: Phase, elapsed: number): number {
  if (phase !== 'running' && phase !== 'success') return -1
  if (phase === 'success') return 4
  const start = phaseStart('running')
  return Math.min(3, Math.floor((elapsed - start) / 580))
}

function nodeBorder(nodeIdx: number, phase: Phase, runIdx: number): string {
  if (phase !== 'running' && phase !== 'success') return BORDER.gray
  if (phase === 'success') return BORDER.green
  if (nodeIdx < runIdx) return BORDER.green
  if (nodeIdx === runIdx) return BORDER.orange
  return BORDER.gray
}

function edgeColor(progress: number, phase: Phase, edgeIdx: number, runIdx: number): string {
  if (progress <= 0) return BORDER.gray
  if (phase === 'success') return BORDER.green
  if (phase === 'running') {
    if (runIdx > edgeIdx) return BORDER.green
    if (runIdx === edgeIdx) return BORDER.orange
  }
  return 'rgba(255,255,255,0.28)'
}

function CursorWithDrag({
  x, y, down, dragSlug,
}: {
  x: number
  y: number
  down: boolean
  dragSlug: string | null
}) {
  return (
    <div
      className="pointer-events-none absolute z-50"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: `scale(${down ? 0.94 : 1})`,
        transition: 'transform 0.1s ease',
      }}
    >
      {dragSlug && (
        <div
          className="absolute"
          style={{
            left: 14,
            top: 18,
            transform: 'translate(-50%, -50%)',
            opacity: 0.92,
            filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.45))',
          }}
        >
          <NodeGlyph slug={dragSlug} size={GHOST_SIZE} borderColor={BORDER.orange} />
        </div>
      )}
      <svg
        width="20"
        height="24"
        viewBox="0 0 24 28"
        fill="none"
        style={{ position: 'relative', zIndex: 2, filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.55))' }}
      >
        <path
          d="M5 3L5 21L9.5 16.5L13 23L16 21.5L12.5 15L19 14.5L5 3Z"
          fill="white"
          stroke="#111"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}

function cubicAt(
  t: number,
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number },
) {
  const u = 1 - t
  return {
    x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
    y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
  }
}

function cubicTangent(
  t: number,
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number },
) {
  const u = 1 - t
  return {
    x: 3 * u * u * (p1.x - p0.x) + 6 * u * t * (p2.x - p1.x) + 3 * t * t * (p3.x - p2.x),
    y: 3 * u * u * (p1.y - p0.y) + 6 * u * t * (p2.y - p1.y) + 3 * t * t * (p3.y - p2.y),
  }
}

function Edge({
  from, to, progress, color, markerId,
}: {
  from: { x: number; y: number }
  to: { x: number; y: number }
  progress: number
  color: string
  markerId: string
}) {
  if (progress <= 0) return null

  const dx = Math.max(5, Math.abs(to.x - from.x) * 0.42)
  const cp1 = { x: from.x + dx, y: from.y }
  const cp2 = { x: to.x - dx, y: to.y }
  const pathD = `M ${from.x} ${from.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${to.x} ${to.y}`

  const tipT = Math.min(0.98, progress)
  const tip = cubicAt(tipT, from, cp1, cp2, to)
  const tan = cubicTangent(tipT, from, cp1, cp2, to)
  const angle = (Math.atan2(tan.y, tan.x) * 180) / Math.PI

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{ zIndex: 5 }}
    >
      <defs>
        <marker
          id={markerId}
          markerWidth="3"
          markerHeight="3"
          refX="2.4"
          refY="1.5"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L2.6,1.5 L0,3 Z" fill={color} />
        </marker>
      </defs>
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth="0.9"
        strokeLinecap="round"
        pathLength={100}
        strokeDasharray={100}
        strokeDashoffset={100 * (1 - progress)}
        markerEnd={progress >= 0.88 ? `url(#${markerId})` : undefined}
        style={{ transition: 'stroke 0.3s ease' }}
      />
      {progress >= 0.15 && progress < 0.92 && (
        <g transform={`translate(${tip.x}, ${tip.y}) rotate(${angle})`}>
          <path d="M0,-1.5 L2.6,0 L0,1.5 Z" fill={color} />
        </g>
      )}
    </svg>
  )
}

export function BentoCanvasAnimation() {
  const [elapsed, setElapsed] = useState(0)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const t0 = setTimeout(() => setStarted(true), 300)
    return () => clearTimeout(t0)
  }, [])

  useEffect(() => {
    if (!started) return
    let raf: number
    const t0 = performance.now()
    const tick = (now: number) => {
      setElapsed((now - t0) % LOOP_MS)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [started])

  const phase = phaseAt(elapsed)
  const dropped = new Set(STEPS.slice(0, droppedCount(phase)).map((s) => s.id))
  const [c1, c2, c3] = connectProgress(phase, elapsed)
  const runIdx = runningIndex(phase, elapsed)
  const showSuccess = phase === 'success'
  const dragIdx = dragIndex(phase)
  const dragSlug = dragIdx !== null ? STEPS[dragIdx]?.slug ?? null : null
  const cursor = cursorPos(elapsed, phase)

  return (
    <div
      className="relative mt-2 h-[210px] w-full overflow-hidden rounded-xl border"
      style={{ background: '#08080c', borderColor: 'rgba(255,255,255,0.06)' }}
    >
      <div
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)',
          backgroundSize: '18px 18px',
        }}
      />

      {/* Canvas pleine largeur */}
      <div className="absolute inset-0">
        <Edge from={edgePort('n1', 'out')} to={edgePort('n2', 'in')} progress={c1} color={edgeColor(c1, phase, 0, runIdx)} markerId="bento-arr-1" />
        <Edge from={edgePort('n2', 'out')} to={edgePort('n3', 'in')} progress={c2} color={edgeColor(c2, phase, 1, runIdx)} markerId="bento-arr-2" />
        <Edge from={edgePort('n3', 'out')} to={edgePort('n4', 'in')} progress={c3} color={edgeColor(c3, phase, 2, runIdx)} markerId="bento-arr-3" />

        {STEPS.map((s, i) => {
          if (!dropped.has(s.id)) return null
          const pos = NODE_POS[s.id as NodeKey]
          return (
            <div
              key={s.id}
              className="absolute z-10 bento-node-enter"
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                transform: `translate(-50%, calc(-50% + ${ICON_ANCHOR_OFFSET_PX}px))`,
              }}
            >
              <NodeGlyph
                slug={s.slug}
                label={s.label}
                size={NODE_SIZE}
                borderColor={nodeBorder(i, phase, runIdx)}
              />
            </div>
          )
        })}

        <div
          className="absolute z-20 flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[10px] font-semibold text-white"
          style={{
            left: '50%',
            bottom: '8px',
            transform: `translateX(-50%) scale(${phase === 'click-run' ? 0.93 : 1})`,
            background: '#ff6d35',
            boxShadow: phase === 'click-run'
              ? '0 2px 8px rgba(255,109,53,0.55)'
              : '0 2px 12px rgba(255,109,53,0.3)',
            transition: 'transform 0.1s ease',
          }}
        >
          <Play className="h-3 w-3 fill-white" />
          Exécuter
        </div>
      </div>

      <div
        className="absolute bottom-2 right-2 flex items-center gap-1.5 rounded-full border px-2 py-1 transition-all duration-500 z-30"
        style={{
          borderColor: 'rgba(16,185,129,0.25)',
          background: 'rgba(16,185,129,0.1)',
          opacity: showSuccess ? 1 : 0,
          transform: showSuccess ? 'translateY(0)' : 'translateY(6px)',
        }}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" style={{ animation: 'pulse-dot 2s infinite' }} />
        <span className="text-[9px] font-mono text-emerald-400">12 anomalies · 1,2 s</span>
      </div>

      {started && (
        <CursorWithDrag
          x={cursor.x}
          y={cursor.y}
          down={cursor.down}
          dragSlug={dragSlug}
        />
      )}
    </div>
  )
}
