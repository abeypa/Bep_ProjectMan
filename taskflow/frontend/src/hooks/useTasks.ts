import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import {
  Task,
  TaskCard,
  BoardData,
  CreateTaskInput,
  UpdateTaskInput,
  MoveTaskInput,
  TaskLabel,
  Profile,
} from "@/types"
import { QUERY_KEYS } from "@/lib/constants"
import { calculatePosition } from "@/lib/utils"

// Fetch board data (columns + tasks)
export function useBoardData(projectId: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEYS.BOARD, projectId],
    queryFn: async () => {
      if (!projectId) return null

      const { data, error } = await supabase.rpc("get_project_board", {
        proj_id: projectId,
      })

      if (error) throw error
      return data as BoardData
    },
    enabled: !!projectId,
  })
}

// Fetch all tasks for a project
export function useTasks(projectId: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEYS.TASKS, projectId],
    queryFn: async () => {
      if (!projectId) return []

      const { data, error } = await supabase
        .from("tasks")
        .select(`
          *,
          assignee:profiles!tasks_assignee_id_fkey(*),
          reporter:profiles!tasks_reporter_id_fkey(*),
          labels:task_label_assignments(
            label:task_labels(*)
          )
        `)
        .eq("project_id", projectId)
        .is("parent_task_id", null)
        .order("position", { ascending: true })

      if (error) throw error
      
      return data.map((task) => ({
        ...task,
        assignee: task.assignee as Profile | null,
        reporter: task.reporter as Profile | null,
        labels: task.labels?.map((la: { label: TaskLabel }) => la.label) || [],
      })) as Task[]
    },
    enabled: !!projectId,
  })
}

// Fetch single task by ID
export function useTask(taskId: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEYS.TASK, taskId],
    queryFn: async () => {
      if (!taskId) return null

      const { data, error } = await supabase
        .from("tasks")
        .select(`
          *,
          assignee:profiles!tasks_assignee_id_fkey(*),
          reporter:profiles!tasks_reporter_id_fkey(*),
          labels:task_label_assignments(
            label:task_labels(*)
          )
        `)
        .eq("id", taskId)
        .single()

      if (error) throw error

      return {
        ...data,
        assignee: data.assignee as Profile | null,
        reporter: data.reporter as Profile | null,
        labels: data.labels?.map((la: { label: TaskLabel }) => la.label) || [],
      } as Task
    },
    enabled: !!taskId,
  })
}

// Fetch task by key (e.g., "PROJ-123")
export function useTaskByKey(projectId: string | undefined, taskKey: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEYS.TASK, projectId, taskKey],
    queryFn: async () => {
      if (!projectId || !taskKey) return null

      const { data, error } = await supabase
        .from("tasks")
        .select(`
          *,
          assignee:profiles!tasks_assignee_id_fkey(*),
          reporter:profiles!tasks_reporter_id_fkey(*),
          labels:task_label_assignments(
            label:task_labels(*)
          )
        `)
        .eq("project_id", projectId)
        .eq("task_key", taskKey)
        .single()

      if (error) throw error

      return {
        ...data,
        assignee: data.assignee as Profile | null,
        reporter: data.reporter as Profile | null,
        labels: data.labels?.map((la: { label: TaskLabel }) => la.label) || [],
      } as Task
    },
    enabled: !!projectId && !!taskKey,
  })
}

// Fetch subtasks for a task
export function useSubtasks(parentTaskId: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEYS.TASKS, "subtasks", parentTaskId],
    queryFn: async () => {
      if (!parentTaskId) return []

      const { data, error } = await supabase
        .from("tasks")
        .select(`
          *,
          assignee:profiles!tasks_assignee_id_fkey(*)
        `)
        .eq("parent_task_id", parentTaskId)
        .order("position", { ascending: true })

      if (error) throw error

      return data.map((task) => ({
        ...task,
        assignee: task.assignee as Profile | null,
      })) as Task[]
    },
    enabled: !!parentTaskId,
  })
}

