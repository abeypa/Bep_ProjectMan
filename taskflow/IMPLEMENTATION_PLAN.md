# TaskFlow - Implementation Plan

## Project Overview
Transform the supabase-cf-project-starter into a modern, multi-tenant task management application (Jira/Linear/Plane-lite clone).

## Current State Analysis

### Existing Tables
- `profiles` - User profiles linked to auth.users
- `projects` - Generic project storage with JSONB data
- `project_versions` - Automatic backups of project data
- `user_assets` - Asset storage with R2 integration

### Existing Worker Features
- Supabase proxy with custom domain support
- User asset upload/download/delete
- Image management for avatars and posters
- JWT verification

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Cloudflare Pages                         │
│                  (React + Vite Frontend)                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Cloudflare Workers                         │
│          (API Proxy + Asset Management)                     │
└─────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   Supabase DB   │  │ Supabase Auth   │  │  Cloudflare R2  │
│   (PostgreSQL)  │  │  (JWT/OAuth)    │  │    (Assets)     │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

## Database Schema Design

### New Tables

1. **workspaces**
   - id, slug, name, description, logo_url
   - owner_id, created_at, updated_at
   - settings (JSONB for workspace preferences)

2. **workspace_members**
   - id, workspace_id, user_id, role (owner/admin/member/viewer)
   - invited_by, invited_at, joined_at
   
3. **workspace_invitations**
   - id, workspace_id, email, role, token
   - invited_by, expires_at, accepted_at

4. **projects** (modified)
   - Add workspace_id foreign key
   - Add project_key (e.g., "PROJ") for task prefixes
   - Add status (active/archived)
   - Add cover_url (for project covers)

5. **board_columns**
   - id, project_id, name, position, color
   - is_done_column (boolean)
   
6. **tasks**
   - id, project_id, column_id, task_number
   - title, description (rich text as JSON)
   - assignee_id, reporter_id
   - priority (urgent/high/medium/low/none)
   - status, due_date, start_date
   - position (for ordering within column)
   - parent_task_id (for subtasks)
   - created_at, updated_at

7. **task_labels**
   - id, project_id, name, color, description

8. **task_label_assignments**
   - task_id, label_id

9. **comments**
   - id, task_id, author_id, content
   - parent_comment_id (for threads)
   - created_at, updated_at

10. **activity_log**
    - id, workspace_id, project_id, task_id
    - user_id, action_type, action_data (JSONB)
    - created_at

### RLS Policies Strategy

- Workspace-level isolation
- Role-based access (owner > admin > member > viewer)
- Public/private workspace support
- Invitation-based membership

## Frontend Structure

```
frontend/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── vite-env.d.ts
│   ├── index.css
│   ├── components/
│   │   ├── ui/                    # shadcn/ui components
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── MainLayout.tsx
│   │   │   └── WorkspaceSelector.tsx
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── SignupForm.tsx
│   │   │   └── AuthGuard.tsx
│   │   ├── workspace/
│   │   │   ├── WorkspaceSettings.tsx
│   │   │   ├── WorkspaceMembers.tsx
│   │   │   └── InviteMemberModal.tsx
│   │   ├── project/
│   │   │   ├── ProjectList.tsx
│   │   │   ├── ProjectCard.tsx
│   │   │   ├── CreateProjectModal.tsx
│   │   │   └── ProjectSettings.tsx
│   │   ├── board/
│   │   │   ├── KanbanBoard.tsx
│   │   │   ├── BoardColumn.tsx
│   │   │   ├── TaskCard.tsx
│   │   │   └── CreateTaskModal.tsx
│   │   ├── task/
│   │   │   ├── TaskDetail.tsx
│   │   │   ├── TaskList.tsx
│   │   │   ├── TaskTable.tsx
│   │   │   ├── TaskComments.tsx
│   │   │   └── SubtaskList.tsx
│   │   └── common/
│   │       ├── Avatar.tsx
│   │       ├── Badge.tsx
│   │       ├── DatePicker.tsx
│   │       ├── RichTextEditor.tsx
│   │       └── FileUpload.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useWorkspace.ts
│   │   ├── useProjects.ts
│   │   ├── useTasks.ts
│   │   ├── useComments.ts
│   │   └── useRealtimeSubscription.ts
│   ├── lib/
│   │   ├── supabase.ts
│   │   ├── api.ts
│   │   ├── utils.ts
│   │   └── constants.ts
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── Login.tsx
│   │   │   ├── Signup.tsx
│   │   │   └── ResetPassword.tsx
│   │   ├── workspace/
│   │   │   ├── WorkspaceHome.tsx
│   │   │   └── WorkspaceSettings.tsx
│   │   ├── project/
│   │   │   ├── ProjectBoard.tsx
│   │   │   ├── ProjectList.tsx
│   │   │   ├── ProjectTable.tsx
│   │   │   └── ProjectSettings.tsx
│   │   └── task/
│   │       └── TaskModal.tsx
│   ├── store/
│   │   └── index.ts              # Zustand store
│   └── types/
│       ├── database.ts           # Generated Supabase types
│       └── index.ts
├── public/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── postcss.config.js
```

## Implementation Steps

### Phase 1: Database Schema
1. Create new tables for workspaces, tasks, etc.
2. Add RLS policies for multi-tenant isolation
3. Create helper functions for access control
4. Set up triggers for activity logging

### Phase 2: Frontend Foundation
1. Initialize Vite + React project
2. Configure Tailwind CSS + shadcn/ui
3. Set up Supabase client
4. Implement authentication flow
5. Create layout components

### Phase 3: Workspace & Project Management
1. Workspace CRUD operations
2. Member invitation system
3. Project management within workspaces
4. Board column customization

### Phase 4: Task Management
1. Kanban board with drag-and-drop
2. Task CRUD operations
3. Task list and table views
4. Rich text editor for descriptions
5. File attachments using existing asset system

### Phase 5: Real-time Features
1. Supabase Realtime subscriptions
2. Live task updates on board
3. Real-time comments
4. Presence indicators

### Phase 6: Polish & Deploy
1. Dark mode implementation
2. Mobile responsive design
3. Optimistic updates
4. Error handling
5. Deployment configuration

## Key Technologies

- **Frontend**: React 18, Vite, TypeScript
- **Styling**: TailwindCSS, shadcn/ui
- **State**: Zustand + React Query (TanStack Query)
- **DnD**: @dnd-kit/core
- **Rich Text**: Tiptap
- **Icons**: Lucide React
- **Notifications**: Sonner
- **Backend**: Existing Cloudflare Worker + Supabase
- **Realtime**: Supabase Realtime

## Deployment

### Frontend (Cloudflare Pages)
- Build command: `npm run build`
- Output directory: `dist`
- Environment variables via Cloudflare dashboard

### Backend (Existing Setup)
- Keep existing Worker deployment flow
- Update starter.sql with new tables
- Run migrations via Supabase dashboard
