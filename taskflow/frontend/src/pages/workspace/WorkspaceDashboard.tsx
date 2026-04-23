import { useState } from "react"
import { useParams, useNavigate, useSearchParams } from "react-router-dom"
import { toast } from "sonner"
import {
  Plus,
  FolderKanban,
  Users,
  Settings,
  MoreHorizontal,
  Archive,
  Pencil,
} from "lucide-react"
import { Header } from "@/components/layout/Header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/components"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useWorkspace, useWorkspaceMembers } from "@/hooks/useWorkspace"
import { useProjects, useCreateProject } from "@/hooks/useProjects"
import { PROJECT_ICONS } from "@/lib/constants"
import { cn, isValidProjectKey } from "@/lib/utils"

export function WorkspaceDashboard() {
  const { workspaceSlug } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const { data: workspace, isLoading: workspaceLoading } = useWorkspace(workspaceSlug)
  const { data: projects, isLoading: projectsLoading } = useProjects(workspace?.id)
  const { data: members } = useWorkspaceMembers(workspace?.id)
  const createProject = useCreateProject()

  const showNewProjectModal = searchParams.get("new") === "project"

  const [projectName, setProjectName] = useState("")
  const [projectKey, setProjectKey] = useState("")
  const [projectIcon, setProjectIcon] = useState("📋")

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!workspace) return

    if (!projectName.trim()) {
      toast.error("Please enter a project name")
      return
    }

    if (!isValidProjectKey(projectKey.toUpperCase())) {
      toast.error("Project key must be 2-5 uppercase letters")
      return
    }

    try {
      const project = await createProject.mutateAsync({
        workspace_id: workspace.id,
        name: projectName.trim(),
        project_key: projectKey.toUpperCase(),
      })

      toast.success("Project created!")
      closeModal()
      navigate(`/w/${workspaceSlug}/p/${project.slug}/board`)
    } catch (error: any) {
      toast.error(error.message || "Failed to create project")
    }
  }

  const closeModal = () => {
    setSearchParams({})
    setProjectName("")
    setProjectKey("")
    setProjectIcon("📋")
  }

  const openNewProjectModal = () => {
    setSearchParams({ new: "project" })
  }

  // Auto-generate project key from name
  const handleNameChange = (name: string) => {
    setProjectName(name)
    if (!projectKey || projectKey === generateKey(projectName)) {
      setProjectKey(generateKey(name))
    }
  }

  const generateKey = (name: string) => {
    return name
      .split(/\s+/)
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .substring(0, 4)
  }

  if (workspaceLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!workspace) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Workspace not found</h1>
          <p className="text-muted-foreground">
            The workspace you're looking for doesn't exist or you don't have access.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <Header title={workspace.name} showSearch />

      <div className="flex-1 overflow-y-auto p-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Projects</CardTitle>
              <FolderKanban className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{projects?.length || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{members?.length || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Settings</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/w/${workspaceSlug}/settings`)}
              >
                Manage
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Projects */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Projects</h2>
            <Button onClick={openNewProjectModal}>
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </div>

          {projectsLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-5 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/2 mt-2" />
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : projects && projects.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <Card
                  key={project.id}
                  className="cursor-pointer hover:border-primary/50 transition-colors group"
                  onClick={() =>
                    navigate(`/w/${workspaceSlug}/p/${project.slug}/board`)
                  }
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{project.icon || "📋"}</span>
                        <div>
                          <CardTitle className="text-base">
                            {project.name}
                          </CardTitle>
                          <CardDescription className="text-xs">
                            {project.project_key}
                          </CardDescription>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="opacity-0 group-hover:opacity-100"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              navigate(
                                `/w/${workspaceSlug}/p/${project.slug}/settings`
                              )
                            }}
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <Archive className="h-4 w-4 mr-2" />
                            Archive
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  {project.description && (
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {project.description}
                      </p>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <FolderKanban className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No projects yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first project to start managing tasks
              </p>
              <Button onClick={openNewProjectModal}>
                <Plus className="h-4 w-4 mr-2" />
                Create Project
              </Button>
            </Card>
          )}
        </div>
      </div>

      {/* New Project Modal */}
      <Dialog open={showNewProjectModal} onOpenChange={closeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateProject} className="space-y-4">
            {/* Icon Selector */}
            <div className="space-y-2">
              <Label>Icon</Label>
              <div className="flex flex-wrap gap-2">
                {PROJECT_ICONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setProjectIcon(icon)}
                    className={cn(
                      "h-10 w-10 rounded-lg border flex items-center justify-center text-xl hover:bg-muted transition-colors",
                      projectIcon === icon && "border-primary bg-primary/10"
                    )}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="projectName">Project Name</Label>
              <Input
                id="projectName"
                value={projectName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="My Awesome Project"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="projectKey">Project Key</Label>
              <Input
                id="projectKey"
                value={projectKey}
                onChange={(e) =>
                  setProjectKey(e.target.value.toUpperCase().substring(0, 5))
                }
                placeholder="PROJ"
                maxLength={5}
              />
              <p className="text-xs text-muted-foreground">
                2-5 uppercase letters. Used in task IDs (e.g., {projectKey || "PROJ"}-123)
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={closeModal}>
                Cancel
              </Button>
              <Button type="submit" loading={createProject.isPending}>
                Create Project
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
