import { useEffect } from "react"
import { useParams } from "react-router-dom"
import { Header } from "@/components/layout/Header"
import { KanbanBoard } from "@/components/board/KanbanBoard"
import { useWorkspace } from "@/hooks/useWorkspace"
import { useProject } from "@/hooks/useProjects"
import { useAppStore } from "@/store"

export function ProjectBoard() {
  const { workspaceSlug, projectSlug } = useParams()
  const { setCurrentProject, setCurrentWorkspace } = useAppStore()

  const { data: workspace } = useWorkspace(workspaceSlug)
  const { data: project, isLoading, error } = useProject(
    workspace?.id,
    projectSlug
  )

  // Set current project in store
  useEffect(() => {
    if (project) {
      setCurrentProject(project)
    }
    return () => setCurrentProject(null)
  }, [project, setCurrentProject])

  useEffect(() => {
    if (workspace) {
      setCurrentWorkspace(workspace)
    }
  }, [workspace, setCurrentWorkspace])

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <Header showViewSwitcher showSearch />
        <div className="flex items-center justify-center flex-1">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Loading project...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="flex flex-col h-full">
        <Header showSearch />
        <div className="flex items-center justify-center flex-1">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Project not found</h1>
            <p className="text-muted-foreground">
              The project you're looking for doesn't exist or you don't have access.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header showViewSwitcher showSearch />
      <KanbanBoard projectId={project.id} />
    </div>
  )
}