// Create task mutation
export function useCreateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateTaskInput) => {
      const { data, error } = await supabase.rpc("create_task", {
        proj_id: input.project_id,
        task_title: input.title,
        task_description: input.description,
        task_column_id: input.column_id,
        task_assignee_id: input.assignee_id,
        task_priority: input.priority,
        task_due_date: input.due_date,
        task_parent_id: input.parent_task_id,
      })

      if (error) throw error
      return data as Task
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.BOARD, data.project_id],
      })
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.TASKS, data.project_id],
      })
      if (data.parent_task_id) {
        queryClient.invalidateQueries({
          queryKey: [QUERY_KEYS.TASKS, "subtasks", data.parent_task_id],
        })
      }
    },
  })
}

// Update task mutation
export function useUpdateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateTaskInput) => {
      const { id, ...updates } = input

      const { data, error } = await supabase
        .from("tasks")
        .update(updates)
        .eq("id", id)
        .select()
        .single()

      if (error) throw error
      return data as Task
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.BOARD, data.project_id],
      })
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.TASKS, data.project_id],
      })
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.TASK, data.id],
      })
    },
  })
}

// Move task mutation (optimistic update for drag and drop)
export function useMoveTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: MoveTaskInput) => {
      const { data, error } = await supabase.rpc("move_task", {
        t_id: input.task_id,
        new_column_id: input.column_id,
        new_position: input.position,
      })

      if (error) throw error
      return data as Task
    },
    onMutate: async (input) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: [QUERY_KEYS.BOARD] })

      // Snapshot previous value
      const previousBoard = queryClient.getQueryData<BoardData>([
        QUERY_KEYS.BOARD,
        // Get project ID from task - we need to handle this
      ])

      return { previousBoard }
    },
    onError: (_err, _input, context) => {
      // Rollback on error
      if (context?.previousBoard) {
        // Restore previous board state
      }
    },
    onSettled: (data) => {
      if (data) {
        queryClient.invalidateQueries({
          queryKey: [QUERY_KEYS.BOARD, data.project_id],
        })
      }
    },
  })
}

// Delete task mutation
export function useDeleteTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      taskId,
      projectId,
    }: {
      taskId: string
      projectId: string
    }) => {
      const { error } = await supabase.from("tasks").delete().eq("id", taskId)

      if (error) throw error
      return projectId
    },
    onSuccess: (projectId) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.BOARD, projectId],
      })
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.TASKS, projectId],
      })
    },
  })
}

// Add label to task mutation
export function useAddTaskLabel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      taskId,
      labelId,
      projectId,
    }: {
      taskId: string
      labelId: string
      projectId: string
    }) => {
      const { error } = await supabase
        .from("task_label_assignments")
        .insert({ task_id: taskId, label_id: labelId })

      if (error) throw error
      return { taskId, projectId }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.TASK, result.taskId],
      })
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.BOARD, result.projectId],
      })
    },
  })
}

// Remove label from task mutation
export function useRemoveTaskLabel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      taskId,
      labelId,
      projectId,
    }: {
      taskId: string
      labelId: string
      projectId: string
    }) => {
      const { error } = await supabase
        .from("task_label_assignments")
        .delete()
        .eq("task_id", taskId)
        .eq("label_id", labelId)

      if (error) throw error
      return { taskId, projectId }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.TASK, result.taskId],
      })
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.BOARD, result.projectId],
      })
    },
  })
}

// Helper hook to calculate new position for drag and drop
export function useCalculatePosition(
  tasks: TaskCard[],
  overIndex: number,
  activeId: string
): number {
  const filteredTasks = tasks.filter((t) => t.id !== activeId)

  if (filteredTasks.length === 0) {
    return 0
  }

  if (overIndex === 0) {
    return filteredTasks[0].position - 1
  }

  if (overIndex >= filteredTasks.length) {
    return filteredTasks[filteredTasks.length - 1].position + 1
  }

  const before = filteredTasks[overIndex - 1]?.position ?? null
  const after = filteredTasks[overIndex]?.position ?? null

  return calculatePosition(before, after)
}
