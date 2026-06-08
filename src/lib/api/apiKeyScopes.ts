export interface ApiKeyScopeDefinition {
  id: string
  label: string
  summary: string
  includes?: string
  allows: string[]
  denies: string[]
}

export const API_KEY_SCOPES: ApiKeyScopeDefinition[] = [
  {
    id: 'pipelines:read',
    label: 'Lecture pipelines',
    summary: 'Consultation et export des pipelines, sans modification.',
    allows: [
      'Lister les pipelines (GET /pipelines)',
      'Voir le détail d’un pipeline (GET /pipelines/{id})',
      'Lister et consulter les versions (GET /pipelines/{id}/versions)',
      'Exporter un pipeline en JSON (GET /pipelines/{id}/export)',
      'Comparer deux versions (GET /pipelines/{id}/diff)',
      'Parcourir les templates (GET /pipelines/templates)',
    ],
    denies: [
      'Créer, modifier ou supprimer un pipeline',
      'Dupliquer, archiver, publier ou importer',
      'Restaurer une version ou créer un snapshot',
    ],
  },
  {
    id: 'pipelines:write',
    label: 'Écriture pipelines',
    summary: 'Création et modification des pipelines (inclut la lecture).',
    includes: 'pipelines:read',
    allows: [
      'Tout ce que permet pipelines:read',
      'Créer un pipeline (POST /pipelines)',
      'Modifier un pipeline (PUT, PATCH /pipelines/{id})',
      'Supprimer un pipeline (DELETE /pipelines/{id})',
      'Dupliquer, archiver, restaurer, publier / dépublier',
      'Gérer les versions (snapshot, restore)',
      'Importer, fusionner et instancier un template',
    ],
    denies: [
      'Lancer ou annuler des exécutions',
      'Téléverser des fichiers ou gérer les sources de données',
    ],
  },
  {
    id: 'runs:write',
    label: 'Exécutions',
    summary: 'Déclencher des runs et suivre leur statut (idéal CI/CD).',
    allows: [
      'Lancer un pipeline (POST /pipelines/{id}/run)',
      'Lister les exécutions (GET /pipelines/{id}/runs)',
      'Consulter une exécution (GET /pipelines/{id}/runs/{run_id})',
      'Annuler ou relancer un run (POST …/cancel, …/retry)',
      'Lire les logs et sorties nœuds (GET /runs/{id}/logs, …/output)',
    ],
    denies: [
      'Modifier la définition d’un pipeline',
      'Téléverser ou supprimer des fichiers',
    ],
  },
  {
    id: 'files:write',
    label: 'Fichiers & sources',
    summary: 'Téléversement de fichiers et gestion des sources de données.',
    allows: [
      'Téléverser un fichier (POST /files/upload)',
      'Lister, prévisualiser et analyser des fichiers',
      'Supprimer un fichier (DELETE /files/{id})',
      'Créer et configurer des sources de données (POST /datasources)',
      'Tester la connexion, synchroniser et lire le schéma',
      'Modifier ou supprimer une source (PATCH, DELETE /datasources/{id})',
    ],
    denies: [
      'Créer ou modifier des pipelines',
      'Lancer des exécutions',
    ],
  },
]

export const API_KEY_SCOPE_IDS = API_KEY_SCOPES.map((s) => s.id)

export function getApiKeyScope(id: string): ApiKeyScopeDefinition | undefined {
  return API_KEY_SCOPES.find((s) => s.id === id)
}

export function getApiKeyScopeLabel(id: string): string {
  return getApiKeyScope(id)?.label ?? id
}

/** Scopes implicites lorsqu’un scope « write » est activé */
export function expandApiKeyScopes(selected: string[]): string[] {
  const set = new Set(selected)
  if (set.has('pipelines:write')) set.add('pipelines:read')
  return API_KEY_SCOPE_IDS.filter((id) => set.has(id))
}
