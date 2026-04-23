import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { useAppStore } from "@/store"
import {
  Project,
  BoardColumn,
  TaskLabel,
  CreateProjectInput,
} from "@/types"
import { QUERY_KEYS } from "@/lib/constants"

// Fetch all projects for a workspace
export function useProjects(workspaceId: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEYS.PROJECTS, workspaceId],
    queryFn: async () => {
      if (!workspaceId) return []

      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("workspace_id", workspaceId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })

      if (error) throw error
      return data as Project[]
    },
    enabled: !!workspaceId,
  })
}

// Fetch single project by slug
export function useProject(workspaceId: string | undefined, slug: string | undefined) {
  const setCurrentProject = useAppStore((s) => s.setCurrentProject)

  return useQuery({
    queryKey: [QUERY_KEYS.PROJECT, workspaceId, slug],
    queryFn: async () => {
      if (!workspaceId || !slug) return null

      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("workspace_id", workspaceId)
        .eq("slug", slug)
        .is("deleted_at", null)
        .single()

      if (error) throw error
      setCurrentProject(data as Project)
      return data as Project
    },
    enabled: !!workspaceId && !!slug,
  })
}

// Fetch project by ID
export function useProjectById(projectId: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEYS.PROJECT, projectId],
    queryFn: async () => {
      if (!projectId) return null

      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .is("deleted_at", null)
        .single()

      if (error) throw error
      return data as Project
    },
    enabled: !!projectId,
  })
}

// Fetch board columns for a project
export function useBoardColumns(projectId: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEYS.BOARD, projectId, "columns"],
    queryFn: async () => {
      if (!projectId) return []

      const { data, error } = await supabase
        .from("board_columns")
        .select("*")
        .eq("project_id", projectId)
        .order("position", { ascending: true })

      if (error) throw error
      return data as BoardColumn[]
    },
    enabled: !!projectId,
  })
}

// Fetch labels for a project
export function useLabels(projectId: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEYS.LABELS, projectId],
    queryFn: async () => {
      if (!projectId) return []

      const { data, error } = await supabase
        .from("task_labels")
        .select("*")
        .eq("project_id", projectId)
        .order("name", { ascending: true })

      if (error) throw error
      return data as TaskLabel[]
    },
    enabled: !!projectId,
  })
}

// Create project mutation
export function useCreateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateProjectInput) => {
      const { data, error } = await supabase.rpc("create_project", {
        ws_id: input.workspace_id,
        proj_name: input.name,
        proj_key: input.project_key.toUpperCase(),
        proj_description: input.description,
      })

      if (error) throw error
      return data as Project
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.PROJECTS, variables.workspace_id],
      })
    },
  })
}

// Update project mutation
export function useUpdateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<Project> & { id: string }) => {
      const { data, error } = await supabase
        .from("projects")
        .update(updates)
        .eq("id", id)
        .select()
        .single()

      if (error) throw error
      return data as Project
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.PROJECTS, data.workspace_id],
      })
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.PROJECT, data.workspace_id, data.slug],
      })
    },
  })
}

// Archive project mutation
export function useArchiveProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      projectId,
      workspaceId,
    }: {
      projectId: string
      workspaceId: string
    }) => {
      const { data, error } = await supabase
        .from("projects")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", projectId)
        .select()
        .single()

      if (error) throw error
      return { data, workspaceId }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.PROJECTS, result.workspaceId],
      })
    },
  })
}

// Create board column mutation
export function useCreateColumn() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      projectId,
      name,
      color,
      position,
    }: {
      projectId: string
      name: string
      color?: string
      position?: number
    }) => {
      // Get max position if not provided
      let finalPosition = position
      if (finalPosition === undefined) {
        const { data: columns } = await supabase
          .from("board_columns")
          .select("position")
          .eq("project_id", projectId)
          .order("position", { ascending: false })
          .limit(1)

        finalPosition = columns && columns.length > 0 ? columns[0].position + 1 : 0
      }

      const { data, error } = await supabase
        .from("board_columns")
        .insert({
          project_id: projectId,
          name,
          color: color || "#6366f1",
          position: finalPosition,
        })
        .select()
        .single()

      if (error) throw error
      return { data, projectId }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.BOARD, result.projectId],
      })
    },
  })
}

// Update board column mutation
export function useUpdateColumn() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      projectId,
      ...updates
    }: Partial<BoardColumn> & { id: string; projectId: string }) => {
      const { data, error } = await supabase
        .from("board_columns")
        .update(updates)
        .eq("id", id)
        .select()
        .single()

      if (error) throw error
      return { data, projectId }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.BOARD, result.projectId],
      })
    },
  })
}

// Delete board column mutation
export function useDeleteColumn() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      columnId,
      projectId,
    }: {
      columnId: string
      projectId: string
    }) => {
      const { error } = await supabase
        .from("board_columns")
        .delete()
        .eq("id", columnId)

      if (error) throw error
      return projectId
    },
    onSuccess: (projectId) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.BOARD, projectId],
      })
    },
  })
}

// Create label mutation
export function useCreateLabel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      projectId,
      name,
      color,
      description,
    }: {
      projectId: string
      name: string
      color: string
      description?: string
    }) => {
      const { data, error } = await supabase
        .from("task_labels")
        .insert({
          project_id: projectId,
          name,
          color,
          description,
        })
        .select()
        .single()

      if (error) throw error
      return { data, projectId }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.LABELS, result.projectId],
      })
    },
  })
}

// Update label mutation
export function useUpdateLabel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      projectId,
      ...updates
    }: Partial<TaskLabel> & { id: string; projectId: string }) => {
      const { data, error } = await supabase
        .from("task_labels")
        .update(updates)
        .eq("id", id)
        .select()
        .single()

      if (error) throw error
      return { data, projectId }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.LABELS, result.projectId],
      })
    },
  })
}

// Delete label mutation
export function useDeleteLabel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      labelId,
      projectId,
    }: {
      labelId: string
      projectId: string
    }) => {
      const { error } = await supabase
        .from("task_labels")
        .delete()
        .eq("id", labelId)

      if (error) throw error
      return projectId
    },
    onSuccess: (projectId) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.LABELS, projectId],
      })
    },
  })
}
