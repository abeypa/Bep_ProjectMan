import { useParams, Link, useLocation } from "react-router-dom"
import {
  Search,
  Bell,
  Plus,
  LayoutGrid,
  List,
  Table2,
  Settings,
  MoreHorizontal,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/components"
import { useAppStore } from "@/store"

interface HeaderProps {
  title?: string
  showViewSwitcher?: boolean
  showSearch?: boolean
  actions?: React.ReactNode
}

export function Header({
  title,
  showViewSwitcher = false,
  showSearch = true,
  actions,
}: HeaderProps) {
  const { workspaceSlug, projectSlug } = useParams()
  const location = useLocation()
  const { currentProject, openCreateTaskModal, setCommandPaletteOpen } =
    useAppStore()

  const currentView = location.pathname.includes("/board")
    ? "board"
    : location.pathname.includes("/list")
    ? "list"
    : location.pathname.includes("/table")
    ? "table"
    : "board"

  const getViewPath = (view: string) => {
    return `/w/${workspaceSlug}/p/${projectSlug}/${view}`
  }

  return (
    <TooltipProvider delayDuration={0}>
      <header className="h-14 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
        <div className="flex items-center justify-between h-full px-4">
          {/* Left Section - Title & Breadcrumb */}
          <div className="flex items-center gap-4">
            {title && (
              <h1 className="text-lg font-semibold text-foreground">{title}</h1>
            )}
            {currentProject && (
              <div className="flex items-center gap-2">
                <span className="text-lg">{currentProject.icon || "📋"}</span>
                <span className="font-semibold">{currentProject.name}</span>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                  {currentProject.project_key}
                </span>
              </div>
            )}

            {/* View Switcher */}
            {showViewSwitcher && currentProject && (
              <div className="flex items-center ml-4 border rounded-lg p-0.5 bg-muted/50">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link to={getViewPath("board")}>
                      <Button
                        variant={currentView === "board" ? "secondary" : "ghost"}
                        size="sm"
                        className="h-7 px-2"
                      >
                        <LayoutGrid className="h-4 w-4" />
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>Board View</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link to={getViewPath("list")}>
                      <Button
                        variant={currentView === "list" ? "secondary" : "ghost"}
                        size="sm"
                        className="h-7 px-2"
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>List View</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link to={getViewPath("table")}>
                      <Button
                        variant={currentView === "table" ? "secondary" : "ghost"}
                        size="sm"
                        className="h-7 px-2"
                      >
                        <Table2 className="h-4 w-4" />
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>Table View</TooltipContent>
                </Tooltip>
              </div>
            )}
          </div>

          {/* Right Section - Search & Actions */}
          <div className="flex items-center gap-2">
            {/* Search */}
            {showSearch && (
              <Button
                variant="outline"
                size="sm"
                className="w-64 justify-start text-muted-foreground"
                onClick={() => setCommandPaletteOpen(true)}
              >
                <Search className="h-4 w-4 mr-2" />
                <span>Search...</span>
                <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </Button>
            )}

            {/* Custom Actions */}
            {actions}

            {/* Create Task Button */}
            {currentProject && (
              <Button
                size="sm"
                onClick={() => openCreateTaskModal()}
                className="gap-1"
              >
                <Plus className="h-4 w-4" />
                New Task
              </Button>
            )}

            {/* Notifications */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon-sm">
                  <Bell className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Notifications</TooltipContent>
            </Tooltip>

            {/* Project Settings */}
            {currentProject && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to={`/w/${workspaceSlug}/p/${projectSlug}/settings`}>
                      <Settings className="h-4 w-4 mr-2" />
                      Project Settings
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </header>
    </TooltipProvider>
  )
}
