import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export interface Paper {
  id: string
  title: string
  authors: string[]
  year: number
  venue?: string
  tags: string[]
  filePath?: string
}

export interface Citation {
  id: string
  key: string
  title: string
  authors: string[]
  year: number
  venue?: string
  page?: string
  bibtex?: string
  isFavorite: boolean
}

export interface Project {
  id: string
  name: string
  template: 'ieee-latex' | 'word'
  lastOpened: Date
}

export interface Evidence {
  citationId: string
  quote: string
  page?: number
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  citations?: string[]
  timestamp: Date
}

export interface ToastData {
  id: string
  title: string
  description?: string
  type: 'success' | 'error' | 'info'
  duration?: number
}

interface AppState {
  theme: 'light' | 'dark'
  activeTab: 'editor' | 'chat' | 'evidence'
  leftSidebarCollapsed: boolean
  rightInspectorTab: 'citations' | 'outline' | 'related'
  commandPaletteOpen: boolean

  // Library
  papers: Paper[]
  libraryFilters: {
    year?: number
    venue?: string
    tags: string[]
    search: string
  }

  // Projects
  projects: Project[]
  activeProject?: Project

  // Citations
  citations: Citation[]
  selectedCitation?: string

  // Chat
  chatMessages: ChatMessage[]
  isTyping: boolean
  groundedMode: boolean

  // Evidence
  evidence: Evidence[]

  // Outline
  outline: Array<{ level: number; title: string; id: string }>

  // Toasts
  toasts: ToastData[]
}

interface AppActions {
  setTheme: (theme: 'light' | 'dark') => void
  toggleTheme: () => void
  setActiveTab: (tab: AppState['activeTab']) => void
  toggleLeftSidebar: () => void
  setRightInspectorTab: (tab: AppState['rightInspectorTab']) => void
  setCommandPaletteOpen: (open: boolean) => void

  // Library actions
  setPapers: (papers: Paper[]) => void
  setLibraryFilters: (filters: Partial<AppState['libraryFilters']>) => void
  clearLibraryFilters: () => void

  // Project actions
  setProjects: (projects: Project[]) => void
  setActiveProject: (project: Project) => void
  addProject: (project: Project) => void

  // Citation actions
  setCitations: (citations: Citation[]) => void
  setSelectedCitation: (citationId?: string) => void
  toggleCitationFavorite: (citationId: string) => void

  // Chat actions
  addChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void
  setIsTyping: (typing: boolean) => void
  setGroundedMode: (enabled: boolean) => void

  // Evidence actions
  setEvidence: (evidence: Evidence[]) => void

  // Outline actions
  setOutline: (outline: AppState['outline']) => void

  // Toast actions
  addToast: (toast: Omit<ToastData, 'id'>) => void
  removeToast: (id: string) => void
}

export const useAppStore = create<AppState & AppActions>()(
  devtools(
    (set, get) => ({
      // Initial state
      theme: 'light',
      activeTab: 'editor',
      leftSidebarCollapsed: false,
      rightInspectorTab: 'citations',
      commandPaletteOpen: false,

      papers: [],
      libraryFilters: {
        search: '',
        tags: []
      },

      projects: [],
      activeProject: undefined,

      citations: [],
      selectedCitation: undefined,

      chatMessages: [],
      isTyping: false,
      groundedMode: true,

      evidence: [],

      outline: [],

      toasts: [],

      // Actions
      setTheme: (theme) => {
        document.documentElement.setAttribute('data-theme', theme)
        set({ theme })
      },

      toggleTheme: () => {
        const newTheme = get().theme === 'light' ? 'dark' : 'light'
        document.documentElement.setAttribute('data-theme', newTheme)
        set({ theme: newTheme })
      },

      setActiveTab: (activeTab) => set({ activeTab }),

      toggleLeftSidebar: () =>
        set((state) => ({ leftSidebarCollapsed: !state.leftSidebarCollapsed })),

      setRightInspectorTab: (rightInspectorTab) => set({ rightInspectorTab }),

      setCommandPaletteOpen: (commandPaletteOpen) => set({ commandPaletteOpen }),

      // Library actions
      setPapers: (papers) => set({ papers }),

      setLibraryFilters: (filters) =>
        set((state) => ({
          libraryFilters: { ...state.libraryFilters, ...filters }
        })),

      clearLibraryFilters: () =>
        set({ libraryFilters: { search: '', tags: [] } }),

      // Project actions
      setProjects: (projects) => set({ projects }),

      setActiveProject: (activeProject) => set({ activeProject }),

      addProject: (project) =>
        set((state) => ({
          projects: [...state.projects, project],
          activeProject: project
        })),

      // Citation actions
      setCitations: (citations) => set({ citations }),

      setSelectedCitation: (selectedCitation) => set({ selectedCitation }),

      toggleCitationFavorite: (citationId) =>
        set((state) => ({
          citations: state.citations.map(citation =>
            citation.id === citationId
              ? { ...citation, isFavorite: !citation.isFavorite }
              : citation
          )
        })),

      // Chat actions
      addChatMessage: (message) =>
        set((state) => ({
          chatMessages: [
            ...state.chatMessages,
            {
              ...message,
              id: Math.random().toString(36).substring(7),
              timestamp: new Date()
            }
          ]
        })),

      setIsTyping: (isTyping) => set({ isTyping }),

      setGroundedMode: (groundedMode) => set({ groundedMode }),

      // Evidence actions
      setEvidence: (evidence) => set({ evidence }),

      // Outline actions
      setOutline: (outline) => set({ outline }),

      // Toast actions
      addToast: (toast) =>
        set((state) => ({
          toasts: [
            ...state.toasts,
            {
              ...toast,
              id: Math.random().toString(36).substring(7)
            }
          ]
        })),

      removeToast: (id) =>
        set((state) => ({
          toasts: state.toasts.filter(toast => toast.id !== id)
        }))
    }),
    { name: 'research-copilot-store' }
  )
)