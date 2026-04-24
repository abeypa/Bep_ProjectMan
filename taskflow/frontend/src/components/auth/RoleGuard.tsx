import React from "react"
import { useRole, useWorkspaceRole } from "@/hooks/useRole"
import { ShieldAlert } from "lucide-react"
import { WorkspaceRole } from "@/types"

interface RoleGuardProps {
  children: React.ReactNode
  requiredRole?: "admin" | "user"
  fallback?: React.ReactNode
  workspaceId?: string
  allowedWorkspaceRoles?: WorkspaceRole[]
}

export function RoleGuard({
  children,
  requiredRole = "user",
  fallback,
  workspaceId,
  allowedWorkspaceRoles,
}: RoleGuardProps) {
  const { role, isAdmin, loading } = useRole()
  const {
    data: workspaceRole,
    isLoading: workspaceRoleLoading,
  } = useWorkspaceRole(workspaceId)

  if (loading || (!!workspaceId && !!allowedWorkspaceRoles?.length && workspaceRoleLoading)) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  const hasSystemAccess = requiredRole === "admin" ? isAdmin : !!role
  const hasWorkspaceAccess =
    workspaceId && allowedWorkspaceRoles?.length
      ? !!workspaceRole && allowedWorkspaceRoles.includes(workspaceRole)
      : true
  const hasAccess = hasSystemAccess && hasWorkspaceAccess

  if (!hasAccess) {
    return (
      fallback || (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-card border rounded-2xl shadow-sm m-6">
          <div className="w-16 h-16 bg-destructive/10 rounded-2xl flex items-center justify-center mb-6">
            <ShieldAlert className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-xl font-bold">Access Restricted</h2>
          <p className="text-muted-foreground text-sm mt-2 max-w-xs mx-auto">
            Your account does not have the administrative clearance required to
            access this module.
          </p>
          <div className="mt-8 px-4 py-2 bg-muted rounded-xl inline-block border">
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
              Required Clearance:{" "}
              {allowedWorkspaceRoles?.length
                ? allowedWorkspaceRoles.join(" / ")
                : requiredRole}
            </p>
          </div>
        </div>
      )
    )
  }

  return <>{children}</>
}
