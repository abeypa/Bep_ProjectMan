import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { useAppStore } from "@/store"
import { useAuth } from "@/hooks/useAuth"
import {
  Workspace,
  WorkspaceWithCounts,
  WorkspaceMember,
  WorkspaceInvitation,
  CreateWorkspaceInput,
  InviteMemberInput,
  Profile,
} from "@/types"
import { QUERY_KEYS } from "@/lib/constants"

// Fetch all workspaces for current user
export function useWorkspaces() {
  return useQuery({
    queryKey: [QUERY_KEYS.WORKSPACES],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_workspaces_with_counts")

      if (error) throw error
      return data as WorkspaceWithCounts[]
    },
  })
}

// Fetch single workspace by slug
export function useWorkspace(slug: string | undefined) {
  const setCurrentWorkspace = useAppStore((s) => s.setCurrentWorkspace)

  return useQuery({
    queryKey: [QUERY_KEYS.WORKSPACE, slug],
    queryFn: async () => {
      if (!slug) return null

      const { data, error } = await supabase
        .from("workspaces")
        .select("*")
        .eq("slug", slug)
        .single()

      if (error) throw error
      setCurrentWorkspace(data as Workspace)
      return data as Workspace
    },
    enabled: !!slug,
  })
}

// Fetch workspace members
export function useWorkspaceMembers(workspaceId: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEYS.WORKSPACE_MEMBERS, workspaceId],
    queryFn: async () => {
      if (!workspaceId) return []

      const { data, error } = await supabase
        .from("workspace_members")
        .select(`
          *,
          profile:profiles(*)
        `)
        .eq("workspace_id", workspaceId)
        .order("joined_at", { ascending: true })

      if (error) throw error
      return data.map((m) => ({
        ...m,
        profile: m.profile as Profile,
      })) as (WorkspaceMember & { profile: Profile })[]
    },
    enabled: !!workspaceId,
  })
}

// Fetch workspace invitations
export function useWorkspaceInvitations(workspaceId: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEYS.WORKSPACE_INVITATIONS, workspaceId],
    queryFn: async () => {
      if (!workspaceId) return []

      const { data, error } = await supabase
        .from("workspace_invitations")
        .select("*")
        .eq("workspace_id", workspaceId)
        .eq("status", "pending")
        .order("created_at", { ascending: false })

      if (error) throw error
      return data as WorkspaceInvitation[]
    },
    enabled: !!workspaceId,
  })
}

// Create workspace mutation
export function useCreateWorkspace() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (input: CreateWorkspaceInput) => {
      const { data, error } = await supabase.rpc("create_workspace", {
        ws_name: input.name,
        ws_slug: input.slug,
        ws_description: input.description,
        creator_id: user?.id,
      })

      if (error) throw error
      return data as Workspace
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.WORKSPACES] })
    },
  })
}

// Update workspace mutation
export function useUpdateWorkspace() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<Workspace> & { id: string }) => {
      const { data, error } = await supabase
        .from("workspaces")
        .update(updates)
        .eq("id", id)
        .select()
        .single()

      if (error) throw error
      return data as Workspace
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.WORKSPACES] })
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.WORKSPACE, data.slug],
      })
    },
  })
}

// Delete workspace mutation
export function useDeleteWorkspace() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (workspaceId: string) => {
      const { error } = await supabase
        .from("workspaces")
        .delete()
        .eq("id", workspaceId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.WORKSPACES] })
    },
  })
}

// Invite member mutation
export function useInviteMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: InviteMemberInput) => {
      const { data, error } = await supabase.rpc("invite_workspace_member", {
        ws_id: input.workspace_id,
        member_email: input.email,
        member_role: input.role || "member",
      })

      if (error) throw error
      return data as WorkspaceInvitation
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.WORKSPACE_INVITATIONS, variables.workspace_id],
      })
    },
  })
}

// Accept invitation mutation
export function useAcceptInvitation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (token: string) => {
      const { data, error } = await supabase.rpc("accept_workspace_invitation", {
        invitation_token: token,
      })

      if (error) throw error
      return data as WorkspaceMember
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.WORKSPACES] })
    },
  })
}

// Update member role mutation
export function useUpdateMemberRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      memberId,
      role,
      workspaceId,
    }: {
      memberId: string
      role: string
      workspaceId: string
    }) => {
      const { data, error } = await supabase
        .from("workspace_members")
        .update({ role })
        .eq("id", memberId)
        .select()
        .single()

      if (error) throw error
      return { data, workspaceId }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.WORKSPACE_MEMBERS, result.workspaceId],
      })
    },
  })
}

// Remove member mutation
export function useRemoveMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      memberId,
      workspaceId,
    }: {
      memberId: string
      workspaceId: string
    }) => {
      const { error } = await supabase
        .from("workspace_members")
        .delete()
        .eq("id", memberId)

      if (error) throw error
      return workspaceId
    },
    onSuccess: (workspaceId) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.WORKSPACE_MEMBERS, workspaceId],
      })
    },
  })
}

// Cancel invitation mutation
export function useCancelInvitation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      invitationId,
      workspaceId,
    }: {
      invitationId: string
      workspaceId: string
    }) => {
      const { error } = await supabase
        .from("workspace_invitations")
        .update({ status: "cancelled" })
        .eq("id", invitationId)

      if (error) throw error
      return workspaceId
    },
    onSuccess: (workspaceId) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.WORKSPACE_INVITATIONS, workspaceId],
      })
    },
  })
}
