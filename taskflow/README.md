# TaskFlow

A modern, open-source multi-project task management application built with React, Supabase, and Cloudflare. Think Jira/Linear/Plane-lite with real-time collaboration features.

![TaskFlow](https://via.placeholder.com/1200x600/1a1a2e/ffffff?text=TaskFlow+Preview)

## Features

### 🏢 Workspaces & Teams
- Create multiple workspaces for different teams/organizations
- Role-based access control (Owner, Admin, Member, Viewer)
- Invite members via email with secure invitation links
- Personal workspace automatically created for each user

### 📋 Projects
- Create unlimited projects within each workspace
- Customizable project keys (e.g., PROJ-123)
- Project icons and descriptions
- Archive projects when no longer needed

### ✅ Tasks
- **Kanban Board** - Drag-and-drop task management
- **List View** - Traditional list format (coming soon)
- **Table View** - Spreadsheet-style view (coming soon)
- Task properties: title, description, assignee, priority, due date, labels
- Subtasks for breaking down complex tasks
- Rich text descriptions with Tiptap editor

### 💬 Real-time Collaboration
- Live task updates across all connected clients
- Real-time comments on tasks
- Activity log for tracking changes

### 🎨 Modern UI/UX
- Dark mode by default
- Responsive design for mobile and desktop
- Clean, minimal interface inspired by Linear
- Built with Tailwind CSS and shadcn/ui components

## Tech Stack

### Frontend
- **React 18** - UI library
- **Vite** - Build tool & dev server
- **TypeScript** - Type safety
- **TailwindCSS** - Utility-first styling
- **shadcn/ui** - UI component library
- **TanStack Query** - Data fetching & caching
- **Zustand** - State management
- **@dnd-kit** - Drag and drop
- **Tiptap** - Rich text editor
- **Lucide** - Icons

### Backend
- **Supabase** - PostgreSQL database, Auth, Real-time subscriptions
- **Cloudflare Workers** - API proxy & asset management
- **Cloudflare R2** - Asset storage

## Project Structure

```
taskflow/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── ui/          # Base UI components (Button, Input, etc.)
│   │   │   ├── layout/      # Layout components (Sidebar, Header)
│   │   │   ├── auth/        # Authentication components
│   │   │   ├── board/       # Kanban board components
│   │   │   ├── task/        # Task detail components
│   │   │   └── common/      # Shared components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # Utilities and configurations
│   │   ├── pages/           # Page components
│   │   ├── store/           # Zustand store
│   │   └── types/           # TypeScript types
│   ├── public/              # Static assets
│   └── package.json
├── cf-worker/               # Cloudflare Worker (API proxy)
│   └── src/
│       └── worker.ts
├── starter.sql              # Database schema
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account (free tier works)
- Cloudflare account (for deployment)

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/taskflow.git
cd taskflow
```

### 2. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)

2. Go to SQL Editor and run the `starter.sql` script to create all tables, functions, and policies

3. Get your project credentials from Settings > API:
   - Project URL
   - Anon (public) key
   - JWT Secret (for the worker)

4. Configure Authentication providers (optional):
   - Go to Authentication > Providers
   - Enable Google and/or GitHub OAuth

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your Supabase credentials
# VITE_SUPABASE_URL=https://your-project.supabase.co
# VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Deployment

### Deploy Frontend to Cloudflare Pages

1. Push your code to GitHub

2. Go to [Cloudflare Pages](https://pages.cloudflare.com/)

3. Create a new project and connect your repository

4. Configure build settings:
   - **Framework preset**: None (or Vite)
   - **Build command**: `cd frontend && npm install && npm run build`
   - **Build output directory**: `frontend/dist`

5. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_WORKER_URL` (optional, if using worker proxy)

6. Deploy!

### Deploy Worker to Cloudflare (Optional)

The Cloudflare Worker acts as a proxy to Supabase and handles asset management.

1. Navigate to the worker directory:
   ```bash
   cd cf-worker
   ```

2. Copy and configure wrangler.toml:
   ```bash
   cp wrangler.sample.toml wrangler.toml
   ```

3. Update wrangler.toml with your settings:
   ```toml
   name = "taskflow-api"
   account_id = "your-cloudflare-account-id"
   
   [vars]
   SUPABASE_URL = "https://your-project.supabase.co"
   SUPABASE_ANON_TOKEN = "your-anon-key"
   ```

4. Create R2 bucket for assets:
   ```bash
   npx wrangler r2 bucket create taskflow-assets
   ```

5. Set secrets:
   ```bash
   npx wrangler secret put SUPABASE_JWT_SECRET
   ```

6. Deploy:
   ```bash
   npm run deploy
   ```

## Database Schema

### Tables

| Table | Description |
|-------|-------------|
| `profiles` | User profiles linked to auth.users |
| `workspaces` | Team/organization workspaces |
| `workspace_members` | Workspace membership with roles |
| `workspace_invitations` | Pending invitations |
| `projects` | Projects within workspaces |
| `board_columns` | Kanban columns for each project |
| `tasks` | Task items |
| `task_labels` | Labels for categorizing tasks |
| `task_label_assignments` | Task-label relationships |
| `comments` | Comments on tasks |
| `activity_log` | Audit log for all actions |
| `user_assets` | Uploaded files and images |

### Row Level Security

All tables have RLS policies enforcing:
- Workspace-level isolation
- Role-based access (owner > admin > member > viewer)
- Proper cascade on deletion

## API Reference

### Supabase Functions (RPC)

| Function | Description |
|----------|-------------|
| `create_workspace(name, slug?, description?)` | Create a new workspace |
| `invite_workspace_member(ws_id, email, role?)` | Invite a member |
| `accept_workspace_invitation(token)` | Accept an invitation |
| `create_project(ws_id, name, key, description?)` | Create a project |
| `create_task(proj_id, title, ...)` | Create a task |
| `move_task(task_id, column_id, position)` | Move task to column |
| `add_comment(task_id, content, parent_id?)` | Add a comment |
| `get_project_board(proj_id)` | Get full board data |
| `get_workspaces_with_counts()` | Get workspaces with stats |

### Real-time Subscriptions

The app subscribes to real-time changes on:
- `tasks` - Task updates, creations, deletions
- `comments` - New comments
- `board_columns` - Column changes
- `activity_log` - Activity updates

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

- [Supabase](https://supabase.com) - Backend infrastructure
- [Cloudflare](https://cloudflare.com) - Edge hosting and storage
- [shadcn/ui](https://ui.shadcn.com) - UI components
- [Linear](https://linear.app) - Design inspiration
