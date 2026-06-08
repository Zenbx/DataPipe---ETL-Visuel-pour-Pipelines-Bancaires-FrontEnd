import type { TplEdge, TplNode } from '@/components/templates/TemplateGraphPreview'
import type { FlowEdge, FlowNode, Pipeline } from '@/types'

/** Graphe « vitrine » : labels et types seulement, pas de config métier. */
export function sanitizePipelineForPreview(pipeline: Pipeline): {
  nodes: TplNode[]
  edges: TplEdge[]
} {
  const nodes: TplNode[] = (pipeline.nodes ?? []).map((n) => flowNodeToPreview(n))
  const edges: TplEdge[] = (pipeline.edges ?? []).map((e) => ({
    source: String(e.source),
    target: String(e.target),
  }))
  return { nodes, edges }
}

function flowNodeToPreview(n: FlowNode): TplNode {
  const data = n.data ?? {}
  return {
    id: n.id,
    slug: String(data.type_slug ?? n.type ?? 'csv_reader'),
    label: String(data.label ?? n.type ?? 'Nœud'),
    position: n.position,
  }
}
