import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { Plus, Sparkles, Building2, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/components"
import { useWorkspaces, useCreateWorkspace } from "@/hooks/useWorkspace"
import { useAuth } from "@/hooks/useAuth"
import { STORAGE_KEYS } from "@/lib/constants"

export function HomePage() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const { data: workspaces, isLoading } = useWorkspaces()
  const createWorkspace = useCreateWorkspace()

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [workspaceName, setWorkspaceName] = useState("")

  // Redirect to last visited workspace
  useEffect(() => {
    if (workspaces && workspaces.length > 0 && !isLoading) {
      const lastWorkspace = localStorage.getItem(STORAGE_KEYS.LAST_WORKSPACE)
      const targetWorkspace = workspaces.find((w) => w.slug === lastWorkspace) || workspaces[0]
      
      // Only auto-redirect if there's exactly one workspace or we have a last workspace
      if (workspaces.length === 1 || lastWorkspace) {
        navigate(`/w/${targetWorkspace.slug}`, { replace: true })
      }
    }
  }, [workspaces, isLoading, navigate])

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!workspaceName.trim()) {
      toast.error("Please enter a workspace name")
      return
    }

    try {
      const workspace = await createWorkspace.mutateAsync({
        name: workspaceName.trim(),
      })

      toast.success("Workspace created!")
      setShowCreateModal(false)
      setWorkspaceName("")
      navigate(`/w/${workspace.slug}`)
    } catch (error: any) {
      toast.error(error.message || "Failed to create workspace")
    }
  }

  const handleSelectWorkspace = (slug: string) => {
    localStorage.setItem(STORAGE_KEYS.LAST_WORKSPACE, slug)
    navigate(`/w/${slug}`)
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background gradient-mesh">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">TaskFlow</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Welcome, {user?.full_name || user?.username || "User"}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Select a Workspace</h1>
            <p className="text-muted-foreground">
              Choose a workspace to continue or create a new one
            </p>
          </div>

          {/* Workspaces Grid */}
          <div className="grid gap-4 md:grid-cols-2 mb-6">
            {workspaces?.map((workspace) => (
              <Card
                key={workspace.id}
                className="cursor-pointer hover:border-primary/50 transition-all hover:shadow-md group"
                onClick={() => handleSelectWorkspace(workspace.slug)}
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                      {workspace.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center justify-between">
                        {workspace.name}
                        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </CardTitle>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span>{workspace.member_count} members</span>
                        <span>{workspace.project_count} projects</span>
                        {workspace.is_personal && (
                          <span className="text-xs bg-muted px-2 py-0.5 rounded">
                            Personal
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>

          {/* Create Workspace */}
          <Card
            className="cursor-pointer border-dashed hover:border-primary/50 transition-colors"
            onClick={() => setShowCreateModal(true)}
          >
            <CardContent className="flex items-center justify-center gap-2 py-8">
              <Plus className="h-5 w-5 text-muted-foreground" />
              <span className="text-muted-foreground font-medium">
                Create New Workspace
              </span>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Create Workspace Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Workspace</DialogTitle>
            <DialogDescription>
              Create a workspace for your team to collaborate on projects
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateWorkspace} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Workspace Name</Label>
              <Input
                id="name"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                placeholder="My Team"
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </Button>
              <Button type="submit" loading={createWorkspace.isPending}>
                Create Workspace
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
