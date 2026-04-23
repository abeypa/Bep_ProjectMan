import { useState, useEffect } from "react"
import { toast } from "sonner"
import {
  X,
  Calendar,
  User,
  Flag,
  Tag,
  MessageSquare,
  Paperclip,
  MoreHorizontal,
  Trash2,
  Copy,
  ExternalLink,
  CheckSquare,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { UserAvatar } from "@/components/ui/avatar"
import { Badge, Separator } from "@/components/ui/components"
import { RichTextEditor } from "@/components/common/RichTextEditor"
import { TaskComments } from "@/components/task/TaskComments"
import { useAppStore } from "@/store"
import { useTask, useUpdateTask, useDeleteTask } from "@/hooks/useTasks"
import { useBoardColumns, useLabels } from "@/hooks/useProjects"
import { useWorkspaceMembers } from "@/hooks/useWorkspace"
import { useRealtimeTask } from "@/hooks/useRealtimeSubscription"
import { TASK_PRIORITIES } from "@/lib/constants"
import { cn, formatDate, formatRelativeDate, getPriorityLabel } from "@/lib/utils"
import { TaskPriority, TiptapContent } from "@/types"

export function TaskDetailModal() {
  const {
    selectedTaskId,
    setSelectedTaskId,
    currentProject,
    currentWorkspace,
  } = useAppStore()

  const { data: task, isLoading } = useTask(selectedTaskId || undefined)
  const { data: columns } = useBoardColumns(currentProject?.id)
  const { data: labels } = useLabels(currentProject?.id)
  const { data: members } = useWorkspaceMembers(currentWorkspace?.id)

  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()

  // Enable realtime updates
  useRealtimeTask(selectedTaskId || undefined)

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState<TiptapContent | null>(null)
  const [isEditingTitle, setIsEditingTitle] = useState(false)

  // Sync state with task data
  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description)
    }
  }, [task])

  const handleClose = () => {
    setSelectedTaskId(null)
    setIsEditingTitle(false)
  }

  const handleTitleSave = async () => {
    if (!task || !title.trim()) return

    setIsEditingTitle(false)

    if (title === task.title) return

    try {
      await updateTask.mutateAsync({
        id: task.id,
        title: title.trim(),
      })
    } catch (error) {
      toast.error("Failed to update title")
      setTitle(task.title)
    }
  }

  const handleDescriptionSave = async (content: TiptapContent) => {
    if (!task) return

    try {
      await updateTask.mutateAsync({
        id: task.id,
        description: content,
      })
    } catch (error) {
      toast.error("Failed to update description")
    }
  }

  const handleFieldUpdate = async (field: string, value: unknown) => {
    if (!task) return

    try {
      await updateTask.mutateAsync({
        id: task.id,
        [field]: value,
      })
    } catch (error) {
      toast.error(`Failed to update ${field}`)
    }
  }

  const handleDelete = async () => {
    if (!task || !currentProject) return

    if (!confirm("Are you sure you want to delete this task?")) return

    try {
      await deleteTask.mutateAsync({
        taskId: task.id,
        projectId: currentProject.id,
      })
      toast.success("Task deleted")
      handleClose()
    } catch (error) {
      toast.error("Failed to delete task")
    }
  }

  const handleCopyLink = () => {
    if (!task) return
    navigator.clipboard.writeText(window.location.href)
    toast.success("Link copied to clipboard")
  }

  if (!selectedTaskId) return null

  return (
    <Dialog open={!!selectedTaskId} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl h-[85vh] p-0 gap-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : task ? (
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div className="flex items-center gap-3">
                <span className="text-sm font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
                  {task.task_key}
                </span>
                {task.labels?.map((label) => (
                  <Badge
                    key={label.id}
                    variant="outline"
                    style={{
                      borderColor: label.color,
                      color: label.color,
                    }}
                  >
                    {label.name}
                  </Badge>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleCopyLink}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy link
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open in new tab
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleDelete}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete task
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="ghost" size="icon-sm" onClick={handleClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="flex flex-1 overflow-hidden">
              {/* Main Content */}
              <ScrollArea className="flex-1 p-6">
                {/* Title */}
                {isEditingTitle ? (
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={handleTitleSave}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleTitleSave()
                      if (e.key === "Escape") {
                        setTitle(task.title)
                        setIsEditingTitle(false)
                      }
                    }}
                    className="text-xl font-semibold mb-4"
                    autoFocus
                  />
                ) : (
                  <h1
                    className="text-xl font-semibold mb-4 cursor-text hover:bg-muted/50 px-2 py-1 -mx-2 rounded"
                    onClick={() => setIsEditingTitle(true)}
                  >
                    {task.title}
                  </h1>
                )}

                {/* Description */}
                <div className="mb-8">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    Description
                  </h3>
                  <RichTextEditor
                    content={description}
                    onSave={handleDescriptionSave}
                    placeholder="Add a description..."
                  />
                </div>

                {/* Subtasks */}
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckSquare className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Subtasks
                    </h3>
                  </div>
                  <Button variant="outline" size="sm">
                    Add subtask
                  </Button>
                </div>

                {/* Comments */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Comments
                    </h3>
                  </div>
                  <TaskComments taskId={task.id} />
                </div>
              </ScrollArea>

              {/* Sidebar */}
              <div className="w-72 border-l p-4 space-y-4 overflow-y-auto">
                {/* Status */}
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Status</Label>
                  <Select
                    value={task.column_id || ""}
                    onValueChange={(v) => handleFieldUpdate("column_id", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {columns?.map((column) => (
                        <SelectItem key={column.id} value={column.id}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: column.color }}
                            />
                            {column.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Assignee */}
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Assignee</Label>
                  <Select
                    value={task.assignee_id || "unassigned"}
                    onValueChange={(v) =>
                      handleFieldUpdate(
                        "assignee_id",
                        v === "unassigned" ? null : v
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          Unassigned
                        </div>
                      </SelectItem>
                      {members?.map((member) => (
                        <SelectItem key={member.user_id} value={member.user_id}>
                          <div className="flex items-center gap-2">
                            <UserAvatar user={member.profile} size="sm" />
                            <span>
                              {member.profile?.full_name ||
                                member.profile?.username}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Priority */}
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Priority</Label>
                  <Select
                    value={task.priority}
                    onValueChange={(v) =>
                      handleFieldUpdate("priority", v as TaskPriority)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TASK_PRIORITIES.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: p.color }}
                            />
                            {p.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Due Date */}
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Due Date</Label>
                  <Input
                    type="date"
                    value={task.due_date || ""}
                    onChange={(e) =>
                      handleFieldUpdate("due_date", e.target.value || null)
                    }
                  />
                </div>

                <Separator />

                {/* Metadata */}
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Created</span>
                    <span>{formatRelativeDate(task.created_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Updated</span>
                    <span>{formatRelativeDate(task.updated_at)}</span>
                  </div>
                  {task.reporter && (
                    <div className="flex justify-between items-center">
                      <span>Reporter</span>
                      <div className="flex items-center gap-1">
                        <UserAvatar user={task.reporter} size="sm" />
                        <span>{task.reporter.username}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Task not found</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
