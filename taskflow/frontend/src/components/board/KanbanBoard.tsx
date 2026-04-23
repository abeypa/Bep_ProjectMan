import { useState, useMemo } from "react"
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { BoardColumn } from "./BoardColumn"
import { TaskCardOverlay } from "./TaskCard"
import { useBoardData, useMoveTask } from "@/hooks/useTasks"
import { useRealtimeBoard } from "@/hooks/useRealtimeSubscription"
import { BoardColumnWithTasks, TaskCard as TaskCardType } from "@/types"
import { calculatePosition } from "@/lib/utils"

interface KanbanBoardProps {
  projectId: string
}

export function KanbanBoard({ projectId }: KanbanBoardProps) {
  const { data: boardData, isLoading, error } = useBoardData(projectId)
  const moveTask = useMoveTask()

  // Enable realtime updates
  useRealtimeBoard(projectId)

  const [activeTask, setActiveTask] = useState<TaskCardType | null>(null)
  const [columns, setColumns] = useState<BoardColumnWithTasks[]>([])

  // Sync columns with server data
  useMemo(() => {
    if (boardData?.columns) {
      setColumns(boardData.columns)
    }
  }, [boardData?.columns])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const activeData = active.data.current

    if (activeData?.type === "task") {
      setActiveTask(activeData.task)
    }
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const activeData = active.data.current
    const overData = over.data.current

    if (activeData?.type !== "task") return

    // Find source and destination columns
    const sourceColumnIndex = columns.findIndex((col) =>
      col.tasks.some((task) => task.id === activeId)
    )
    
    let destColumnIndex: number
    
    if (overData?.type === "column") {
      destColumnIndex = columns.findIndex((col) => col.id === overId)
    } else if (overData?.type === "task") {
      destColumnIndex = columns.findIndex((col) =>
        col.tasks.some((task) => task.id === overId)
      )
    } else {
      return
    }

    if (sourceColumnIndex === -1 || destColumnIndex === -1) return
    if (sourceColumnIndex === destColumnIndex) return

    // Move task to new column (optimistic update)
    setColumns((prevColumns) => {
      const newColumns = [...prevColumns]
      const sourceColumn = { ...newColumns[sourceColumnIndex] }
      const destColumn = { ...newColumns[destColumnIndex] }

      const taskIndex = sourceColumn.tasks.findIndex(
        (task) => task.id === activeId
      )
      const [movedTask] = sourceColumn.tasks.splice(taskIndex, 1)

      if (overData?.type === "task") {
        const overTaskIndex = destColumn.tasks.findIndex(
          (task) => task.id === overId
        )
        destColumn.tasks.splice(overTaskIndex, 0, movedTask)
      } else {
        destColumn.tasks.push(movedTask)
      }

      newColumns[sourceColumnIndex] = { ...sourceColumn, tasks: [...sourceColumn.tasks] }
      newColumns[destColumnIndex] = { ...destColumn, tasks: [...destColumn.tasks] }

      return newColumns
    })
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    setActiveTask(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const activeData = active.data.current
    const overData = over.data.current

    if (activeData?.type !== "task") return

    // Find the column containing the task
    const columnIndex = columns.findIndex((col) =>
      col.tasks.some((task) => task.id === activeId)
    )

    if (columnIndex === -1) return

    const column = columns[columnIndex]
    const taskIndex = column.tasks.findIndex((task) => task.id === activeId)

    // Calculate new position
    let newPosition: number

    if (overData?.type === "column") {
      // Dropped at end of column
      const lastTask = column.tasks[column.tasks.length - 1]
      newPosition = lastTask ? lastTask.position + 1 : 0
    } else {
      // Dropped on another task
      const overIndex = column.tasks.findIndex((task) => task.id === overId)
      
      if (taskIndex < overIndex) {
        const before = column.tasks[overIndex]?.position ?? null
        const after = column.tasks[overIndex + 1]?.position ?? null
        newPosition = calculatePosition(before, after)
      } else {
        const before = column.tasks[overIndex - 1]?.position ?? null
        const after = column.tasks[overIndex]?.position ?? null
        newPosition = calculatePosition(before, after)
      }

      // Reorder within column (optimistic)
      if (taskIndex !== overIndex) {
        setColumns((prevColumns) => {
          const newColumns = [...prevColumns]
          const col = { ...newColumns[columnIndex] }
          col.tasks = arrayMove(col.tasks, taskIndex, overIndex)
          newColumns[columnIndex] = col
          return newColumns
        })
      }
    }

    // Persist to database
    try {
      await moveTask.mutateAsync({
        task_id: activeId,
        column_id: column.id,
        position: newPosition,
      })
    } catch (error) {
      toast.error("Failed to move task")
      // Revert optimistic update by refetching
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading board...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-destructive mb-2">Failed to load board</p>
          <p className="text-sm text-muted-foreground">{(error as Error).message}</p>
        </div>
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <ScrollArea className="flex-1">
        <div className="flex gap-4 p-6 min-h-full">
          {columns.map((column) => (
            <BoardColumn key={column.id} column={column} />
          ))}

          {/* Add Column Button */}
          <div className="w-80 shrink-0">
            <Button
              variant="outline"
              className="w-full h-12 border-dashed"
              onClick={() => {
                // TODO: Open add column modal
                toast.info("Add column feature coming soon!")
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Column
            </Button>
          </div>
        </div>
      </ScrollArea>

      <DragOverlay>
        {activeTask && <TaskCardOverlay task={activeTask} />}
      </DragOverlay>
    </DndContext>
  )
}
