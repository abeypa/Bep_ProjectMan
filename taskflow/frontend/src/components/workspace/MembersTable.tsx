import { useState } from "react"
import {
  MoreVertical,
  Shield,
  ShieldCheck,
  User,
  UserX,
  RefreshCw,
  Mail,
  Calendar,
} from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  WorkspaceMemberWithProfile,
  WorkspaceRole,
} from "@/types"
import {
  useUpdateMemberRole,
  useRemoveMember,
} from "@/hooks/useWorkspace"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"

interface MembersTableProps {
  workspaceId: string
  members: WorkspaceMemberWithProfile[]
  currentUserRole: WorkspaceRole
}

export function MembersTable({
  workspaceId,
  members,
  currentUserRole,
}: MembersTableProps) {
  const { authUserId } = useAuth()
  const updateRole = useUpdateMemberRole()
  const removeMember = useRemoveMember()
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const canManageRoles = currentUserRole === "owner" || currentUserRole === "admin"

  const handleUpdateRole = async (memberId: string, newRole: WorkspaceRole) => {
    setUpdatingId(memberId)
    try {
      await updateRole.mutateAsync({
        workspaceId,
        memberId,
        role: newRole,
      })
      toast.success("Member role updated")
    } catch (error: any) {
      toast.error(error.message || "Failed to update role")
    } finally {
      setUpdatingId(null)
    }
  }

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from the workspace?`)) {
      return
    }

    try {
      await removeMember.mutateAsync({
        workspaceId,
        memberId,
      })
      toast.success("Member removed")
    } catch (error: any) {
      toast.error(error.message || "Failed to remove member")
    }
  }

  const getRoleIcon = (role: WorkspaceRole) => {
    switch (role) {
      case "owner":
        return <ShieldCheck className="h-3.5 w-3.5 text-primary" />
      case "admin":
        return <Shield className="h-3.5 w-3.5 text-blue-500" />
      default:
        return <User className="h-3.5 w-3.5 text-muted-foreground" />
    }
  }

  const getRoleBadgeVariant = (role: WorkspaceRole) => {
    switch (role) {
      case "owner":
        return "default"
      case "admin":
        return "secondary"
      default:
        return "outline"
    }
  }

  // Avatar helper similar to bom-manager
  const initials = (name: string) => name.slice(0, 2).toUpperCase()
  const avatarColor = (id: string) => {
    const colors = [
      "bg-indigo-500",
      "bg-emerald-500",
      "bg-sky-500",
      "bg-amber-500",
      "bg-rose-500",
      "bg-violet-500",
    ]
    let hash = 0
    for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash)
    return colors[Math.abs(hash) % colors.length]
  }

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="w-[300px]">Member</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Joined at</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => {
            const isMe = member.user_id === authUserId
            const isOwner = member.role === "owner"
            const name = member.profile?.full_name || member.profile?.username || "Unknown User"
            const email = member.profile?.username || "" // Assuming username stores email for now
            const isUpdating = updatingId === member.id

            return (
              <TableRow key={member.id} className={cn(isMe && "bg-muted/30")}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "h-9 w-9 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-sm",
                        avatarColor(member.user_id)
                      )}
                    >
                      {initials(name)}
                    </div>
                    <div>
                      <div className="font-bold flex items-center gap-2">
                        {name}
                        {isMe && (
                          <Badge variant="outline" className="text-[10px] py-0 h-4 px-1.5 font-black uppercase tracking-widest border-primary/20 bg-primary/5 text-primary">
                            You
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {email}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={getRoleBadgeVariant(member.role)}
                      className="gap-1.5 px-2 py-0.5 font-bold uppercase tracking-widest text-[9px]"
                    >
                      {getRoleIcon(member.role)}
                      {member.role}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-xs text-muted-foreground flex items-center gap-1.5 font-mono">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(member.joined_at), "dd MMM yyyy")}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {!isOwner && (isMe || canManageRoles) ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" disabled={isUpdating}>
                          {isUpdating ? (
                            <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                          ) : (
                            <MoreVertical className="h-4 w-4" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[180px]">
                        <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-2 py-1.5">
                          Member Controls
                        </DropdownMenuLabel>
                        {canManageRoles && (
                          <>
                            <DropdownMenuSeparator />
                            {(["admin", "member", "guest"] as WorkspaceRole[]).map(
                              (role) => (
                                <DropdownMenuItem
                                  key={role}
                                  className={cn(
                                    "flex items-center gap-2 py-2 text-xs font-bold uppercase tracking-tighter",
                                    member.role === role && "bg-muted text-primary"
                                  )}
                                  onClick={() => handleUpdateRole(member.id, role)}
                                >
                                  {getRoleIcon(role)}
                                  Set as {role}
                                </DropdownMenuItem>
                              )
                            )}
                          </>
                        )}
                        {!isMe && (canManageRoles || currentUserRole === "owner") && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive flex items-center gap-2 py-2 text-xs font-bold uppercase tracking-tighter"
                              onClick={() => handleRemoveMember(member.id, name)}
                            >
                              <UserX className="h-4 w-4" />
                              Remove Member
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <div className="px-4 py-2 text-[10px] italic text-muted-foreground font-bold uppercase tracking-widest">
                      Locked
                    </div>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
