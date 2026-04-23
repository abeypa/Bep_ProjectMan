import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  Calendar,
  MessageSquare,
  CheckSquare,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Minus,
  Flame,
} from "lucide-react"
import { cn, formatDate, isOverdue, isDueSoon, getPriorityColor } from "@/lib/utils"
import { UserAvatar } from "@/components/ui/avatar"
import { TaskCard as TaskCardType, TaskPriority } from "@/types"
import { useAppStore } from "@/store"

interface TaskCardProps {
  task: TaskCardType
  isDragging?: boolean
}

const PriorityIcon = ({ priority }: { priority: TaskPriority }) => {
  switch (priority) {
    case "urgent":
      return <Flame className="h-3.5 w-3.5 text-red-500" />
    case "high":
      return <ArrowUp className="h-3.5 w-3.5 text-orange-500" />
    case "medium":
      return <Minus className="h-3.5 w-3.5 text-yellow-500" />
    case "low":
      return <ArrowDown className="h-3.5 w-3.5 text-green-500" />
    default:
      return null
  }
}

export function TaskCard({ task, isDragging }: TaskCardProps) {
  const { setSelectedTaskId } = useAppStore()

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: "task",
      task,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const handleClick = (e: React.MouseEvent) => {
    // Don't open modal if dragging
    if (isSortableDragging) return
    setSelectedTaskId(task.id)
  }

  const overdue = isOverdue(task.due_date)
  const dueSoon = isDueSoon(task.due_date)

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleClick}
      className={cn(
        "group bg-card border rounded-lg p-3 cursor-grab active:cursor-grabbing",
        "hover:border-primary/50 hover:shadow-md transition-all",
        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background",
        isDragging || isSortableDragging
          ? "opacity-50 shadow-lg ring-2 ring-primary"
          : ""
      )}
    >
      {/* Labels */}
      {task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.labels.map((label) => (
            <span
              key={label.id}
              className="px-2 py-0.5 text-[10px] font-medium rounded-full"
              style={{
                backgroundColor: `${label.color}20`,
                color: label.color,
              }}
            >
              {label.name}
            </span>
          ))}
        </div>
      )}

      {/* Task Key & Title */}
      <div className="space-y-1">
        <span className="text-xs text-muted-foreground font-mono">
          {task.task_key}
        </span>
        <h4 className="text-sm font-medium leading-snug line-clamp-2">
          {task.title}
        </h4>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/50">
        <div className="flex items-center gap-2">
          {/* Priority */}
          {task.priority !== "none" && (
            <div className="flex items-center">
              <PriorityIcon priority={task.priority} />
            </div>
          )}

          {/* Due Date */}
          {task.due_date && (
            <div
              className={cn(
                "flex items-center gap-1 text-xs",
                overdue
                  ? "text-red-500"
                  : dueSoon
                  ? "text-yellow-500"
                  : "text-muted-foreground"
              )}
            >
              {overdue && <AlertCircle className="h-3 w-3" />}
              <Calendar className="h-3 w-3" />
              <span>{formatDate(task.due_date)}</span>
            </div>
          )}

          {/* Subtasks */}
          {task.subtask_count > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <CheckSquare className="h-3 w-3" />
              <span>{task.subtask_count}</span>
            </div>
          )}

          {/* Comments */}
          {task.comment_count > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MessageSquare className="h-3 w-3" />
              <span>{task.comment_count}</span>
            </div>
          )}
        </div>

        {/* Assignee */}
        {task.assignee && (
          <UserAvatar user={task.assignee} size="sm" />
        )}
      </div>
    </div>
  )
}

// Drag overlay version (simplified, no interactions)
export function TaskCardOverlay({ task }: { task: TaskCardType }) {
  return (
    <div className="bg-card border rounded-lg p-3 shadow-lg ring-2 ring-primary opacity-90 rotate-2">
      {task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.labels.slice(0, 2).map((label) => (
            <span
              key={label.id}
              className="px-2 py-0.5 text-[10px] font-medium rounded-full"
              style={{
                backgroundColor: `${label.color}20`,
                color: label.color,
              }}
            >
              {label.name}
            </span>
          ))}
        </div>
      )}
      <div className="space-y-1">
        <span className="text-xs text-muted-foreground font-mono">
          {task.task_key}
        </span>
        <h4 className="text-sm font-medium line-clamp-2">{task.title}</h4>
      </div>
    </div>
  )
}
