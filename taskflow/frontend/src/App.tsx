import { Routes, Route, Navigate } from "react-router-dom"
import { Toaster } from "sonner"

// Auth
import { AuthGuard } from "@/components/auth/AuthGuard"
import { LoginPage } from "@/pages/auth/Login"
import { SignupPage } from "@/pages/auth/Signup"

// Layout
import { MainLayout } from "@/components/layout/MainLayout"

// Pages
import { HomePage } from "@/pages/Home"
import { WorkspaceDashboard } from "@/pages/workspace/WorkspaceDashboard"
import { ProjectBoard } from "@/pages/project/ProjectBoard"

// Providers
import { TooltipProvider } from "@/components/ui/components"

function App() {
  return (
    <TooltipProvider delayDuration={0}>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <AuthGuard>
              <HomePage />
            </AuthGuard>
          }
        />

        {/* Workspace Routes */}
        <Route
          path="/w/:workspaceSlug"
          element={
            <AuthGuard>
              <MainLayout />
            </AuthGuard>
          }
        >
          <Route index element={<WorkspaceDashboard />} />
          <Route path="settings" element={<WorkspaceSettings />} />

          {/* Project Routes */}
          <Route path="p/:projectSlug">
            <Route index element={<Navigate to="board" replace />} />
            <Route path="board" element={<ProjectBoard />} />
            <Route path="list" element={<ProjectList />} />
            <Route path="table" element={<ProjectTable />} />
            <Route path="settings" element={<ProjectSettings />} />
          </Route>
        </Route>

        {/* Invitation Route */}
        <Route path="/invite/:token" element={<InvitationPage />} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>

      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            color: "hsl(var(--card-foreground))",
          },
        }}
      />
    </TooltipProvider>
  )
}

// Placeholder components for routes not yet implemented
function WorkspaceSettings() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Workspace Settings</h1>
        <p className="text-muted-foreground">Coming soon...</p>
      </div>
    </div>
  )
}

function ProjectList() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">List View</h1>
        <p className="text-muted-foreground">Coming soon...</p>
      </div>
    </div>
  )
}

function ProjectTable() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Table View</h1>
        <p className="text-muted-foreground">Coming soon...</p>
      </div>
    </div>
  )
}

function ProjectSettings() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Project Settings</h1>
        <p className="text-muted-foreground">Coming soon...</p>
      </div>
    </div>
  )
}

function InvitationPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Accept Invitation</h1>
        <p className="text-muted-foreground">Coming soon...</p>
      </div>
    </div>
  )
}

function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2">404</h1>
        <p className="text-muted-foreground mb-4">Page not found</p>
        <a href="/" className="text-primary hover:underline">
          Go back home
        </a>
      </div>
    </div>
  )
}

export default App
