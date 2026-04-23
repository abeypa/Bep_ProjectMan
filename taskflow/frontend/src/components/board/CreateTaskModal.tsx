import { useState } from "react"
import { toast } from "sonner"
import { Calendar, User, Flag, Tag, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { UserAvatar } from "@/components/ui/avatar"
import { useAppStore } from "@/store"
import { useCreateTask } from "@/hooks/useTasks"
import { useBoardColumns, useLabels } from "@/hooks/useProjects"
import { useWorkspaceMembers } from "@/hooks/useWorkspace"
import { TASK_PRIORITIES } from "@/lib/constants"
import { TaskPriority } from "@/types"

export function CreateTaskModal() {
  const {
    createTaskModalOpen,
    closeCreateTaskModal,
    createTaskDefaultColumnId,
    currentProject,
    currentWorkspace,
  } = useAppStore()

  const [title, setTitle] = useState("")
  const [columnId, setColumnId] = useState(createTaskDefaultColumnId || "")
  const [assigneeId, setAssigneeId] = useState<string | null>(null)
  const [priority, setPriority] = useState<TaskPriority>("none")
  const [dueDate, setDueDate] = useState("")

  const { data: columns } = useBoardColumns(currentProject?.id)
  const { data: members } = useWorkspaceMembers(currentWorkspace?.id)
  const createTask = useCreateTask()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentProject || !title.trim()) {
      toast.error("Please enter a task title")
      return
    }

    try {
      await createTask.mutateAsync({
        project_id: currentProject.id,
        title: title.trim(),
        column_id: columnId || undefined,
        assignee_id: assigneeId || undefined,
        priority,
        due_date: dueDate || undefined,
      })

      toast.success("Task created successfully")
      handleClose()
    } catch (error) {
      toast.error("Failed to create task")
    }
  }

  const handleClose = () => {
    setTitle("")
    setColumnId("")
    setAssigneeId(null)
    setPriority("none")
    setDueDate("")
    closeCreateTaskModal()
  }

  // Set default column when modal opens
  useState(() => {
    if (createTaskDefaultColumnId) {
      setColumnId(createTaskDefaultColumnId)
    } else if (columns && columns.length > 0) {
      const defaultColumn = columns.find((c) => c.is_default) || columns[0]
      setColumnId(defaultColumn.id)
    }
  })

  return (
    <Dialog open={createTaskModalOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="What needs to be done?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          {/* Column */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={columnId} onValueChange={setColumnId}>
              <SelectTrigger>
                <SelectValue placeholder="Select column" />
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
            <Label>Assignee</Label>
            <Select
              value={assigneeId || "unassigned"}
              onValueChange={(v) => setAssigneeId(v === "unassigned" ? null : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Unassigned" />
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
                        {member.profile?.full_name || member.profile?.username}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Priority */}
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={priority}
                onValueChange={(v) => setPriority(v as TaskPriority)}
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
              <Label>Due Date</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" loading={createTask.isPending}>
              Create Task
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
