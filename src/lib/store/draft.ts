import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Shareholder {
  id: string
  walletAddress: string
  equityPercentage: number
}

export interface CompanyDraft {
  id: string
  ensName: string
  companyName: string
  legalStructure: string
  jurisdiction: string
  isMultipleFounders: boolean
  shareholders: Shareholder[]
  currentStep: number
  totalSteps: number
  registerToDifferentAddress: boolean
  customAddress: string
  createdAt: string
  updatedAt: string
  /** Chain ID the draft was created on */
  chainId: number
}

interface DraftStore {
  draft: CompanyDraft | null
  initializeDraft: (ensName: string, chainId: number) => void
  updateDraft: (draft: Partial<CompanyDraft>) => void

  // Shareholder management
  addShareholder: (walletAddress: string, equityPercentage: number) => void
  removeShareholder: (id: string) => void
  updateShareholder: (id: string, updates: Partial<Shareholder>) => void

  // Navigation
  goToNextStep: () => void
  goToPreviousStep: () => void

  // Founder handling
  setFounderMode: (isMultiple: boolean) => void

  // Address overrides
  setCustomAddress: (address: string) => void
  setRegisterToDifferentAddress: (register: boolean) => void

  // Chain management
  /** Clear draft if chainId doesn't match the draft's chainId */
  clearDraftIfChainMismatch: (chainId: number) => void

  // Cleanup
  resetDraft: () => void
}

const createInitialDraft = (
  ensName: string,
  chainId: number
): CompanyDraft => ({
  id: crypto.randomUUID(),
  ensName,
  companyName: '',
  legalStructure: '',
  jurisdiction: '',
  isMultipleFounders: false,
  shareholders: [],
  currentStep: 0,
  totalSteps: 3,
  registerToDifferentAddress: false,
  customAddress: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  chainId,
})

export const useDraftStore = create<DraftStore>()(
  persist(
    (set, get) => ({
      draft: null,

      initializeDraft: (ensName: string, chainId: number) => {
        const draft = createInitialDraft(ensName, chainId)
        set({ draft })
      },

      updateDraft: (updates) => {
        const currentDraft = get().draft
        if (!currentDraft) return

        set({
          draft: {
            ...currentDraft,
            ...updates,
            updatedAt: new Date().toISOString(),
          },
        })
      },

      addShareholder: (walletAddress, equityPercentage) => {
        const currentDraft = get().draft
        if (!currentDraft) return

        const newShareholder: Shareholder = {
          id: crypto.randomUUID(),
          walletAddress,
          equityPercentage,
        }

        set({
          draft: {
            ...currentDraft,
            shareholders: [...currentDraft.shareholders, newShareholder],
            updatedAt: new Date().toISOString(),
          },
        })
      },

      removeShareholder: (id) => {
        const currentDraft = get().draft
        if (!currentDraft) return

        set({
          draft: {
            ...currentDraft,
            shareholders: currentDraft.shareholders.filter(
              (sh) => sh.id !== id
            ),
            updatedAt: new Date().toISOString(),
          },
        })
      },

      updateShareholder: (id, updates) => {
        const currentDraft = get().draft
        if (!currentDraft) return

        set({
          draft: {
            ...currentDraft,
            shareholders: currentDraft.shareholders.map((sh) =>
              sh.id === id ? { ...sh, ...updates } : sh
            ),
            updatedAt: new Date().toISOString(),
          },
        })
      },

      setFounderMode: (isMultiple) => {
        const currentDraft = get().draft
        if (!currentDraft) return

        if (!isMultiple) {
          const firstShareholder = currentDraft.shareholders[0]
          if (firstShareholder) {
            set({
              draft: {
                ...currentDraft,
                isMultipleFounders: false,
                shareholders: [{ ...firstShareholder, equityPercentage: 100 }],
                updatedAt: new Date().toISOString(),
              },
            })
          } else {
            set({
              draft: {
                ...currentDraft,
                isMultipleFounders: false,
                shareholders: [],
                updatedAt: new Date().toISOString(),
              },
            })
          }
        } else {
          const shareholders = [...currentDraft.shareholders]

          // If only one shareholder, split equity and add second
          if (shareholders.length === 1) {
            shareholders[0].equityPercentage = 50
            shareholders.push({
              id: crypto.randomUUID(),
              walletAddress: '',
              equityPercentage: 50,
            })
          }

          set({
            draft: {
              ...currentDraft,
              isMultipleFounders: true,
              shareholders,
              updatedAt: new Date().toISOString(),
            },
          })
        }
      },

      setCustomAddress: (address) => {
        const current = get().draft
        if (!current) return

        set({
          draft: {
            ...current,
            customAddress: address,
            updatedAt: new Date().toISOString(),
          },
        })
      },

      setRegisterToDifferentAddress: (register) => {
        const current = get().draft
        if (!current) return

        set({
          draft: {
            ...current,
            registerToDifferentAddress: register,
            updatedAt: new Date().toISOString(),
          },
        })
      },

      clearDraftIfChainMismatch: (chainId: number) => {
        const currentDraft = get().draft
        if (!currentDraft) return

        // Clear draft if it was created on a different chain
        if (currentDraft.chainId !== chainId) {
          set({ draft: null })
        }
      },

      goToNextStep: () => {
        const currentDraft = get().draft
        if (!currentDraft) return

        set({
          draft: {
            ...currentDraft,
            currentStep: Math.min(
              currentDraft.currentStep + 1,
              currentDraft.totalSteps - 1
            ),
            updatedAt: new Date().toISOString(),
          },
        })
      },

      goToPreviousStep: () => {
        const currentDraft = get().draft
        if (!currentDraft) return

        set({
          draft: {
            ...currentDraft,
            currentStep: Math.max(currentDraft.currentStep - 1, 0),
            updatedAt: new Date().toISOString(),
          },
        })
      },

      resetDraft: () => set({ draft: null }),
    }),
    {
      name: 'draft-storage',
      partialize: (state) => ({
        draft: state.draft,
      }),
    }
  )
)
