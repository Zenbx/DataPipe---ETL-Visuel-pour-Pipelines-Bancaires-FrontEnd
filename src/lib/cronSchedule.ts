/** Aide à construire et lire des expressions cron (5 champs : min heure jour mois jour-semaine). */

export type CronMode = 'every_minutes' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'custom'

export type CronBuilderState = {
  mode: CronMode
  everyMinutes: number
  minute: number
  hour: number
  dayOfWeek: number
  dayOfMonth: number
  custom: string
}

export const CRON_MODE_OPTIONS: { value: CronMode; label: string; hint: string }[] = [
  { value: 'every_minutes', label: 'Toutes les X minutes', hint: 'Ex. toutes les 15 min' },
  { value: 'hourly', label: 'Chaque heure', hint: 'À une minute fixe de chaque heure' },
  { value: 'daily', label: 'Chaque jour', hint: 'À une heure précise tous les jours' },
  { value: 'weekly', label: 'Chaque semaine', hint: 'Un jour et une heure fixes' },
  { value: 'monthly', label: 'Chaque mois', hint: 'Un jour du mois et une heure fixes' },
  { value: 'custom', label: 'Personnalisé (avancé)', hint: 'Saisie manuelle des 5 champs cron' },
]

export const WEEKDAYS_FR = [
  { value: 0, label: 'Dimanche' },
  { value: 1, label: 'Lundi' },
  { value: 2, label: 'Mardi' },
  { value: 3, label: 'Mercredi' },
  { value: 4, label: 'Jeudi' },
  { value: 5, label: 'Vendredi' },
  { value: 6, label: 'Samedi' },
]

export const EVERY_MINUTES_OPTIONS = [5, 10, 15, 30, 45]

export const TIMEZONE_OPTIONS = [
  { value: 'UTC', label: 'UTC' },
  { value: 'Europe/Paris', label: 'Europe/Paris (France)' },
  { value: 'Europe/London', label: 'Europe/London' },
  { value: 'America/New_York', label: 'America/New_York' },
  { value: 'Africa/Douala', label: 'Africa/Douala' },
]

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

export function cronFromBuilder(state: CronBuilderState): string {
  switch (state.mode) {
    case 'every_minutes':
      return `*/${Math.min(59, Math.max(1, state.everyMinutes))} * * * *`
    case 'hourly':
      return `${state.minute} * * * *`
    case 'daily':
      return `${state.minute} ${state.hour} * * *`
    case 'weekly':
      return `${state.minute} ${state.hour} * * ${state.dayOfWeek}`
    case 'monthly':
      return `${state.minute} ${state.hour} ${state.dayOfMonth} * *`
    case 'custom':
      return state.custom.trim()
    default:
      return '0 9 * * *'
  }
}

export function describeCron(cron: string): string {
  const trimmed = cron.trim()
  const parts = trimmed.split(/\s+/)
  if (parts.length !== 5) return `Expression cron : ${trimmed}`

  const [min, hour, dom, month, dow] = parts

  const everyMin = min.match(/^\*\/(\d+)$/)
  if (everyMin && hour === '*' && dom === '*' && month === '*' && dow === '*') {
    return `Toutes les ${everyMin[1]} minutes`
  }

  if (/^\d+$/.test(min) && hour === '*' && dom === '*' && month === '*' && dow === '*') {
    return `À ${pad2(Number(min))} min de chaque heure`
  }

  if (/^\d+$/.test(min) && /^\d+$/.test(hour) && dom === '*' && month === '*' && dow === '*') {
    return `Chaque jour à ${pad2(Number(hour))}:${pad2(Number(min))}`
  }

  if (/^\d+$/.test(min) && /^\d+$/.test(hour) && dom === '*' && month === '*' && /^\d+$/.test(dow)) {
    const day = WEEKDAYS_FR[Number(dow)]?.label ?? `jour ${dow}`
    return `Chaque ${day} à ${pad2(Number(hour))}:${pad2(Number(min))}`
  }

  if (/^\d+$/.test(min) && /^\d+$/.test(hour) && /^\d+$/.test(dom) && month === '*' && dow === '*') {
    return `Le ${dom} de chaque mois à ${pad2(Number(hour))}:${pad2(Number(min))}`
  }

  return `Planification personnalisée (${trimmed})`
}

export function builderFromCron(cron: string): CronBuilderState {
  const base: CronBuilderState = {
    mode: 'daily',
    everyMinutes: 15,
    minute: 0,
    hour: 9,
    dayOfWeek: 1,
    dayOfMonth: 1,
    custom: cron,
  }

  const parts = cron.trim().split(/\s+/)
  if (parts.length !== 5) return { ...base, mode: 'custom', custom: cron }

  const [min, hour, dom, month, dow] = parts

  const everyMin = min.match(/^\*\/(\d+)$/)
  if (everyMin && hour === '*' && dom === '*' && month === '*' && dow === '*') {
    return { ...base, mode: 'every_minutes', everyMinutes: Number(everyMin[1]) }
  }

  if (/^\d+$/.test(min) && hour === '*' && dom === '*' && month === '*' && dow === '*') {
    return { ...base, mode: 'hourly', minute: Number(min) }
  }

  if (/^\d+$/.test(min) && /^\d+$/.test(hour) && dom === '*' && month === '*' && dow === '*') {
    return { ...base, mode: 'daily', minute: Number(min), hour: Number(hour) }
  }

  if (/^\d+$/.test(min) && /^\d+$/.test(hour) && dom === '*' && month === '*' && /^\d+$/.test(dow)) {
    return {
      ...base,
      mode: 'weekly',
      minute: Number(min),
      hour: Number(hour),
      dayOfWeek: Number(dow),
    }
  }

  if (/^\d+$/.test(min) && /^\d+$/.test(hour) && /^\d+$/.test(dom) && month === '*' && dow === '*') {
    return {
      ...base,
      mode: 'monthly',
      minute: Number(min),
      hour: Number(hour),
      dayOfMonth: Number(dom),
    }
  }

  return { ...base, mode: 'custom', custom: cron }
}
