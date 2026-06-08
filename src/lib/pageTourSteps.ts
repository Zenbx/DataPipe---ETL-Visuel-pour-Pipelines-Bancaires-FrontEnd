export interface TourStep {
  title: string
  body: string
}

export const PAGE_TOUR_STEPS: Record<string, TourStep[]> = {
  dashboard: [
    {
      title: 'Bienvenue sur le tableau de bord',
      body: 'Ici vous voyez l’activité de votre workspace : pipelines actifs, exécutions et indicateurs.',
    },
    {
      title: 'Checklist de démarrage',
      body: 'Suivez les étapes ci-dessous pour importer un fichier, créer un pipeline et lancer votre première exécution.',
    },
    {
      title: 'Assistant IA',
      body: 'Le bouton orange en bas à droite peut créer et exécuter des pipelines en langage naturel.',
    },
  ],
  pipelines: [
    {
      title: 'Vos pipelines',
      body: 'Chaque carte représente un flux de données. Cliquez pour ouvrir l’éditeur visuel.',
    },
    {
      title: 'Créer un pipeline',
      body: 'Utilisez « Nouveau pipeline » ou partez d’un template pour gagner du temps.',
    },
    {
      title: 'Menu d’actions',
      body: 'Le menu ⋯ permet de dupliquer, exporter, archiver ou publier sur la marketplace.',
    },
  ],
  files: [
    {
      title: 'Importer des données',
      body: 'Téléversez CSV ou JSON ici. Ces fichiers alimentent les nœuds sources de vos pipelines.',
    },
  ],
  templates: [
    {
      title: 'Templates prêts à l’emploi',
      body: 'Le template bancaire inclut masquage RGPD et détection d’anomalies — idéal pour une première démo.',
    },
  ],
  runs: [
    {
      title: 'Historique des exécutions',
      body: 'Chaque ligne est un run. Cliquez pour voir les logs et la sortie de chaque nœud.',
    },
  ],
  'api-keys': [
    {
      title: 'Clés API',
      body: 'Créez des clés avec des scopes limités pour vos scripts et jobs CI/CD.',
    },
  ],
  marketplace: [
    {
      title: 'Marketplace',
      body: 'Découvrez des pipelines partagés. Publiez les vôtres depuis la liste Pipelines.',
    },
  ],
}
