/** Champs de formulaire explicites → objet config envoyé à l’API */

export type SimpleConfigField = {
  key: string
  label: string
  type: 'text' | 'number' | 'password' | 'boolean' | 'select'
  placeholder?: string
  optional?: boolean
  default?: string | boolean
  options?: { value: string; label: string }[]
  help?: string
}

export const DATASOURCE_CONFIG_FIELDS: Record<string, SimpleConfigField[]> = {
  postgresql: [
    { key: 'host', label: 'Hôte', type: 'text', placeholder: 'localhost' },
    { key: 'port', label: 'Port', type: 'number', placeholder: '5432', default: '5432' },
    { key: 'database', label: 'Base de données', type: 'text', placeholder: 'app' },
    { key: 'user', label: 'Utilisateur', type: 'text', placeholder: 'postgres' },
    { key: 'password', label: 'Mot de passe', type: 'password', optional: true },
    { key: 'ssl', label: 'Connexion SSL', type: 'boolean', default: false },
  ],
  mysql: [
    { key: 'host', label: 'Hôte', type: 'text', placeholder: 'localhost' },
    { key: 'port', label: 'Port', type: 'number', placeholder: '3306', default: '3306' },
    { key: 'database', label: 'Base de données', type: 'text', placeholder: 'app' },
    { key: 'user', label: 'Utilisateur', type: 'text', placeholder: 'root' },
    { key: 'password', label: 'Mot de passe', type: 'password', optional: true },
  ],
  sqlite: [
    { key: 'path', label: 'Chemin du fichier .db', type: 'text', placeholder: '/data/app.db', help: 'Chemin absolu ou relatif au serveur' },
  ],
  mongodb: [
    { key: 'uri', label: 'URI de connexion', type: 'text', placeholder: 'mongodb://localhost:27017/app' },
    { key: 'database', label: 'Base (optionnel)', type: 'text', optional: true },
  ],
  api: [
    { key: 'base_url', label: 'URL de base', type: 'text', placeholder: 'https://api.exemple.com' },
    {
      key: 'auth_type', label: 'Authentification', type: 'select', default: 'none',
      options: [
        { value: 'none', label: 'Aucune' },
        { value: 'bearer', label: 'Bearer token' },
        { value: 'api_key', label: 'Clé API (header)' },
      ],
    },
    { key: 'api_key', label: 'Token / clé API', type: 'password', optional: true },
  ],
  s3: [
    { key: 'bucket', label: 'Bucket', type: 'text', placeholder: 'mon-bucket' },
    { key: 'region', label: 'Région', type: 'text', placeholder: 'eu-west-1', default: 'eu-west-1' },
    { key: 'access_key', label: 'Access key', type: 'text', optional: true },
    { key: 'secret_key', label: 'Secret key', type: 'password', optional: true },
  ],
}

export const INTEGRATION_CONFIG_FIELDS: Record<string, SimpleConfigField[]> = {
  slack: [
    { key: 'webhook_url', label: 'URL webhook Slack', type: 'text', placeholder: 'https://hooks.slack.com/services/...' },
    { key: 'channel', label: 'Canal (optionnel)', type: 'text', placeholder: '#alertes', optional: true },
  ],
  teams: [
    { key: 'webhook_url', label: 'URL webhook Teams', type: 'text', placeholder: 'https://outlook.office.com/webhook/...' },
  ],
  email: [
    { key: 'smtp_host', label: 'Serveur SMTP', type: 'text', placeholder: 'smtp.exemple.com' },
    { key: 'smtp_port', label: 'Port SMTP', type: 'number', placeholder: '587', default: '587' },
    { key: 'user', label: 'Utilisateur', type: 'text', optional: true },
    { key: 'password', label: 'Mot de passe', type: 'password', optional: true },
    { key: 'from', label: 'Expéditeur', type: 'text', placeholder: 'alertes@exemple.com' },
  ],
  pagerduty: [
    { key: 'integration_key', label: 'Clé d’intégration', type: 'password', placeholder: 'Routing key PagerDuty' },
  ],
  jira: [
    { key: 'base_url', label: 'URL Jira', type: 'text', placeholder: 'https://votre-org.atlassian.net' },
    { key: 'email', label: 'Email compte', type: 'text', placeholder: 'vous@exemple.com' },
    { key: 'api_token', label: 'Token API', type: 'password' },
    { key: 'project_key', label: 'Projet (optionnel)', type: 'text', placeholder: 'OPS', optional: true },
  ],
  github: [
    { key: 'token', label: 'Personal access token', type: 'password' },
    { key: 'owner', label: 'Organisation / user', type: 'text', placeholder: 'mon-org', optional: true },
    { key: 'repo', label: 'Dépôt (optionnel)', type: 'text', placeholder: 'datapipe-alerts', optional: true },
  ],
}

export function defaultConfigValues(fields: SimpleConfigField[]): Record<string, string | boolean> {
  const out: Record<string, string | boolean> = {}
  for (const f of fields) {
    if (f.type === 'boolean') out[f.key] = f.default === true
    else out[f.key] = typeof f.default === 'string' ? f.default : ''
  }
  return out
}

export function buildConfigObject(
  fields: SimpleConfigField[],
  values: Record<string, string | boolean>,
): Record<string, unknown> {
  const config: Record<string, unknown> = {}
  for (const f of fields) {
    const raw = values[f.key]
    if (f.type === 'boolean') {
      if (raw === true) config[f.key] = true
      continue
    }
    const str = String(raw ?? '').trim()
    if (!str && f.optional) continue
    if (!str && !f.optional) continue
    if (f.type === 'number') {
      const n = Number(str)
      if (!Number.isNaN(n)) config[f.key] = n
    } else {
      config[f.key] = str
    }
  }
  return config
}

export function validateConfigFields(
  fields: SimpleConfigField[],
  values: Record<string, string | boolean>,
): string | null {
  for (const f of fields) {
    if (f.optional || f.type === 'boolean') continue
    const str = String(values[f.key] ?? '').trim()
    if (!str) return `Le champ « ${f.label} » est requis.`
  }
  return null
}
