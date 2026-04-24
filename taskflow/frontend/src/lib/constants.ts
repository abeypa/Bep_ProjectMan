import { TaskPriority, WorkspaceRole } from "@/types"

export const APP_NAME = "TaskFlow"

export const TASK_PRIORITIES: { value: TaskPriority; label: string; color: string }[] = [
  { value: "urgent", label: "Urgent", color: "#ef4444" },
  { value: "high", label: "High", color: "#f97316" },
  { value: "medium", label: "Medium", color: "#eab308" },
  { value: "low", label: "Low", color: "#22c55e" },
  { value: "none", label: "No priority", color: "#6b7280" },
]

export const WORKSPACE_ROLES: { value: WorkspaceRole; label: string; description: string }[] = [
  { value: "owner", label: "Owner", description: "Full access, can delete workspace" },
  { value: "admin", label: "Admin", description: "Can manage members and settings" },
  { value: "member", label: "Member", description: "Can create and edit tasks" },
  { value: "guest", label: "Guest", description: "Read-only access" },
]

export const DEFAULT_BOARD_COLUMNS = [
  { name: "Backlog", color: "#6b7280", position: 0 },
  { name: "To Do", color: "#3b82f6", position: 1 },
  { name: "In Progress", color: "#f59e0b", position: 2 },
  { name: "In Review", color: "#8b5cf6", position: 3 },
  { name: "Done", color: "#10b981", position: 4 },
]

export const LABEL_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#84cc16", // lime
  "#22c55e", // green
  "#14b8a6", // teal
  "#06b6d4", // cyan
  "#0ea5e9", // sky
  "#3b82f6", // blue
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#a855f7", // purple
  "#d946ef", // fuchsia
  "#ec4899", // pink
  "#f43f5e", // rose
]

export const PROJECT_ICONS = [
  "📋", "📁", "🎯", "🚀", "💡", "⚡", "🔥", "💎",
  "🎨", "🎮", "📱", "💻", "🌐", "🔧", "⚙️", "📊",
  "📈", "🎪", "🏆", "🎭", "🎵", "📸", "✨", "🌟",
]

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  SIGNUP: "/signup",
  RESET_PASSWORD: "/reset-password",
  INVITE: "/invite/:token",
  WORKSPACE: "/w/:workspaceSlug",
  WORKSPACE_SETTINGS: "/w/:workspaceSlug/settings",
  PROJECT: "/w/:workspaceSlug/p/:projectSlug",
  PROJECT_BOARD: "/w/:workspaceSlug/p/:projectSlug/board",
  PROJECT_LIST: "/w/:workspaceSlug/p/:projectSlug/list",
  PROJECT_TABLE: "/w/:workspaceSlug/p/:projectSlug/table",
  PROJECT_SETTINGS: "/w/:workspaceSlug/p/:projectSlug/settings",
  TASK: "/w/:workspaceSlug/p/:projectSlug/task/:taskKey",
} as const

export const QUERY_KEYS = {
  PROFILE: "profile",
  WORKSPACES: "workspaces",
  WORKSPACE: "workspace",
  WORKSPACE_MEMBERS: "workspace-members",
  WORKSPACE_INVITATIONS: "workspace-invitations",
  WORKSPACE_ROLE: "workspace-role",
  INVITATION_DETAILS: "invitation-details",
  PROJECTS: "projects",
  PROJECT: "project",
  BOARD: "board",
  TASKS: "tasks",
  TASK: "task",
  COMMENTS: "comments",
  ACTIVITY: "activity",
  LABELS: "labels",
} as const

export const STORAGE_KEYS = {
  LAST_WORKSPACE: "taskflow:last-workspace",
  SIDEBAR_COLLAPSED: "taskflow:sidebar-collapsed",
  BOARD_VIEW: "taskflow:board-view",
} as const
