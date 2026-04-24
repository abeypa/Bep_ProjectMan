import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  Settings,
  Users,
  UserPlus,
  Mail,
  Shield,
  Trash2,
  X,
  Loader2,
  Plus,
  ArrowLeft,
  ChevronRight,
  Database,
  Layout,
  Globe,
  MoreHorizontal,
} from "lucide-react"
import { toast } from "sonner"
import { Header } from "@/components/layout/Header"
import { Button } from "@/components/ui/button"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/components"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  useWorkspace,
  useWorkspaceMembers,
  useWorkspaceInvitations,
  useCancelInvitation,
  useUpdateWorkspace,
  useDeleteWorkspace,
} from "@/hooks/useWorkspace"
import { MembersTable } from "@/components/workspace/MembersTable"
import { InviteMemberModal } from "@/components/workspace/InviteMemberModal"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"

export function WorkspaceSettingsPage() {
  const { workspaceSlug } = useParams()
  const navigate = useNavigate()
  const { authUserId } = useAuth()
  
  const { data: workspace, isLoading: workspaceLoading } = useWorkspace(workspaceSlug)
  const { data: members, isLoading: membersLoading } = useWorkspaceMembers(workspace?.id)
  const { data: invitations, isLoading: invitationsLoading } = useWorkspaceInvitations(workspace?.id)
  
  const updateWorkspace = useUpdateWorkspace()
  const deleteWorkspace = useDeleteWorkspace()
  const cancelInvitation = useCancelInvitation()

  const [activeTab, setActiveTab] = useState("general")
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  
  // General settings state
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [description, setDescription] = useState("")

  // Update local state when workspace data arrives
  useState(() => {
    if (workspace) {
      setName(workspace.name)
      setSlug(workspace.slug)
      setDescription(workspace.description || "")
    }
  })

  if (workspaceLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!workspace) return null

  const currentUserMember = members?.find(m => m.user_id === authUserId)
  const currentUserRole = currentUserMember?.role || "member"
  const canManage = currentUserRole === "owner" || currentUserRole === "admin"

  const handleUpdateGeneral = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await updateWorkspace.mutateAsync({
        id: workspace.id,
        name,
        slug,
        description,
      })
      toast.success("Workspace updated")
      if (slug !== workspaceSlug) {
        navigate(`/w/${slug}/settings`)
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update workspace")
    }
  }

  const handleDeleteWorkspace = async () => {
    if (!confirm("Are you sure? This will delete all projects and tasks. This action is irreversible.")) {
      return
    }
    try {
      await deleteWorkspace.mutateAsync(workspace.id)
      toast.success("Workspace deleted")
      navigate("/")
    } catch (error: any) {
      toast.error(error.message || "Failed to delete workspace")
    }
  }

  const handleCancelInvite = async (invitationId: string) => {
    try {
      await cancelInvitation.mutateAsync({
        workspaceId: workspace.id,
        invitationId,
      })
      toast.success("Invitation cancelled")
    } catch (error: any) {
      toast.error(error.message || "Failed to cancel invitation")
    }
  }

  return (
    <div className="flex flex-col h-full bg-muted/10">
      <Header 
        title="Workspace Settings" 
        breadcrumb={[
          { label: workspace.name, href: `/w/${workspaceSlug}` },
          { label: "Settings" }
        ]}
      />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          <div className="flex items-end justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-black tracking-tight uppercase flex items-center gap-3 italic">
                <Settings className="h-8 w-8 text-primary shrink-0" />
                Control Center
              </h1>
              <p className="text-muted-foreground font-bold text-xs uppercase tracking-widest pl-11">
                System configuration & Access Management
              </p>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <TabsList className="bg-muted/50 p-1 rounded-xl h-11">
              <TabsTrigger value="general" className="rounded-lg gap-2 text-xs font-black uppercase tracking-widest data-[state=active]:bg-card data-[state=active]:shadow-sm">
                <Layout className="h-3.5 w-3.5" />
                General
              </TabsTrigger>
              <TabsTrigger value="members" className="rounded-lg gap-2 text-xs font-black uppercase tracking-widest data-[state=active]:bg-card data-[state=active]:shadow-sm">
                <Users className="h-3.5 w-3.5" />
                Members
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-6">
              <Card className="border-none shadow-xl shadow-muted/20 overflow-hidden">
                <CardHeader className="bg-muted/30 border-b pb-6 px-8">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-card rounded-2xl shadow-sm border">
                      <Database className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-black uppercase tracking-tight">Identity & Metadata</CardTitle>
                      <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">Core workspace configuration</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8">
                  <form onSubmit={handleUpdateGeneral} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1 flex items-center gap-2">
                          <Plus className="h-3 w-3 text-primary" /> Display Name
                        </Label>
                        <Input 
                          id="name" 
                          value={name} 
                          onChange={(e) => setName(e.target.value)} 
                          placeholder="Workspace Name"
                          className="h-12 bg-muted/30 border-muted-foreground/10 focus:border-primary transition-all font-bold text-lg"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="slug" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1 flex items-center gap-2">
                          <Globe className="h-3 w-3 text-primary" /> Network Slug
                        </Label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-mono font-bold text-[10px] uppercase opacity-50">taskflow.com/w/</span>
                          <Input 
                            id="slug" 
                            value={slug} 
                            onChange={(e) => setSlug(e.target.value)} 
                            placeholder="my-workspace"
                            className="h-12 pl-24 bg-muted/30 border-muted-foreground/10 focus:border-primary transition-all font-mono font-bold"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1 flex items-center gap-2">
                        <ChevronRight className="h-3 w-3 text-primary" /> Description / Mission
                      </Label>
                      <Input 
                        id="description" 
                        value={description} 
                        onChange={(e) => setDescription(e.target.value)} 
                        placeholder="What is this workspace for?"
                        className="h-12 bg-muted/30 border-muted-foreground/10 focus:border-primary transition-all font-medium"
                      />
                    </div>

                    <div className="flex justify-end pt-4">
                      <Button type="submit" disabled={updateWorkspace.isPending} className="h-12 px-8 font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/20">
                        {updateWorkspace.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Database className="h-4 w-4 mr-2" />}
                        Save Manifest
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {currentUserRole === "owner" && (
                <Card className="border-red-500/20 bg-red-500/5 shadow-xl shadow-red-500/5 overflow-hidden">
                  <CardHeader className="px-8 pt-8">
                    <div className="flex items-center gap-4">
                       <div className="p-3 bg-red-500 rounded-2xl shadow-lg shadow-red-500/20 text-white">
                        <Trash2 className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-black uppercase tracking-tight text-red-900 italic">Danger Zone</CardTitle>
                        <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-red-700/60 mt-0.5">Destructive Terminal Actions</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8 space-y-6">
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 flex flex-col md:flex-row items-center gap-6 justify-between">
                       <div className="space-y-1">
                          <p className="font-black text-red-900 text-sm uppercase tracking-tight">Decommission Workspace</p>
                          <p className="text-xs font-bold text-red-700/70 max-w-lg leading-relaxed italic">
                            This action will permanently purge this entire node from the system registry, including all descendant projects, tasks, and asset records.
                          </p>
                       </div>
                       <Button 
                         variant="destructive" 
                         onClick={handleDeleteWorkspace}
                         className="h-12 px-8 font-black uppercase tracking-widest shadow-lg shadow-red-500/20"
                       >
                         Execute Purge
                       </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="members" className="space-y-8">
              <div className="flex items-end justify-between">
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                    <Users className="h-5 w-5 text-primary" />
                    Authorized Personnel
                  </h2>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1 ml-8">Currently registered members & Active Invitations</p>
                </div>
                {canManage && (
                  <Button onClick={() => setIsInviteModalOpen(true)} className="h-11 px-6 font-black uppercase tracking-widest shadow-lg shadow-primary/20 bg-navy-900 hover:bg-black">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Provision Member
                  </Button>
                )}
              </div>

              <div className="space-y-12">
                <section className="space-y-4">
                  <div className="flex items-center gap-2 px-1">
                    <Badge variant="outline" className="bg-muted/50 border-border text-[9px] font-black uppercase tracking-widest py-0.5 px-2">Registry</Badge>
                    <Separator className="flex-1" />
                  </div>
                  {membersLoading ? (
                    <div className="h-64 flex items-center justify-center border rounded-xl animate-pulse bg-muted/30">
                      <Loader2 className="h-8 w-8 animate-spin text-muted" />
                    </div>
                  ) : (
                    <MembersTable 
                      workspaceId={workspace.id} 
                      members={members || []} 
                      currentUserRole={currentUserRole}
                    />
                  )}
                </section>

                {invitations && invitations.length > 0 && (
                  <section className="space-y-4">
                    <div className="flex items-center gap-2 px-1 text-amber-600">
                      <Badge className="bg-amber-500 hover:bg-amber-500 text-white border-amber-600 text-[9px] font-black uppercase tracking-widest py-0.5 px-2">Outgoing Pipelines</Badge>
                      <Separator className="flex-1 bg-amber-500/20" />
                    </div>
                    <div className="grid gap-4">
                      {invitations.map((inv) => (
                        <Card key={inv.id} className="border-amber-200 bg-amber-500/5 shadow-sm hover:border-amber-400 transition-all group">
                          <CardContent className="p-5 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="h-10 w-10 bg-white border-2 border-amber-200 rounded-xl flex items-center justify-center text-amber-500 shadow-sm group-hover:scale-105 transition-transform">
                                <Mail className="h-5 w-5" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-black text-navy-900 text-sm tracking-tight">{inv.email}</p>
                                  <Badge variant="outline" className="text-[8px] py-0 h-4 border-amber-300 bg-amber-50 text-amber-700 font-black uppercase tracking-tighter">PENDING</Badge>
                                </div>
                                <div className="flex items-center gap-4 mt-1 font-bold text-[10px] text-muted-foreground/70 uppercase tracking-widest">
                                  <span className="flex items-center gap-1.5"><Shield className="h-3 w-3 text-amber-500" /> {inv.role}</span>
                                  <span className="flex items-center gap-1.5"><ChevronRight className="h-3 w-3" /> Expires {new Date(inv.expires_at).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleCancelInvite(inv.id)}
                              className="text-amber-700 hover:bg-amber-500 focus:bg-amber-500 hover:text-white h-9 px-4 font-black uppercase tracking-widest text-[9px]"
                            >
                              <X className="h-3 w-3 mr-2" />
                              Revoke
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <InviteMemberModal 
        isOpen={isInviteModalOpen} 
        onClose={() => setIsInviteModalOpen(false)} 
        workspaceId={workspace.id}
      />
    </div>
  )
}
