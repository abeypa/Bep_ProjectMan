// Database types for TaskFlow
// These mirror the Supabase schema

export type TaskPriority = "none" | "low" | "medium" | "high" | "urgent"
export type WorkspaceRole = "owner" | "admin" | "member" | "viewer"
export type ProjectStatus = "active" | "archived"
export type InvitationStatus = "pending" | "accepted" | "expired" | "cancelled"

export interface Profile {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  website: string | null
  bio: string | null
  is_private: boolean
  plan: string
  preferences: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface Workspace {
  id: string
  slug: string
  name: string
  description: string | null
  logo_url: string | null
  owner_id: string | null
  settings: Record<string, unknown>
  is_personal: boolean
  created_at: string
  updated_at: string
}

export interface WorkspaceWithCounts extends Workspace {
  member_count: number
  project_count: number
  role: WorkspaceRole
}

export interface WorkspaceMember {
  id: string
  workspace_id: string
  user_id: string
  role: WorkspaceRole
  invited_by: string | null
  invited_at: string | null
  joined_at: string
  created_at: string
  updated_at: string
  // Joined data
  profile?: Profile
}

export interface WorkspaceInvitation {
  id: string
  workspace_id: string
  email: string
  role: WorkspaceRole
  token: string
  invited_by: string | null
  status: InvitationStatus
  expires_at: string
  accepted_at: string | null
  created_at: string
}

export interface Project {
  id: string
  workspace_id: string
  slug: string
  project_key: string
  name: string
  description: string | null
  status: ProjectStatus
  cover_url: string | null
  icon: string | null
  owner_id: string | null
  settings: Record<string, unknown>
  default_assignee_id: string | null
  task_sequence: number
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface BoardColumn {
  id: string
  project_id: string
  name: string
  description: string | null
  color: string
  position: number
  is_done_column: boolean
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface TaskLabel {
  id: string
  project_id: string
  name: string
  color: string
  description: string | null
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  project_id: string
  column_id: string | null
  parent_task_id: string | null
  task_number: number
  task_key: string
  title: string
  description: TiptapContent | null
  assignee_id: string | null
  reporter_id: string | null
  priority: TaskPriority
  position: number
  due_date: string | null
  start_date: string | null
  estimated_hours: number | null
  completed_at: string | null
  created_at: string
  updated_at: string
  // Joined data
  assignee?: Profile
  reporter?: Profile
  labels?: TaskLabel[]
  subtask_count?: number
  comment_count?: number
}

export interface TaskLabelAssignment {
  task_id: string
  label_id: string
  created_at: string
}

export interface Comment {
  id: string
  task_id: string
  author_id: string
  content: TiptapContent
  parent_comment_id: string | null
  is_edited: boolean
  created_at: string
  updated_at: string
  // Joined data
  author?: Profile
  replies?: Comment[]
}

export interface ActivityLog {
  id: string
  workspace_id: string | null
  project_id: string | null
  task_id: string | null
  user_id: string | null
  action_type: string
  action_data: Record<string, unknown>
  created_at: string
  // Joined data
  user?: Profile
}

export interface UserAsset {
  id: string
  owner_id: string | null
  workspace_id: string | null
  project_id: string | null
  task_id: string | null
  name: string
  original_name: string | null
  poster_url: string | null
  asset_url: string
  size: number
  asset_type: string
  mime_type: string | null
  is_private: boolean
  asset_data: Record<string, unknown>
  created_at: string
  updated_at: string
}

// Tiptap rich text content
export interface TiptapContent {
  type: "doc"
  content?: TiptapNode[]
}

export interface TiptapNode {
  type: string
  attrs?: Record<string, unknown>
  content?: TiptapNode[]
  marks?: TiptapMark[]
  text?: string
}

export interface TiptapMark {
  type: string
  attrs?: Record<string, unknown>
}

// Board data structure (from get_project_board function)
export interface BoardData {
  project: Project
  columns: BoardColumnWithTasks[]
  labels: TaskLabel[]
  members: MemberInfo[]
}

export interface BoardColumnWithTasks extends BoardColumn {
  tasks: TaskCard[]
}

export interface TaskCard {
  id: string
  task_key: string
  title: string
  priority: TaskPriority
  position: number
  due_date: string | null
  assignee: MemberInfo | null
  labels: TaskLabel[]
  subtask_count: number
  comment_count: number
}

export interface MemberInfo {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  role?: WorkspaceRole
}

// Form types
export interface CreateWorkspaceInput {
  name: string
  slug?: string
  description?: string
}

export interface CreateProjectInput {
  workspace_id: string
  name: string
  project_key: string
  description?: string
}

export interface CreateTaskInput {
  project_id: string
  title: string
  description?: TiptapContent
  column_id?: string
  assignee_id?: string
  priority?: TaskPriority
  due_date?: string
  parent_task_id?: string
}

export interface UpdateTaskInput {
  id: string
  title?: string
  description?: TiptapContent
  column_id?: string
  assignee_id?: string | null
  priority?: TaskPriority
  due_date?: string | null
  position?: number
}

export interface MoveTaskInput {
  task_id: string
  column_id: string
  position: number
}

export interface CreateCommentInput {
  task_id: string
  content: TiptapContent
  parent_comment_id?: string
}

export interface InviteMemberInput {
  workspace_id: string
  email: string
  role?: WorkspaceRole
}
