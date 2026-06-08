export interface PageHelpContent {
  title: string
  summary: string
  steps: string[]
  tips: string[]
  related?: { label: string; href: string }[]
}

export const PAGE_HELP: Record<string, PageHelpContent> = {
  dashboard: {
    title: 'Tableau de bord',
    summary: 'Vue d’ensemble de votre workspace : pipelines actifs, exécutions récentes et indicateurs clés.',
    steps: [
      'Consultez les KPI en haut (pipelines, runs, taux de succès).',
      'Accédez rapidement à vos pipelines récents.',
      'Suivez la checklist de démarrage pour prendre en main l’app.',
    ],
    tips: [
      'L’assistant IA (bouton en bas à droite) peut créer et exécuter des pipelines pour vous.',
      'Changez de workspace via le sélecteur en haut à gauche.',
    ],
    related: [
      { label: 'Créer un pipeline', href: '/dashboard/pipelines' },
      { label: 'Voir les templates', href: '/dashboard/templates' },
    ],
  },
  pipelines: {
    title: 'Pipelines',
    summary: 'Créez et gérez vos flux de données visuels : glisser-déposer des nœuds, connecter, exécuter.',
    steps: [
      'Cliquez sur « Nouveau pipeline » ou partez d’un template.',
      'Ouvrez l’éditeur : ajoutez des nœuds depuis la palette gauche.',
      'Reliez les nœuds, configurez chaque étape, puis « Exécuter ».',
    ],
    tips: [
      'Menu ⋯ sur un pipeline : dupliquer, exporter, publier sur la marketplace.',
      'Les versions permettent de revenir en arrière après modification.',
    ],
    related: [
      { label: 'Templates', href: '/dashboard/templates' },
      { label: 'Exécutions', href: '/dashboard/runs' },
    ],
  },
  runs: {
    title: 'Exécutions',
    summary: 'Historique de toutes les exécutions de pipelines : statut, durée, logs et sorties par nœud.',
    steps: [
      'Filtrez par statut (succès, échec, en cours).',
      'Cliquez sur une exécution pour voir le détail et les logs.',
      'Relancez ou annulez un run depuis le menu d’actions.',
    ],
    tips: [
      'Un run en échec ? Ouvrez les logs du nœud rouge pour identifier l’erreur.',
      'Planifiez des exécutions automatiques depuis Planification.',
    ],
    related: [{ label: 'Planification', href: '/dashboard/scheduling' }],
  },
  files: {
    title: 'Fichiers',
    summary: 'Téléversez CSV, JSON et autres fichiers utilisés comme entrée dans vos pipelines.',
    steps: [
      'Glissez un fichier ou cliquez pour importer.',
      'Prévisualisez le contenu avant de l’utiliser dans un nœud « CSV Reader ».',
      'Référencez le fichier dans la config du nœud source.',
    ],
    tips: [
      'Un fichier est lié au workspace actif.',
      'Supprimez les fichiers obsolètes pour libérer de l’espace.',
    ],
    related: [{ label: 'Pipelines', href: '/dashboard/pipelines' }],
  },
  datasources: {
    title: 'Sources de données',
    summary: 'Connectez bases SQL, APIs et autres sources pour alimenter vos pipelines.',
    steps: [
      'Ajoutez une source (PostgreSQL, SQLite, HTTP…).',
      'Testez la connexion avant de sauvegarder.',
      'Utilisez-la dans un nœud « SQL Query » ou « HTTP Request ».',
    ],
    tips: ['Le schéma peut être exploré après connexion réussie.'],
    related: [{ label: 'Transform', href: '/dashboard/transform' }],
  },
  transform: {
    title: 'Transform',
    summary: 'Testez des transformations SQL et des requêtes sur vos données sans créer de pipeline complet.',
    steps: [
      'Collez ou chargez un échantillon de données.',
      'Écrivez une requête SQL ou utilisez les outils de transformation.',
      'Validez le résultat avant de l’intégrer dans un pipeline.',
    ],
    tips: ['Idéal pour prototyper avant l’éditeur visuel.'],
    related: [{ label: 'Outils IA', href: '/dashboard/ai-tools' }],
  },
  'ai-tools': {
    title: 'Outils IA',
    summary: 'Détection d’anomalies, nettoyage, classification et explication de nœuds via l’IA.',
    steps: [
      'Choisissez un onglet (Anomalies, Nettoyage, Schéma…).',
      'Collez des données JSON d’exemple ou les vôtres.',
      'Lancez l’analyse et copiez le résultat dans votre pipeline.',
    ],
    tips: [
      'L’assistant global (coin bas-droit) peut aussi agir directement sur vos pipelines.',
    ],
    related: [{ label: 'Pipelines', href: '/dashboard/pipelines' }],
  },
  analytics: {
    title: 'Analytics',
    summary: 'Métriques d’usage du workspace : runs, pipelines actifs, tendances dans le temps.',
    steps: [
      'Consultez les cartes KPI en haut.',
      'Analysez la courbe d’activité sur la période choisie.',
      'Identifiez les pipelines les plus exécutés.',
    ],
    tips: ['Les données sont agrégées depuis vos exécutions réelles.'],
    related: [{ label: 'Exécutions', href: '/dashboard/runs' }],
  },
  marketplace: {
    title: 'Marketplace',
    summary: 'Découvrez, publiez et achetez des pipelines partagés par la communauté (démo locale).',
    steps: [
      'Onglet Découvrir : parcourez les annonces.',
      'Mes annonces : pipelines que vous avez publiés.',
      'Depuis Pipelines → ⋯ → Publier sur la marketplace.',
    ],
    tips: ['La démo stocke les annonces en local (localStorage).'],
    related: [{ label: 'Mes pipelines', href: '/dashboard/pipelines' }],
  },
  notifications: {
    title: 'Notifications',
    summary: 'Alertes sur les exécutions, erreurs et événements de votre workspace.',
    steps: [
      'Consultez les notifications non lues.',
      'Marquez comme lu ou tout effacer.',
      'Configurez les canaux dans Webhooks / Intégrations.',
    ],
    tips: ['La cloche en haut à droite affiche le compteur non lu.'],
  },
  exports: {
    title: 'Exports',
    summary: 'Récupérez les résultats d’exécution exportés (CSV, JSON) depuis vos pipelines.',
    steps: [
      'Listez les exports disponibles par pipeline.',
      'Téléchargez ou prévisualisez le fichier.',
      'Les exports sont générés par les nœuds « File Export ».',
    ],
    tips: ['Vérifiez que le pipeline a bien été exécuté avec succès.'],
  },
  templates: {
    title: 'Templates',
    summary: 'Modèles prêts à l’emploi (banque, conformité…) pour démarrer en un clic.',
    steps: [
      'Parcourez le catalogue de templates.',
      'Ouvrez un aperçu du graphe.',
      '« Utiliser » crée un pipeline dans votre workspace.',
    ],
    tips: ['Le template bancaire est idéal pour une première démo.'],
    related: [{ label: 'Pipelines', href: '/dashboard/pipelines' }],
  },
  scheduling: {
    title: 'Planification',
    summary: 'Programmez l’exécution automatique de pipelines (cron).',
    steps: [
      'Créez une planification liée à un pipeline.',
      'Définissez l’expression cron (ex. tous les jours à 9h).',
      'Activez ou suspendez selon vos besoins.',
    ],
    tips: ['Format cron : minute heure jour mois jour-semaine.'],
    related: [{ label: 'Exécutions', href: '/dashboard/runs' }],
  },
  webhooks: {
    title: 'Webhooks',
    summary: 'Recevez des notifications HTTP quand un pipeline s’exécute ou échoue.',
    steps: [
      'Ajoutez une URL de webhook.',
      'Choisissez les événements (succès, échec, début…).',
      'Testez avec une requête de ping.',
    ],
    tips: ['Utile pour intégrer Slack, Discord ou votre SI.'],
  },
  status: {
    title: 'Statut système',
    summary: 'Santé de l’API, métriques et catalogue des types de nœuds disponibles.',
    steps: [
      'Vérifiez que API, Liveness et DB sont verts.',
      'Consultez la version déployée.',
      'Recherchez un type de nœud dans le catalogue.',
    ],
    tips: ['En cas de rouge, vérifiez que le backend tourne sur le port 5001.'],
  },
  settings: {
    title: 'Paramètres',
    summary: 'Profil, mot de passe, vérification email et préférences de compte.',
    steps: [
      'Mettez à jour votre nom et avatar.',
      'Changez votre mot de passe régulièrement.',
      'Vérifiez votre email si ce n’est pas fait.',
    ],
    tips: ['La déconnexion invalide les sessions sur tous les appareils si vous changez le mot de passe.'],
  },
  'api-keys': {
    title: 'Clés API',
    summary: 'Authentifiez scripts et CI/CD avec des clés à permissions limitées (scopes).',
    steps: [
      'Créez une clé avec un nom explicite.',
      'Cochez uniquement les scopes nécessaires.',
      'Copiez la clé immédiatement — elle ne sera plus affichée.',
    ],
    tips: [
      'CI/CD typique : pipelines:read + runs:write.',
      'Révoquez les clés compromises sans attendre.',
    ],
  },
  organisation: {
    title: 'Organisation',
    summary: 'Gérez votre organisation, membres et rôles.',
    steps: [
      'Modifiez le nom de l’organisation.',
      'Invitez des collaborateurs par email.',
      'Attribuez des rôles (owner, admin, editor, viewer).',
    ],
    tips: ['Chaque organisation a ses propres workspaces.'],
  },
  integrations: {
    title: 'Intégrations',
    summary: 'Connecteurs externes : Slack, email, S3, GitHub…',
    steps: [
      'Choisissez une intégration dans la liste.',
      'Configurez les credentials ou OAuth.',
      'Activez pour recevoir des alertes ou exporter des données.',
    ],
    tips: ['Certaines intégrations sont en version bêta.'],
  },
}

export type PageHelpKey = keyof typeof PAGE_HELP

export function getPageHelp(key: string): PageHelpContent | undefined {
  return PAGE_HELP[key]
}

/** Déduit la clé d’aide depuis le pathname */
export function helpKeyFromPath(pathname: string): string | null {
  if (!pathname.startsWith('/dashboard')) return null
  if (pathname === '/dashboard') return 'dashboard'
  if (pathname.startsWith('/dashboard/pipelines') && pathname.includes('/editor')) return null
  if (pathname.startsWith('/dashboard/pipelines')) return 'pipelines'
  if (pathname.startsWith('/dashboard/settings/api-keys')) return 'api-keys'
  if (pathname.startsWith('/dashboard/settings/organisation')) return 'organisation'
  if (pathname.startsWith('/dashboard/settings/integrations')) return 'integrations'
  if (pathname.startsWith('/dashboard/settings')) return 'settings'
  if (pathname.startsWith('/dashboard/marketplace')) return 'marketplace'
  if (pathname.startsWith('/dashboard/ai-tools')) return 'ai-tools'
  const segment = pathname.replace('/dashboard/', '').split('/')[0]
  if (segment && segment in PAGE_HELP) return segment
  return null
}
