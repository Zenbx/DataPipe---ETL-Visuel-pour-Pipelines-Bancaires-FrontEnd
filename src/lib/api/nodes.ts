import { NodesService, type Node as ApiNode, type Edge as ApiEdge } from '@/lib2'

/** Nœud au format React Flow attendu par l'éditeur. */
export interface FlowNodeShape {
  id: string
  type: string
  position: { x: number; y: number }
  data: { type_slug: string; label?: string; config: Record<string, unknown>; has_pinned_data?: boolean }
}

export interface FlowEdgeShape {
  id: string
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
}

function parseConfig(raw: unknown): Record<string, unknown> {
  if (!raw) return {}
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw) as unknown
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : {}
    } catch {
      return {}
    }
  }
  if (typeof raw === 'object' && !Array.isArray(raw)) return raw as Record<string, unknown>
  return {}
}

export function toFlowNode(n: ApiNode): FlowNodeShape {
  const slug = n.type ?? 'default'
  return {
    id: n.id ?? '',
    type: slug,
    position: { x: n.position?.x ?? 0, y: n.position?.y ?? 0 },
    data: {
      type_slug: slug,
      label: n.label,
      config: parseConfig(n.config),
      has_pinned_data: n.has_pinned_data,
    },
  }
}

// Les nœuds à une seule entrée/sortie utilisent un handle SANS id (défaut React
// Flow). Le backend renvoie parfois les sentinelles 'output'/'input', qui ne
// correspondent à aucun handle réel -> l'edge ne s'affiche pas. On les neutralise.
const _normHandle = (h?: string): string | undefined =>
  h && h !== 'output' && h !== 'input' ? h : undefined

export function toFlowEdge(e: ApiEdge): FlowEdgeShape {
  return {
    id: e.id ?? '',
    source: e.source ?? '',
    target: e.target ?? '',
    sourceHandle: _normHandle(e.sourceHandle),
    targetHandle: _normHandle(e.targetHandle),
  }
}

export const nodesApi = {
  async listNodes(pipelineId: string): Promise<FlowNodeShape[]> {
    const res = await NodesService.getPipelinesNodes(pipelineId)
    return (res.nodes ?? []).map(toFlowNode)
  },

  async addNode(
    pipelineId: string,
    data: { type: string; position: { x: number; y: number }; label?: string; config?: Record<string, unknown> },
  ): Promise<FlowNodeShape> {
    const n = await NodesService.postPipelinesNodes(pipelineId, {
      type: data.type,
      label: data.label,
      position: data.position,
      config: data.config ?? {},
    })
    return toFlowNode(n)
  },

  async updateNode(
    pipelineId: string,
    nodeId: string,
    data: { position?: { x: number; y: number }; config?: Record<string, unknown>; label?: string },
  ): Promise<FlowNodeShape> {
    const n = await NodesService.patchPipelinesNodes(pipelineId, nodeId, {
      position: data.position,
      config: data.config,
      label: data.label,
    })
    return toFlowNode(n)
  },

  /** Persiste les configs locales sur le serveur avant un run. */
  async persistAllConfigs(
    pipelineId: string,
    nodes: Array<{ id: string; data: Record<string, unknown> }>,
  ) {
    await Promise.all(
      nodes.map((n) => {
        const config = (n.data.config as Record<string, unknown> | undefined) ?? {}
        const label = n.data.label as string | undefined
        return nodesApi
          .updateNode(pipelineId, n.id, { config, label })
          .catch(() => undefined)
      }),
    )
  },

  async deleteNode(pipelineId: string, nodeId: string) {
    await NodesService.deletePipelinesNodes(pipelineId, nodeId)
  },

  async listEdges(pipelineId: string): Promise<FlowEdgeShape[]> {
    const res = await NodesService.getPipelinesEdges(pipelineId)
    return (res.edges ?? []).map(toFlowEdge)
  },

  async createEdge(
    pipelineId: string,
    data: { source: string; target: string; source_handle?: string; target_handle?: string },
  ): Promise<FlowEdgeShape> {
    const e = await NodesService.postPipelinesEdges(pipelineId, {
      source: data.source,
      target: data.target,
      sourceHandle: data.source_handle,
      targetHandle: data.target_handle,
    })
    return toFlowEdge(e)
  },

  async deleteEdge(pipelineId: string, edgeId: string) {
    await NodesService.deletePipelinesEdges(pipelineId, edgeId)
  },

  /** Validation du graphe entier (cycles, nœuds manquants). */
  async validateGraph(pipelineId: string) {
    return NodesService.postPipelinesEdgesValidate(pipelineId)
  },

  async getNodeTypes() {
    const res = await NodesService.getNodeTypes()
    return res.node_types ?? []
  },

  /** Détail d'un type de nœud (catalogue). */
  async getNodeType(typeSlug: string) {
    return NodesService.getNodeTypes1(typeSlug)
  },

  /** JSON Schema de la configuration d'un type de nœud. */
  async getNodeTypeSchema(typeSlug: string) {
    return NodesService.getNodeTypesSchema(typeSlug)
  },

  /** Détail (frais) d'un nœud depuis le serveur. */
  async getNode(pipelineId: string, nodeId: string): Promise<FlowNodeShape> {
    return toFlowNode(await NodesService.getPipelinesNodes1(pipelineId, nodeId))
  },

  /** Remplace intégralement un nœud (PUT). */
  async replaceNode(
    pipelineId: string,
    nodeId: string,
    node: { type: string; label?: string; position: { x: number; y: number }; config?: Record<string, unknown> },
  ) {
    await NodesService.putPipelinesNodes(pipelineId, nodeId, {
      id: nodeId,
      type: node.type,
      label: node.label,
      position: node.position,
      config: node.config ?? {},
    })
  },

  /** Crée plusieurs nœuds d'un coup (ex: pipeline généré par IA). */
  async addNodesBulk(
    pipelineId: string,
    nodes: Array<{ type: string; label?: string; position?: { x: number; y: number }; config?: Record<string, unknown> }>,
  ): Promise<FlowNodeShape[]> {
    const res = (await NodesService.postPipelinesNodesBulk(pipelineId, {
      nodes: nodes.map((n) => ({ type: n.type, label: n.label, position: n.position, config: n.config ?? {} })),
    })) as { nodes?: ApiNode[] }
    return (res.nodes ?? []).map(toFlowNode)
  },

  /** Épingle des données de test sur un nœud (feature n8n). */
  async pinData(pipelineId: string, nodeId: string, data: unknown[]) {
    return NodesService.postPipelinesNodesPinData(pipelineId, nodeId, { data: data as unknown[] })
  },

  /** Lit les données épinglées d'un nœud. */
  async getPinnedData(pipelineId: string, nodeId: string) {
    return NodesService.getPipelinesNodesPinnedData(pipelineId, nodeId)
  },

  /** Supprime les données épinglées d'un nœud. */
  async clearPinnedData(pipelineId: string, nodeId: string) {
    return NodesService.deletePipelinesNodesPinnedData(pipelineId, nodeId)
  },

  /** Données de test d'un nœud (pinned ou mock). */
  async getTestData(pipelineId: string, nodeId: string) {
    return NodesService.getPipelinesNodesTestData(pipelineId, nodeId)
  },
}
