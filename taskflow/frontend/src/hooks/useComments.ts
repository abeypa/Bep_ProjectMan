import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { Comment, CreateCommentInput, Profile, TiptapContent } from "@/types"
import { QUERY_KEYS } from "@/lib/constants"

// Fetch comments for a task
export function useComments(taskId: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEYS.COMMENTS, taskId],
    queryFn: async () => {
      if (!taskId) return []

      const { data, error } = await supabase
        .from("comments")
        .select(`
          *,
          author:profiles(*)
        `)
        .eq("task_id", taskId)
        .is("parent_comment_id", null)
        .order("created_at", { ascending: true })

      if (error) throw error

      // Fetch replies for each comment
      const commentsWithReplies = await Promise.all(
        data.map(async (comment) => {
          const { data: replies } = await supabase
            .from("comments")
            .select(`
              *,
              author:profiles(*)
            `)
            .eq("parent_comment_id", comment.id)
            .order("created_at", { ascending: true })

          return {
            ...comment,
            author: comment.author as Profile,
            replies: (replies || []).map((reply) => ({
              ...reply,
              author: reply.author as Profile,
            })),
          }
        })
      )

      return commentsWithReplies as Comment[]
    },
    enabled: !!taskId,
  })
}

// Create comment mutation
export function useCreateComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateCommentInput) => {
      const { data, error } = await supabase.rpc("add_comment", {
        t_id: input.task_id,
        comment_content: input.content,
        parent_id: input.parent_comment_id,
      })

      if (error) throw error
      return { comment: data as Comment, taskId: input.task_id }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.COMMENTS, result.taskId],
      })
      // Also invalidate task to update comment count
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.TASK, result.taskId],
      })
    },
  })
}

// Update comment mutation
export function useUpdateComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      commentId,
      content,
      taskId,
    }: {
      commentId: string
      content: TiptapContent
      taskId: string
    }) => {
      const { data, error } = await supabase
        .from("comments")
        .update({ content, is_edited: true })
        .eq("id", commentId)
        .select()
        .single()

      if (error) throw error
      return { comment: data as Comment, taskId }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.COMMENTS, result.taskId],
      })
    },
  })
}

// Delete comment mutation
export function useDeleteComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      commentId,
      taskId,
    }: {
      commentId: string
      taskId: string
    }) => {
      const { error } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId)

      if (error) throw error
      return taskId
    },
    onSuccess: (taskId) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.COMMENTS, taskId],
      })
      // Also invalidate task to update comment count
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.TASK, taskId],
      })
    },
  })
}
