import { useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"

interface PublicRouteProps {
  children: React.ReactNode
}

/**
 * PublicRoute redirects authenticated users away from public pages like Login and Signup.
 */
export function PublicRoute({ children }: PublicRouteProps) {
  const { session, loading } = useAuth()
  const isAuthenticated = !!session
  const navigate = useNavigate()
  const location = useLocation()
  
  // Get the intended destination or default to home
  const from = (location.state as any)?.from || "/"

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, loading, navigate, from])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0b]">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent relative z-10" />
        </div>
      </div>
    )
  }

  if (isAuthenticated) {
    return null
  }

  return <>{children}</>
}
