import { create } from "zustand"
import { persist } from "zustand/middleware"
import { Profile, Workspace, Project } from "@/types"

interface AppState {
  // Auth
  user: Profile | null
  setUser: (user: Profile | null) => void

  // Workspaces
  currentWorkspace: Workspace | null
  setCurrentWorkspace: (workspace: Workspace | null) => void

  // Projects
  currentProject: Project | null
  setCurrentProject: (project: Project | null) => void

  // UI State
  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleSidebar: () => void

  // Task modal
  selectedTaskId: string | null
  setSelectedTaskId: (taskId: string | null) => void

  // Create task modal
  createTaskModalOpen: boolean
  createTaskDefaultColumnId: string | null
  openCreateTaskModal: (columnId?: string) => void
  closeCreateTaskModal: () => void

  // Command palette
  commandPaletteOpen: boolean
  setCommandPaletteOpen: (open: boolean) => void

  // Reset state (for logout)
  reset: () => void
}

const initialState = {
  user: null,
  currentWorkspace: null,
  currentProject: null,
  sidebarCollapsed: false,
  selectedTaskId: null,
  createTaskModalOpen: false,
  createTaskDefaultColumnId: null,
  commandPaletteOpen: false,
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      ...initialState,

      setUser: (user) => set({ user }),

      setCurrentWorkspace: (workspace) => set({ currentWorkspace: workspace }),

      setCurrentProject: (project) => set({ currentProject: project }),

      sidebarCollapsed: false,
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      selectedTaskId: null,
      setSelectedTaskId: (taskId) => set({ selectedTaskId: taskId }),

      createTaskModalOpen: false,
      createTaskDefaultColumnId: null,
      openCreateTaskModal: (columnId) =>
        set({
          createTaskModalOpen: true,
          createTaskDefaultColumnId: columnId || null,
        }),
      closeCreateTaskModal: () =>
        set({
          createTaskModalOpen: false,
          createTaskDefaultColumnId: null,
        }),

      commandPaletteOpen: false,
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),

      reset: () => set(initialState),
    }),
    {
      name: "taskflow-store",
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
)
