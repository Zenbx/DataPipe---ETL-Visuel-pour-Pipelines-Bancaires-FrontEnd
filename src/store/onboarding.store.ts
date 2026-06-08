import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ChecklistState {
  uploadFile: boolean
  createPipeline: boolean
  firstRun: boolean
  exploreTemplates: boolean
}

interface OnboardingStore {
  wizardCompleted: boolean
  checklist: ChecklistState
  pageTours: Record<string, boolean>
  completeWizard: () => void
  setChecklistItem: (key: keyof ChecklistState, done?: boolean) => void
  completePageTour: (pageKey: string) => void
  isPageTourDone: (pageKey: string) => boolean
  resetOnboarding: () => void
}

const DEFAULT_CHECKLIST: ChecklistState = {
  uploadFile: false,
  createPipeline: false,
  firstRun: false,
  exploreTemplates: false,
}

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set, get) => ({
      wizardCompleted: false,
      checklist: { ...DEFAULT_CHECKLIST },
      pageTours: {},

      completeWizard: () => set({ wizardCompleted: true }),

      setChecklistItem: (key, done = true) =>
        set((s) => ({
          checklist: { ...s.checklist, [key]: done },
        })),

      completePageTour: (pageKey) =>
        set((s) => ({
          pageTours: { ...s.pageTours, [pageKey]: true },
        })),

      isPageTourDone: (pageKey) => !!get().pageTours[pageKey],

      resetOnboarding: () =>
        set({
          wizardCompleted: false,
          checklist: { ...DEFAULT_CHECKLIST },
          pageTours: {},
        }),
    }),
    { name: 'dp-onboarding' },
  ),
)
