# DataPipe — Frontend

Interface web de **DataPipe**, une plateforme de pipelines de données no-code/low-code :
construction visuelle de pipelines (façon n8n), exécutions, transformations SQL,
sources de données, planification, webhooks, outils IA, et administration
multi-organisations.

Application **Next.js 16 / React 19 / TypeScript**, branchée sur une API REST
Flask exposée par un client TypeScript auto-généré depuis l'OpenAPI.

---

## Sommaire

- [Stack technique](#stack-technique)
- [Fonctionnalités](#fonctionnalités)
- [Architecture](#architecture)
- [Structure du projet](#structure-du-projet)
- [Démarrage](#démarrage)
- [Configuration (variables d'environnement)](#configuration-variables-denvironnement)
- [Proxy API & CORS](#proxy-api--cors)
- [Scripts](#scripts)
- [Couverture de l'API](#couverture-de-lapi)

---

## Stack technique

| Domaine | Choix |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | React 19, TypeScript 5 |
| Styles | Tailwind CSS v4, composants type shadcn/ui (Radix UI) |
| État global | Zustand |
| Éditeur de pipeline | `@xyflow/react` (React Flow) |
| Données / fetch | Client OpenAPI auto-généré (`src/lib2`) + helpers (`src/lib/api`) |
| Formulaires / validation | react-hook-form, zod |
| Graphiques | Recharts |
| Notifications | sonner |
| Icônes | lucide-react |

---

## Fonctionnalités

### Espace de travail (dashboard)
- **Dashboard** — vue d'ensemble (pipelines, métriques, activité).
- **Pipelines** — liste, création, duplication, archivage/restauration, publication,
  import/export, fusion, versions (snapshot, restauration, diff).
- **Éditeur de pipeline** — canvas React Flow : nœuds, arêtes, validation du graphe,
  configuration par nœud, données de test, épinglage de données (pin-data),
  schéma des types de nœuds, assistant IA, console de logs (live SSE).
- **Exécutions (runs)** — historique agrégé, détail d'un run, logs en streaming,
  sorties de nœuds, retry / annulation / suppression.
- **Fichiers** — upload, aperçu tabulaire, ré-analyse.
- **Sources de données** — connexions (création, test, sync, statut de sync, schéma).
- **SQL / Transform** — éditeur SQL : validation, exécution, preview, chaînage,
  historique, fonctions, templates, génération de données mock.
- **Outils IA** — détection d'anomalies (unitaire + batch), nettoyage, inférence de
  schéma, classification, extraction d'entités, explication de nœud, suggestion de
  pipeline, catalogue de modèles et usage des tokens.
- **Analytics** — vue d'ensemble, timeline des runs, journaux d'audit.
- **Exports** — exports et résultats, téléchargement, retry.
- **Planification** — schedules cron (pause/reprise, déclenchement manuel, runs liés).
- **Webhooks** — sortants (création, test, événements) et entrants (URL, simulation).
- **Notifications & Alertes** — notifications in-app + règles d'alerte (email/slack/sms).
- **Statut / Ops** — santé (health/live/ready), version, métriques ops, mode
  maintenance, catalogue de nœuds communautaires (marketplace).

### Paramètres & administration
- **Profil**, **mot de passe**, **sessions actives** (révocation), **vérification email**,
  **suppression de compte**.
- **Organisation & équipe** — membres (invitation, rôles, retrait), workspaces.
- **Intégrations** — Slack, Jira, PagerDuty, GitHub, Teams, Email.
- **Clés API**.

### Authentification
- Connexion, inscription, mot de passe oublié, réinitialisation (avec token),
  vérification d'email. JWT avec **refresh proactif** du token et restauration de
  session au démarrage.

### Pages publiques
- Landing (`/`), tarifs (`/tarifs`), nœuds (`/noeuds`), docs (`/docs`), démo (`/demo`).

---

## Architecture

```
Navigateur (localhost:3000)
   │  appels same-origin  /api/v1/...
   ▼
Next.js (rewrites)  ──server-to-server──►  Backend Flask (VPS)
   │
   ├─ src/lib2        Client OpenAPI auto-généré (services + modèles)
   ├─ src/lib/api     Helpers métier (mapping lib2 → types app, valeurs par défaut)
   └─ src/store       Zustand (auth, editor, workspace, notifications, ui)
```

- **`src/lib2`** : client généré par `openapi-typescript-codegen` (NE PAS éditer à la
  main). Contient `services/` (un service par domaine d'endpoints) et `models/`.
- **`src/lib/api`** : une couche de helpers par domaine qui enveloppe les services
  `lib2`, normalise les réponses et fournit des valeurs par défaut. **C'est l'API que
  consomment les composants** — les pages n'appellent jamais `lib2` directement.
- **`src/lib/api/client.ts`** : configuration centrale du client (base URL, injection
  du token, refresh proactif basé sur `expires_in`).

---

## Structure du projet

```
src/
├─ app/
│  ├─ (auth)/                 # login, register, forgot/reset-password
│  ├─ (dashboard)/dashboard/  # toutes les pages applicatives
│  ├─ docs, demo, tarifs, …   # pages publiques
│  └─ page.tsx                # landing
├─ components/
│  ├─ editor/                 # éditeur de pipeline (canvas, inspecteur, console, IA)
│  ├─ nodes/                  # rendu des nœuds React Flow + menu contextuel
│  ├─ layout/                 # Sidebar, Navbar, WorkspaceSwitcher
│  └─ ui/                     # primitives (Button, Card, Dialog, Tabs, …)
├─ lib/
│  ├─ api/                    # helpers métier (1 fichier par domaine)
│  ├─ nodeRegistry.ts         # catalogue des types de nœuds
│  └─ utils.ts
├─ lib2/                      # client OpenAPI auto-généré
└─ store/                     # stores Zustand
```

---

## Démarrage

Prérequis : **Node.js 20+**.

```bash
# 1. Installer les dépendances
npm install

# 2. Configurer l'environnement (voir section suivante)
#    .env.local existe déjà avec des valeurs par défaut.

# 3. Lancer le serveur de développement
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

> Les modifications de `next.config.ts` et `.env.local` ne sont prises en compte
> qu'au **(re)démarrage** du serveur de dev.

---

## Configuration (variables d'environnement)

Fichier `.env.local` :

| Variable | Rôle | Défaut |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Base de l'API côté navigateur. **Laisser vide** pour utiliser le proxy same-origin (`/api/v1`) et éviter le CORS. | _(vide)_ |
| `API_PROXY_TARGET` | Cible du proxy Next (URL du backend, server-side uniquement). | `http://datapipe.duckdns.org` |
| `NEXT_PUBLIC_PUBLIC_API_URL` | Base **absolue** publique du backend, utilisée pour afficher des URLs appelables de l'extérieur (ex. webhooks entrants). | `http://datapipe.duckdns.org` |

---

## Proxy API & CORS

Pour éviter les erreurs CORS, le frontend appelle l'API en **same-origin** :
le navigateur tape `http://localhost:3000/api/v1/...`, et Next relaie la requête
côté serveur vers le backend (server-to-server, non soumis au CORS).

`next.config.ts` :

```ts
async rewrites() {
  return [{ source: '/api/:path*', destination: `${API_PROXY_TARGET}/api/:path*` }]
}
```

Et `src/lib/api/client.ts` utilise une base **relative** (`/api/v1`) par défaut.

> Alternative : appeler le VPS en direct en renseignant `NEXT_PUBLIC_API_URL`.
> Le backend doit alors autoriser le CORS de l'origine du front (Flask-CORS).

---

## Scripts

```bash
npm run dev      # serveur de développement (Turbopack)
npm run build    # build de production
npm run start    # démarre le build de production
npm run lint     # ESLint
npx tsc --noEmit # vérification de types
```

---

## Couverture de l'API

Les **177 endpoints** exposés par le backend (17 services OpenAPI) sont consommés
par le frontend :

- **175** via les helpers générés (`src/lib/api/*`),
- **2** via `fetch` direct (refresh du token `/auth/refresh-token`, stream SSE des
  logs `/runs/{id}/logs/stream`) — cas non gérés nativement par le client généré.

Chaque domaine backend possède son helper dédié dans `src/lib/api/` (auth, pipelines,
runs, nodes, files, datasources, transform, scheduling, webhooks, results, analytics,
ai, orgs, workspaces, alerts, integrations, apikeys, notifications, system).
