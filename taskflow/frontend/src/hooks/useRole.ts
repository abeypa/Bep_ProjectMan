import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { QUERY_KEYS } from "@/lib/constants"
import { useAuth } from "@/hooks/useAuth"
import { UserRole, WorkspaceRole } from "@/types"

export function useRole() {
  const [role, setRole] = useState<UserRole | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          setRole(null)
          setUserEmail(null)
          return
        }

        setUserEmail(user.email ?? null)

        const { data, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single()

        if (error) throw error
        setRole(data.role as UserRole)
      } catch (err) {
        console.error("Failed to fetch role:", err)
        setRole("user")
      } finally {
        setLoading(false)
      }
    }

    fetchRole()

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      fetchRole()
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  const isAdmin = role === "admin" || userEmail?.endsWith("@bepindia.com")
  const isUser = role === "user"

  return { role, isAdmin, isUser, loading, userEmail }
}

export function useWorkspaceRole(workspaceId: string | undefined) {
  const { authUserId } = useAuth()

  return useQuery({
    queryKey: [QUERY_KEYS.WORKSPACE_ROLE, workspaceId, authUserId],
    queryFn: async () => {
      if (!workspaceId || !authUserId) return null

      const { data, error } = await supabase
        .from("workspace_members")
        .select("role")
        .eq("workspace_id", workspaceId)
        .eq("user_id", authUserId)
        .maybeSingle()

      if (error) throw error
      return (data?.role as WorkspaceRole | undefined) ?? null
    },
    enabled: !!workspaceId && !!authUserId,
  })
}
