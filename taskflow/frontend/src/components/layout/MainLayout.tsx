import { Outlet } from "react-router-dom"
import { Sidebar } from "./Sidebar"
import { Toaster } from "sonner"
import { CreateTaskModal } from "@/components/board/CreateTaskModal"
import { TaskDetailModal } from "@/components/task/TaskDetailModal"

export function MainLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <Outlet />
      </main>
      
      {/* Global Modals */}
      <CreateTaskModal />
      <TaskDetailModal />
      
      {/* Toast Notifications */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            color: "hsl(var(--card-foreground))",
          },
        }}
      />
    </div>
  )
}
