import { useState } from "react"
import { Link, useParams, useNavigate } from "react-router-dom"
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Settings,
  Users,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  ChevronsLeft,
  ChevronsRight,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { UserAvatar } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/components"
import { useWorkspaces } from "@/hooks/useWorkspace"
import { useProjects } from "@/hooks/useProjects"
import { useAuth } from "@/hooks/useAuth"
import { useAppStore } from "@/store"
import { WorkspaceWithCounts, Project } from "@/types"

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const { workspaceSlug, projectSlug } = useParams()
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { data: workspaces, isLoading: workspacesLoading } = useWorkspaces()
  const { sidebarCollapsed, toggleSidebar } = useAppStore()

  const currentWorkspace = workspaces?.find((w) => w.slug === workspaceSlug)

  const { data: projects } = useProjects(currentWorkspace?.id)

  const [expandedWorkspaces, setExpandedWorkspaces] = useState<Set<string>>(
    new Set([currentWorkspace?.id || ""])
  )

  const toggleWorkspace = (workspaceId: string) => {
    const newExpanded = new Set(expandedWorkspaces)
    if (newExpanded.has(workspaceId)) {
      newExpanded.delete(workspaceId)
    } else {
      newExpanded.add(workspaceId)
    }
    setExpandedWorkspaces(newExpanded)
  }

  const handleWorkspaceChange = (workspace: WorkspaceWithCounts) => {
    navigate(`/w/${workspace.slug}`)
  }

  const handleProjectClick = (project: Project) => {
    navigate(`/w/${workspaceSlug}/p/${project.slug}/board`)
  }

  if (sidebarCollapsed) {
    return (
      <TooltipProvider delayDuration={0}>
        <aside
          className={cn(
            "flex flex-col w-16 bg-sidebar border-r border-sidebar-border",
            className
          )}
        >
          <div className="flex items-center justify-center h-14 border-b border-sidebar-border">
            <Link to="/" className="flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-primary" />
            </Link>
          </div>

          <div className="flex-1 py-4">
            <div className="flex flex-col items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate(`/w/${workspaceSlug}`)}
                    className={cn(
                      "h-10 w-10",
                      !projectSlug && "bg-sidebar-accent"
                    )}
                  >
                    <LayoutDashboard className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Dashboard</TooltipContent>
              </Tooltip>

              {projects?.slice(0, 5).map((project) => (
                <Tooltip key={project.id}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleProjectClick(project)}
                      className={cn(
                        "h-10 w-10",
                        projectSlug === project.slug && "bg-sidebar-accent"
                      )}
                    >
                      <span className="text-lg">{project.icon || "📋"}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">{project.name}</TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>

          <div className="p-2 border-t border-sidebar-border">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleSidebar}
                  className="h-10 w-10 mx-auto"
                >
                  <ChevronsRight className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Expand sidebar</TooltipContent>
            </Tooltip>
          </div>
        </aside>
      </TooltipProvider>
    )
  }

  return (
    <aside
      className={cn(
        "flex flex-col w-64 bg-sidebar border-r border-sidebar-border",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between h-14 px-4 border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <span className="font-semibold text-sidebar-foreground">TaskFlow</span>
        </Link>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggleSidebar}
          className="text-muted-foreground hover:text-foreground"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
      </div>

      {/* Workspace Selector */}
      {currentWorkspace && (
        <div className="px-3 py-3 border-b border-sidebar-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between h-auto py-2 px-3"
              >
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center text-primary font-semibold">
                    {currentWorkspace.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium truncate max-w-[120px]">
                      {currentWorkspace.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {currentWorkspace.member_count} members
                    </p>
                  </div>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {workspaces?.map((workspace) => (
                <DropdownMenuItem
                  key={workspace.id}
                  onClick={() => handleWorkspaceChange(workspace)}
                  className="flex items-center gap-2"
                >
                  <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold">
                    {workspace.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="truncate">{workspace.name}</span>
                  {workspace.is_personal && (
                    <span className="text-xs text-muted-foreground ml-auto">
                      Personal
                    </span>
                  )}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/")}>
                <Plus className="h-4 w-4 mr-2" />
                Create Workspace
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Navigation */}
      <ScrollArea className="flex-1">
        <div className="px-3 py-4">
          {/* Dashboard Link */}
          <Link
            to={`/w/${workspaceSlug}`}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
              !projectSlug
                ? "bg-sidebar-accent text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
            )}
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>

          {/* Projects Section */}
          <div className="mt-6">
            <div className="flex items-center justify-between px-3 mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Projects
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                className="h-5 w-5"
                onClick={() => navigate(`/w/${workspaceSlug}?new=project`)}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>

            <div className="space-y-1">
              {projects?.map((project) => (
                <button
                  key={project.id}
                  onClick={() => handleProjectClick(project)}
                  className={cn(
                    "flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm transition-colors text-left",
                    projectSlug === project.slug
                      ? "bg-sidebar-accent text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
                  )}
                >
                  <span className="text-base">{project.icon || "📋"}</span>
                  <span className="truncate flex-1">{project.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {project.project_key}
                  </span>
                </button>
              ))}

              {projects?.length === 0 && (
                <p className="px-3 py-2 text-sm text-muted-foreground">
                  No projects yet
                </p>
              )}
            </div>
          </div>

          {/* Settings Section */}
          <div className="mt-6">
            <div className="px-3 mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Workspace
              </span>
            </div>

            <div className="space-y-1">
              <Link
                to={`/w/${workspaceSlug}/settings`}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
              >
                <Settings className="h-4 w-4" />
                Settings
              </Link>
              <Link
                to={`/w/${workspaceSlug}/settings?tab=members`}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
              >
                <Users className="h-4 w-4" />
                Members
              </Link>
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* User Section */}
      <div className="p-3 border-t border-sidebar-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start h-auto py-2 px-2"
            >
              <UserAvatar user={user} size="sm" />
              <div className="ml-2 text-left flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user?.full_name || user?.username || "User"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.username && `@${user.username}`}
                </p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/settings/profile")}>
              <Settings className="h-4 w-4 mr-2" />
              Profile Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut} className="text-destructive">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  )
}
