import { useEffect, useState, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { Session, User, AuthError } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import { useAppStore } from "@/store"
import { Profile } from "@/types"
import { ROUTES } from "@/lib/constants"

export function useAuth() {
  const navigate = useNavigate()
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const { user, setUser, reset } = useAppStore()

  // Fetch user profile
  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single()

    if (error) {
      console.error("Error fetching profile:", error)
      return null
    }

    return data as Profile
  }, [])

  // Initialize auth state
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      if (session?.user) {
        const profile = await fetchProfile(session.user.id)
        setUser(profile)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      
      if (event === "SIGNED_IN" && session?.user) {
        const profile = await fetchProfile(session.user.id)
        setUser(profile)
      } else if (event === "SIGNED_OUT") {
        setUser(null)
        reset()
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchProfile, setUser, reset])

  // Sign up with email
  const signUp = async (
    email: string,
    password: string,
    metadata?: { full_name?: string; username?: string }
  ): Promise<{ user: User | null; error: AuthError | null }> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    })
    return { user: data.user, error }
  }

  // Sign in with email
  const signIn = async (
    email: string,
    password: string
  ): Promise<{ user: User | null; error: AuthError | null }> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { user: data.user, error }
  }

  // Sign in with magic link
  const signInWithMagicLink = async (
    email: string
  ): Promise<{ error: AuthError | null }> => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
      },
    })
    return { error }
  }

  // Sign in with OAuth
  const signInWithOAuth = async (
    provider: "google" | "github"
  ): Promise<{ error: AuthError | null }> => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    })
    return { error }
  }

  // Sign out
  const signOut = async () => {
    await supabase.auth.signOut()
    reset()
    navigate(ROUTES.LOGIN)
  }

  // Reset password
  const resetPassword = async (
    email: string
  ): Promise<{ error: AuthError | null }> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return { error }
  }

  // Update password
  const updatePassword = async (
    newPassword: string
  ): Promise<{ error: AuthError | null }> => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })
    return { error }
  }

  // Update profile
  const updateProfile = async (
    updates: Partial<Profile>
  ): Promise<{ data: Profile | null; error: Error | null }> => {
    if (!session?.user) {
      return { data: null, error: new Error("Not authenticated") }
    }

    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", session.user.id)
      .select()
      .single()

    if (!error && data) {
      setUser(data as Profile)
    }

    return { data: data as Profile | null, error }
  }

    updateProfile,
    fetchProfile,
    authUserId: session?.user?.id,
  }
}
