import { ApiError } from '@/lib2'

function apiMessage(body: unknown): string | undefined {
  if (!body || typeof body !== 'object') return undefined
  const b = body as Record<string, unknown>
  if (typeof b.error === 'string') return b.error
  if (typeof b.message === 'string') return b.message
  return undefined
}

function isNetworkError(err: unknown): boolean {
  if (!(err instanceof Error)) return false
  const m = err.message.toLowerCase()
  return m.includes('failed to fetch') || m.includes('network') || m.includes('load failed')
}

function mapValidationMessage(msg: string): string | undefined {
  const lower = msg.toLowerCase()
  if (lower.includes('password') && lower.includes('8')) {
    return 'Le mot de passe doit contenir au moins 8 caractères.'
  }
  if (lower.includes('missing required field: email')) {
    return "L'adresse email est obligatoire."
  }
  if (lower.includes('missing required field: password')) {
    return 'Le mot de passe est obligatoire.'
  }
  if (lower.includes('missing required field: name')) {
    return 'Le nom complet est obligatoire.'
  }
  return undefined
}

/** Message utilisateur pour l'échec de connexion */
export function formatLoginError(err: unknown): string {
  if (isNetworkError(err)) {
    return 'Impossible de contacter le serveur. Vérifiez que le backend est démarré (port 5001).'
  }

  if (err instanceof ApiError) {
    const raw = apiMessage(err.body)

    if (err.status === 401 || raw?.toLowerCase().includes('invalid credentials')) {
      return 'Email ou mot de passe incorrect. Vérifiez vos identifiants, ou créez un compte si vous n’en avez pas encore.'
    }
    if (err.status === 400) {
      return mapValidationMessage(raw ?? '') ?? raw ?? 'Requête invalide. Vérifiez l’email et le mot de passe.'
    }
    if (err.status === 429) {
      return 'Trop de tentatives de connexion. Patientez quelques minutes avant de réessayer.'
    }
    if (err.status >= 500) {
      return 'Erreur serveur lors de la connexion. Réessayez dans un instant.'
    }
    return raw ?? `Connexion impossible (erreur ${err.status}).`
  }

  return 'Connexion impossible. Réessayez.'
}

/** Message utilisateur pour l'échec d'inscription */
export function formatRegisterError(
  err: unknown,
  context?: { orgName?: string },
): string {
  if (isNetworkError(err)) {
    return 'Impossible de contacter le serveur. Vérifiez que le backend est démarré (port 5001).'
  }

  if (err instanceof ApiError) {
    const raw = apiMessage(err.body)
    const rawLower = raw?.toLowerCase() ?? ''
    const bodyText = typeof err.body === 'string' ? err.body : JSON.stringify(err.body ?? '')

    if (err.status === 409 || rawLower.includes('email already registered')) {
      return 'Cette adresse email est déjà utilisée. Connectez-vous avec ce compte ou choisissez une autre adresse.'
    }

    if (err.status === 400) {
      return mapValidationMessage(raw ?? '') ?? raw ?? 'Données invalides. Vérifiez le formulaire.'
    }

    if (err.status >= 500) {
      const orgHint = context?.orgName?.trim()
      if (
        orgHint &&
        (bodyText.includes('orgs.slug') ||
          bodyText.includes('UNIQUE constraint') ||
          bodyText.toLowerCase().includes('slug'))
      ) {
        return `Le nom d’organisation « ${orgHint} » est déjà pris. Choisissez un autre nom (ex. « ${orgHint} Équipe ») ou laissez le champ vide.`
      }
      if (orgHint) {
        return `Erreur serveur à l’inscription. Si vous avez renseigné une organisation, essayez un nom plus unique ou laissez ce champ vide.`
      }
      return 'Erreur serveur à l’inscription. Réessayez dans un instant.'
    }

    return raw ?? `Inscription impossible (erreur ${err.status}).`
  }

  return "Erreur lors de l'inscription. Réessayez."
}
