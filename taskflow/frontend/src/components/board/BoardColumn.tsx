import { useDroppable } from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { Plus, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { TaskCard } from "./TaskCard"
import { BoardColumnWithTasks } from "@/types"
import { useAppStore } from "@/store"

interface BoardColumnProps {
  column: BoardColumnWithTasks
  onEditColumn?: (column: BoardColumnWithTasks) => void
  onDeleteColumn?: (columnId: string) => void
}

export function BoardColumn({
  column,
  onEditColumn,
  onDeleteColumn,
}: BoardColumnProps) {
  const { openCreateTaskModal } = useAppStore()

  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: {
      type: "column",
      column,
    },
  })

  const taskIds = column.tasks.map((task) => task.id)

  return (
    <div
      className={cn(
        "flex flex-col w-80 shrink-0 bg-muted/30 rounded-xl",
        isOver && "ring-2 ring-primary ring-offset-2 ring-offset-background"
      )}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between p-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: column.color }}
          />
          <h3 className="font-medium text-sm">{column.name}</h3>
          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
            {column.tasks.length}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            className="h-6 w-6 opacity-0 group-hover:opacity-100"
            onClick={() => openCreateTaskModal(column.id)}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="h-6 w-6">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEditColumn?.(column)}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit Column
              </DropdownMenuItem>
              {!column.is_default && (
                <DropdownMenuItem
                  onClick={() => onDeleteColumn?.(column.id)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Column
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Tasks */}
      <ScrollArea className="flex-1 min-h-0">
        <div
          ref={setNodeRef}
          className="p-2 space-y-2 min-h-[200px]"
        >
          <SortableContext
            items={taskIds}
            strategy={verticalListSortingStrategy}
          >
            {column.tasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </SortableContext>

          {column.tasks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <p className="text-sm">No tasks</p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={() => openCreateTaskModal(column.id)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add task
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Add Task Footer */}
      {column.tasks.length > 0 && (
        <div className="p-2 border-t border-border/50">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground hover:text-foreground"
            onClick={() => openCreateTaskModal(column.id)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add task
          </Button>
        </div>
      )}
    </div>
  )
}
