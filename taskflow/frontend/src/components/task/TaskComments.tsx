import { useState } from "react"
import { toast } from "sonner"
import { Send, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { UserAvatar } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SimpleEditor } from "@/components/common/RichTextEditor"
import {
  useComments,
  useCreateComment,
  useDeleteComment,
} from "@/hooks/useComments"
import { useRealtimeComments } from "@/hooks/useRealtimeSubscription"
import { useAuth } from "@/hooks/useAuth"
import { formatRelativeDate, textToTiptap, tiptapToText } from "@/lib/utils"
import { Comment } from "@/types"

interface TaskCommentsProps {
  taskId: string
}

export function TaskComments({ taskId }: TaskCommentsProps) {
  const { user } = useAuth()
  const { data: comments, isLoading } = useComments(taskId)
  const createComment = useCreateComment()
  const deleteComment = useDeleteComment()

  // Enable realtime updates
  useRealtimeComments(taskId)

  const [newComment, setNewComment] = useState("")

  const handleSubmit = async () => {
    if (!newComment.trim()) return

    try {
      await createComment.mutateAsync({
        task_id: taskId,
        content: textToTiptap(newComment.trim()),
      })
      setNewComment("")
    } catch (error) {
      toast.error("Failed to add comment")
    }
  }

  const handleDelete = async (commentId: string) => {
    if (!confirm("Delete this comment?")) return

    try {
      await deleteComment.mutateAsync({
        commentId,
        taskId,
      })
      toast.success("Comment deleted")
    } catch (error) {
      toast.error("Failed to delete comment")
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="h-8 w-8 rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-24 bg-muted rounded" />
              <div className="h-12 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Comment List */}
      {comments?.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          currentUserId={user?.id}
          onDelete={handleDelete}
        />
      ))}

      {comments?.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No comments yet. Be the first to comment!
        </p>
      )}

      {/* New Comment */}
      <div className="flex gap-3 pt-4 border-t">
        <UserAvatar user={user} size="sm" />
        <div className="flex-1">
          <SimpleEditor
            value={newComment}
            onChange={setNewComment}
            placeholder="Write a comment... (Ctrl+Enter to send)"
            onSubmit={handleSubmit}
          />
          <div className="flex justify-end mt-2">
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!newComment.trim() || createComment.isPending}
              loading={createComment.isPending}
            >
              <Send className="h-4 w-4 mr-1" />
              Comment
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

interface CommentItemProps {
  comment: Comment
  currentUserId?: string
  onDelete: (commentId: string) => void
}

function CommentItem({ comment, currentUserId, onDelete }: CommentItemProps) {
  const isAuthor = currentUserId === comment.author_id

  return (
    <div className="flex gap-3 group">
      <UserAvatar user={comment.author || null} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">
            {comment.author?.full_name || comment.author?.username || "Unknown"}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatRelativeDate(comment.created_at)}
          </span>
          {comment.is_edited && (
            <span className="text-xs text-muted-foreground">(edited)</span>
          )}

          {isAuthor && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 ml-auto"
                >
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(comment.id)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <div className="mt-1 text-sm text-foreground">
          {tiptapToText(comment.content)}
        </div>

        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3 pl-4 border-l-2 border-border space-y-3">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                currentUserId={currentUserId}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
