import { useEffect, useRef } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import { QUERY_KEYS } from "@/lib/constants"
import { Task } from "@/types"

type TableName =
  | "tasks"
  | "comments"
  | "board_columns"
  | "activity_log"
  | "workspace_members"
  | "workspace_invitations"

interface RealtimeConfig {
  table: TableName
  filter?: string
  onInsert?: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void
  onUpdate?: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void
  onDelete?: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void
}

// Generic realtime subscription hook
export function useRealtimeSubscription(
  channelName: string,
  configs: RealtimeConfig[],
  enabled: boolean = true
) {
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!enabled) return

    const channel = supabase.channel(channelName)

    configs.forEach((config) => {
      channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: config.table,
          filter: config.filter,
        },
        (payload) => {
          if (payload.eventType === "INSERT" && config.onInsert) {
            config.onInsert(payload)
          } else if (payload.eventType === "UPDATE" && config.onUpdate) {
            config.onUpdate(payload)
          } else if (payload.eventType === "DELETE" && config.onDelete) {
            config.onDelete(payload)
          }
        }
      )
    })

    channel.subscribe()
    channelRef.current = channel

    return () => {
      channel.unsubscribe()
    }
  }, [channelName, configs, enabled])

  return channelRef.current
}

// Realtime subscription for project board
export function useRealtimeBoard(projectId: string | undefined) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!projectId) return

    const channel = supabase
      .channel(`board:${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          // Invalidate board data on any task change
          queryClient.invalidateQueries({
            queryKey: [QUERY_KEYS.BOARD, projectId],
          })
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "board_columns",
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          // Invalidate board data on column change
          queryClient.invalidateQueries({
            queryKey: [QUERY_KEYS.BOARD, projectId],
          })
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [projectId, queryClient])
}

// Realtime subscription for task comments
export function useRealtimeComments(taskId: string | undefined) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!taskId) return

    const channel = supabase
      .channel(`comments:${taskId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "comments",
          filter: `task_id=eq.${taskId}`,
        },
        () => {
          // Invalidate comments on any change
          queryClient.invalidateQueries({
            queryKey: [QUERY_KEYS.COMMENTS, taskId],
          })
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [taskId, queryClient])
}

// Realtime subscription for task detail
export function useRealtimeTask(taskId: string | undefined) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!taskId) return

    const channel = supabase
      .channel(`task:${taskId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "tasks",
          filter: `id=eq.${taskId}`,
        },
        (payload) => {
          // Update task in cache
          queryClient.setQueryData(
            [QUERY_KEYS.TASK, taskId],
            (old: Task | undefined) => {
              if (!old) return old
              return { ...old, ...(payload.new as Partial<Task>) }
            }
          )
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "tasks",
          filter: `id=eq.${taskId}`,
        },
        () => {
          // Remove task from cache
          queryClient.removeQueries({
            queryKey: [QUERY_KEYS.TASK, taskId],
          })
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [taskId, queryClient])
}

// Realtime subscription for workspace activity
export function useRealtimeActivity(workspaceId: string | undefined) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!workspaceId) return

    const channel = supabase
      .channel(`activity:${workspaceId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "activity_log",
          filter: `workspace_id=eq.${workspaceId}`,
        },
        () => {
          // Invalidate activity feed
          queryClient.invalidateQueries({
            queryKey: [QUERY_KEYS.ACTIVITY, workspaceId],
          })
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [workspaceId, queryClient])
}

export function useRealtimeWorkspaceMembers(workspaceId: string | undefined) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!workspaceId) return

    const channel = supabase
      .channel(`workspace-members:${workspaceId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "workspace_members",
          filter: `workspace_id=eq.${workspaceId}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: [QUERY_KEYS.WORKSPACE_MEMBERS, workspaceId],
          })
          queryClient.invalidateQueries({
            queryKey: [QUERY_KEYS.WORKSPACES],
          })
          queryClient.invalidateQueries({
            queryKey: [QUERY_KEYS.WORKSPACE_ROLE, workspaceId],
          })
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "workspace_invitations",
          filter: `workspace_id=eq.${workspaceId}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: [QUERY_KEYS.WORKSPACE_INVITATIONS, workspaceId],
          })
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [workspaceId, queryClient])
}
