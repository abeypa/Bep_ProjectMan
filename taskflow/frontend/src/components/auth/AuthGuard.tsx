import { useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useAuthContext } from "@/context/AuthContext"
import { ROUTES } from "@/lib/constants"

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuthContext()
  const isAuthenticated = !!user
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      // Save the attempted URL for redirecting after login
      navigate(ROUTES.LOGIN, {
        state: { from: location.pathname },
        replace: true,
      })
    }
  }, [isAuthenticated, loading, navigate, location])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}
