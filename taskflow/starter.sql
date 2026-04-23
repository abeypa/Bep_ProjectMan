-- =============================================================================
-- TaskFlow - Extended Database Schema
-- A modern multi-tenant task management application
-- Based on supabase-cf-project-starter
-- =============================================================================

-- region Extensions
create extension if not exists moddatetime schema extensions;
create extension if not exists "uuid-ossp" schema extensions;
-- endregion

-- region Enums
-- Task priority levels
create type task_priority as enum ('none', 'low', 'medium', 'high', 'urgent');

-- Workspace member roles
create type workspace_role as enum ('owner', 'admin', 'member', 'viewer');

-- Project status
create type project_status as enum ('active', 'archived');

-- Invitation status
create type invitation_status as enum ('pending', 'accepted', 'expired', 'cancelled');
-- endregion

-- =============================================================================
-- region Core Tables
-- =============================================================================

-- Create a table for public profiles
create table if not exists public.profiles
(
    id uuid references auth.users on delete cascade not null primary key,
    updated_at timestamp with time zone not null default now(),
    created_at timestamp with time zone not null default now(),
    username text unique,
    full_name text,
    avatar_url text,
    website text,
    is_private boolean default false,
    bio text default '',
    plan text not null default 'free',
    preferences jsonb not null default '{}'::jsonb,
    constraint username_length check (char_length(username) >= 3)
);

-- Workspaces (Teams/Organizations)
create table if not exists public.workspaces
(
    id uuid not null primary key default extensions.uuid_generate_v4(),
    slug text unique not null,
    name text not null,
    description text,
    logo_url text,
    owner_id uuid references auth.users on delete set null,
    settings jsonb not null default '{}'::jsonb,
    is_personal boolean not null default false,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),
    constraint slug_length check (char_length(slug) >= 2)
);

-- Workspace Members
create table if not exists public.workspace_members
(
    id uuid not null primary key default extensions.uuid_generate_v4(),
    workspace_id uuid references workspaces on delete cascade not null,
    user_id uuid references auth.users on delete cascade not null,
    role workspace_role not null default 'member',
    invited_by uuid references auth.users on delete set null,
    invited_at timestamp with time zone,
    joined_at timestamp with time zone not null default now(),
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),
    unique(workspace_id, user_id)
);

-- Workspace Invitations
create table if not exists public.workspace_invitations
(
    id uuid not null primary key default extensions.uuid_generate_v4(),
    workspace_id uuid references workspaces on delete cascade not null,
    email text not null,
    role workspace_role not null default 'member',
    token text unique not null default encode(gen_random_bytes(32), 'hex'),
    invited_by uuid references auth.users on delete set null,
    status invitation_status not null default 'pending',
    expires_at timestamp with time zone not null default (now() + interval '7 days'),
    accepted_at timestamp with time zone,
    created_at timestamp with time zone not null default now(),
    unique(workspace_id, email, status)
);

-- Projects within Workspaces
create table if not exists public.projects
(
    id uuid not null primary key default extensions.uuid_generate_v4(),
    workspace_id uuid references workspaces on delete cascade not null,
    slug text not null,
    project_key text not null, -- e.g., "TASK", "PROJ" for task prefixes
    name text not null default 'Untitled Project',
    description text,
    status project_status not null default 'active',
    cover_url text,
    icon text, -- Emoji or icon identifier
    owner_id uuid references auth.users on delete set null,
    settings jsonb not null default '{}'::jsonb,
    default_assignee_id uuid references auth.users on delete set null,
    task_sequence integer not null default 0, -- For generating task numbers
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),
    deleted_at timestamp with time zone default null,
    unique(workspace_id, slug),
    unique(workspace_id, project_key),
    constraint slug_length check (char_length(slug) >= 2),
    constraint project_key_format check (project_key ~ '^[A-Z]{2,5}$')
);

-- Board Columns (Kanban columns)
create table if not exists public.board_columns
(
    id uuid not null primary key default extensions.uuid_generate_v4(),
    project_id uuid references projects on delete cascade not null,
    name text not null,
    description text,
    color text default '#6366f1', -- Indigo default
    position integer not null default 0,
    is_done_column boolean not null default false,
    is_default boolean not null default false,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now()
);

-- Task Labels
create table if not exists public.task_labels
(
    id uuid not null primary key default extensions.uuid_generate_v4(),
    project_id uuid references projects on delete cascade not null,
    name text not null,
    color text not null default '#6366f1',
    description text,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),
    unique(project_id, name)
);

-- Tasks
create table if not exists public.tasks
(
    id uuid not null primary key default extensions.uuid_generate_v4(),
    project_id uuid references projects on delete cascade not null,
    column_id uuid references board_columns on delete set null,
    parent_task_id uuid references tasks on delete cascade,
    task_number integer not null, -- Auto-generated per project
    task_key text not null, -- Set by trigger: PROJECT_KEY-NUMBER
    title text not null,
    description jsonb, -- Rich text as JSON (Tiptap format)
    assignee_id uuid references auth.users on delete set null,
    reporter_id uuid references auth.users on delete set null,
    priority task_priority not null default 'none',
    position numeric not null default 0, -- For ordering within column
    due_date date,
    start_date date,
    estimated_hours numeric,
    completed_at timestamp with time zone,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),
    unique(project_id, task_number),
    unique(task_key)
);

-- Task Label Assignments (Many-to-Many)
create table if not exists public.task_label_assignments
(
    task_id uuid references tasks on delete cascade not null,
    label_id uuid references task_labels on delete cascade not null,
    created_at timestamp with time zone not null default now(),
    primary key (task_id, label_id)
);

-- Comments on Tasks
create table if not exists public.comments
(
    id uuid not null primary key default extensions.uuid_generate_v4(),
    task_id uuid references tasks on delete cascade not null,
    author_id uuid references auth.users on delete set null not null,
    content jsonb not null, -- Rich text as JSON
    parent_comment_id uuid references comments on delete cascade,
    is_edited boolean not null default false,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now()
);

-- Activity Log
create table if not exists public.activity_log
(
    id uuid not null primary key default extensions.uuid_generate_v4(),
    workspace_id uuid references workspaces on delete cascade,
    project_id uuid references projects on delete cascade,
    task_id uuid references tasks on delete cascade,
    user_id uuid references auth.users on delete set null,
    action_type text not null,
    action_data jsonb not null default '{}'::jsonb,
    created_at timestamp with time zone not null default now()
);

-- User Assets (from original schema)
create table if not exists public.user_assets
(
    id uuid not null primary key default extensions.uuid_generate_v4(),
    updated_at timestamp with time zone not null default now(),
    created_at timestamp with time zone not null default now(),
    owner_id uuid references auth.users on delete cascade,
    workspace_id uuid references workspaces on delete cascade,
    project_id uuid references projects on delete cascade,
    task_id uuid references tasks on delete cascade,
    asset_data jsonb not null default '{}'::jsonb,
    name text not null,
    original_name text,
    poster_url text,
    asset_url text not null,
    size bigint not null,
    asset_type text not null,
    mime_type text,
    is_private boolean not null default true,
    constraint owner_or_context check (owner_id is not null or workspace_id is not null or project_id is not null or task_id is not null)
);

-- endregion

-- =============================================================================
-- region Enable Row Level Security (RLS)
-- =============================================================================

alter table profiles enable row level security;
alter table workspaces enable row level security;
alter table workspace_members enable row level security;
alter table workspace_invitations enable row level security;
alter table projects enable row level security;
alter table board_columns enable row level security;
alter table task_labels enable row level security;
alter table tasks enable row level security;
alter table task_label_assignments enable row level security;
alter table comments enable row level security;
alter table activity_log enable row level security;
alter table user_assets enable row level security;

-- endregion

-- =============================================================================
-- region Access Control Functions
-- =============================================================================

-- Check if user is a member of a workspace
create or replace function public.is_workspace_member(ws_id uuid)
returns boolean as $$
begin
    return exists(
        select 1 from workspace_members 
        where workspace_id = ws_id 
        and user_id = auth.uid()
    );
end;
$$ language plpgsql security definer stable;

-- Get user's role in a workspace
create or replace function public.get_workspace_role(ws_id uuid)
returns workspace_role as $$
begin
    return (
        select role from workspace_members 
        where workspace_id = ws_id 
        and user_id = auth.uid()
    );
end;
$$ language plpgsql security definer stable;

-- Check if user can manage workspace (owner or admin)
create or replace function public.can_manage_workspace(ws_id uuid)
returns boolean as $$
begin
    return (
        select role in ('owner', 'admin') 
        from workspace_members 
        where workspace_id = ws_id 
        and user_id = auth.uid()
    );
end;
$$ language plpgsql security definer stable;

-- Check if user can edit in workspace (not viewer)
create or replace function public.can_edit_workspace(ws_id uuid)
returns boolean as $$
begin
    return (
        select role in ('owner', 'admin', 'member') 
        from workspace_members 
        where workspace_id = ws_id 
        and user_id = auth.uid()
    );
end;
$$ language plpgsql security definer stable;

-- Check if user can access project
create or replace function public.can_access_project(proj_id uuid)
returns boolean as $$
declare
    ws_id uuid;
begin
    select workspace_id into ws_id from projects where id = proj_id;
    return is_workspace_member(ws_id);
end;
$$ language plpgsql security definer stable;

-- Check if user can edit project
create or replace function public.can_edit_project(proj_id uuid)
returns boolean as $$
declare
    ws_id uuid;
begin
    select workspace_id into ws_id from projects where id = proj_id;
    return can_edit_workspace(ws_id);
end;
$$ language plpgsql security definer stable;

-- endregion

-- =============================================================================
-- region RLS Policies
-- =============================================================================

-- Profiles Policies
create policy "Public profiles are viewable by everyone"
    on profiles for select
    using (is_private = false);

create policy "Users can view their own profile"
    on profiles for select
    using (auth.uid() = id);

create policy "Users can update their own profile"
    on profiles for update
    using (auth.uid() = id);

-- Workspaces Policies
create policy "Workspace members can view workspace"
    on workspaces for select
    using (is_workspace_member(id));

create policy "Authenticated users can create workspaces"
    on workspaces for insert
    with check (auth.uid() is not null);

create policy "Workspace owners and admins can update workspace"
    on workspaces for update
    using (can_manage_workspace(id));

create policy "Workspace owners can delete workspace"
    on workspaces for delete
    using (get_workspace_role(id) = 'owner');

-- Workspace Members Policies
create policy "Workspace members can view membership"
    on workspace_members for select
    using (is_workspace_member(workspace_id));

create policy "Workspace admins can manage membership"
    on workspace_members for insert
    with check (can_manage_workspace(workspace_id));

create policy "Workspace admins can update membership"
    on workspace_members for update
    using (can_manage_workspace(workspace_id));

create policy "Workspace admins can delete membership"
    on workspace_members for delete
    using (can_manage_workspace(workspace_id) or user_id = auth.uid());

-- Workspace Invitations Policies
create policy "Workspace members can view invitations"
    on workspace_invitations for select
    using (is_workspace_member(workspace_id));

create policy "Workspace admins can create invitations"
    on workspace_invitations for insert
    with check (can_manage_workspace(workspace_id));

create policy "Workspace admins can update invitations"
    on workspace_invitations for update
    using (can_manage_workspace(workspace_id));

create policy "Workspace admins can delete invitations"
    on workspace_invitations for delete
    using (can_manage_workspace(workspace_id));

-- Projects Policies
create policy "Workspace members can view projects"
    on projects for select
    using (is_workspace_member(workspace_id) and deleted_at is null);

create policy "Workspace editors can create projects"
    on projects for insert
    with check (can_edit_workspace(workspace_id));

create policy "Workspace editors can update projects"
    on projects for update
    using (can_edit_workspace(workspace_id));

create policy "Workspace admins can delete projects"
    on projects for delete
    using (can_manage_workspace(workspace_id));

-- Board Columns Policies
create policy "Project members can view columns"
    on board_columns for select
    using (can_access_project(project_id));

create policy "Project editors can create columns"
    on board_columns for insert
    with check (can_edit_project(project_id));

create policy "Project editors can update columns"
    on board_columns for update
    using (can_edit_project(project_id));

create policy "Project editors can delete columns"
    on board_columns for delete
    using (can_edit_project(project_id));

-- Task Labels Policies
create policy "Project members can view labels"
    on task_labels for select
    using (can_access_project(project_id));

create policy "Project editors can create labels"
    on task_labels for insert
    with check (can_edit_project(project_id));

create policy "Project editors can update labels"
    on task_labels for update
    using (can_edit_project(project_id));

create policy "Project editors can delete labels"
    on task_labels for delete
    using (can_edit_project(project_id));

-- Tasks Policies
create policy "Project members can view tasks"
    on tasks for select
    using (can_access_project(project_id));

create policy "Project editors can create tasks"
    on tasks for insert
    with check (can_edit_project(project_id));

create policy "Project editors can update tasks"
    on tasks for update
    using (can_edit_project(project_id));

create policy "Project editors can delete tasks"
    on tasks for delete
    using (can_edit_project(project_id));

-- Task Label Assignments Policies
create policy "Project members can view label assignments"
    on task_label_assignments for select
    using (can_access_project((select project_id from tasks where id = task_id)));

create policy "Project editors can manage label assignments"
    on task_label_assignments for all
    using (can_edit_project((select project_id from tasks where id = task_id)));

-- Comments Policies
create policy "Project members can view comments"
    on comments for select
    using (can_access_project((select project_id from tasks where id = task_id)));

create policy "Project editors can create comments"
    on comments for insert
    with check (
        can_edit_project((select project_id from tasks where id = task_id))
        and auth.uid() = author_id
    );

create policy "Comment authors can update their comments"
    on comments for update
    using (auth.uid() = author_id);

create policy "Comment authors and admins can delete comments"
    on comments for delete
    using (
        auth.uid() = author_id 
        or can_manage_workspace((select workspace_id from projects where id = (select project_id from tasks where id = task_id)))
    );

-- Activity Log Policies
create policy "Workspace members can view activity"
    on activity_log for select
    using (
        (workspace_id is not null and is_workspace_member(workspace_id))
        or (project_id is not null and can_access_project(project_id))
    );

create policy "System can insert activity"
    on activity_log for insert
    with check (true);

-- User Assets Policies
create policy "Asset owners can view their assets"
    on user_assets for select
    using (
        owner_id = auth.uid()
        or (workspace_id is not null and is_workspace_member(workspace_id))
        or (project_id is not null and can_access_project(project_id))
        or is_private = false
    );

create policy "Authenticated users can create assets"
    on user_assets for insert
    with check (auth.uid() is not null);

create policy "Asset owners can update their assets"
    on user_assets for update
    using (owner_id = auth.uid());

create policy "Asset owners can delete their assets"
    on user_assets for delete
    using (owner_id = auth.uid());

-- endregion

-- =============================================================================
-- region Trigger Functions
-- =============================================================================

-- Create profile for new auth users
create or replace function public.handle_new_auth_user()
returns trigger as $$
declare
    new_username text;
    personal_ws_id uuid;
begin
    -- Generate username from email or metadata
    new_username := coalesce(
        new.raw_user_meta_data ->> 'username',
        split_part(new.email, '@', 1)
    );
    
    -- Ensure username uniqueness
    while exists(select 1 from profiles where username = new_username) loop
        new_username := new_username || substr(md5(random()::text), 0, 5);
    end loop;
    
    -- Create profile
    insert into public.profiles (id, full_name, username, avatar_url)
    values (
        new.id, 
        coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
        new_username,
        new.raw_user_meta_data ->> 'avatar_url'
    );
    
    -- Create personal workspace
    insert into public.workspaces (slug, name, owner_id, is_personal)
    values (
        'personal-' || substr(md5(new.id::text), 0, 8),
        'Personal',
        new.id,
        true
    )
    returning id into personal_ws_id;
    
    -- Add user as owner of personal workspace
    insert into public.workspace_members (workspace_id, user_id, role)
    values (personal_ws_id, new.id, 'owner');
    
    return new;
end;
$$ language plpgsql security definer;

-- Create default columns when project is created
create or replace function public.handle_new_project()
returns trigger as $$
begin
    -- Create default kanban columns
    insert into board_columns (project_id, name, position, color, is_default)
    values 
        (new.id, 'Backlog', 0, '#6b7280', true),
        (new.id, 'To Do', 1, '#3b82f6', false),
        (new.id, 'In Progress', 2, '#f59e0b', false),
        (new.id, 'In Review', 3, '#8b5cf6', false),
        (new.id, 'Done', 4, '#10b981', false);
    
    -- Mark Done as the done column
    update board_columns 
    set is_done_column = true 
    where project_id = new.id and name = 'Done';
    
    return new;
end;
$$ language plpgsql security definer;

-- Auto-generate task number
create or replace function public.handle_new_task()
returns trigger as $$
declare
    next_number integer;
    proj_key text;
begin
    -- Get next task number for this project
    update projects 
    set task_sequence = task_sequence + 1 
    where id = new.project_id
    returning task_sequence, project_key into next_number, proj_key;
    
    new.task_number := next_number;
    new.task_key := proj_key || '-' || next_number;
    new.reporter_id := coalesce(new.reporter_id, auth.uid());
    
    return new;
end;
$$ language plpgsql security definer;

-- Mark task as completed when moved to done column
create or replace function public.handle_task_column_change()
returns trigger as $$
begin
    if new.column_id is distinct from old.column_id then
        if exists(select 1 from board_columns where id = new.column_id and is_done_column = true) then
            new.completed_at := now();
        else
            new.completed_at := null;
        end if;
    end if;
    return new;
end;
$$ language plpgsql security definer;

-- Log activity
create or replace function public.log_activity(
    p_action_type text,
    p_action_data jsonb default '{}'::jsonb,
    p_workspace_id uuid default null,
    p_project_id uuid default null,
    p_task_id uuid default null
)
returns void as $$
begin
    insert into activity_log (workspace_id, project_id, task_id, user_id, action_type, action_data)
    values (p_workspace_id, p_project_id, p_task_id, auth.uid(), p_action_type, p_action_data);
end;
$$ language plpgsql security definer;

-- Task activity trigger
create or replace function public.handle_task_activity()
returns trigger as $$
declare
    ws_id uuid;
begin
    select workspace_id into ws_id from projects where id = new.project_id;
    
    if TG_OP = 'INSERT' then
        perform log_activity(
            'task.created',
            jsonb_build_object('task_key', new.task_key, 'title', new.title),
            ws_id, new.project_id, new.id
        );
    elsif TG_OP = 'UPDATE' then
        -- Log specific changes
        if new.column_id is distinct from old.column_id then
            perform log_activity(
                'task.moved',
                jsonb_build_object(
                    'task_key', new.task_key,
                    'from_column', (select name from board_columns where id = old.column_id),
                    'to_column', (select name from board_columns where id = new.column_id)
                ),
                ws_id, new.project_id, new.id
            );
        end if;
        if new.assignee_id is distinct from old.assignee_id then
            perform log_activity(
                'task.assigned',
                jsonb_build_object(
                    'task_key', new.task_key,
                    'assignee_id', new.assignee_id
                ),
                ws_id, new.project_id, new.id
            );
        end if;
    end if;
    
    return new;
end;
$$ language plpgsql security definer;

-- Comment activity trigger
create or replace function public.handle_comment_activity()
returns trigger as $$
declare
    ws_id uuid;
    proj_id uuid;
    t_key text;
begin
    select project_id into proj_id from tasks where id = new.task_id;
    select workspace_id into ws_id from projects where id = proj_id;
    select task_key into t_key from tasks where id = new.task_id;
    
    perform log_activity(
        'comment.created',
        jsonb_build_object('task_key', t_key),
        ws_id, proj_id, new.task_id
    );
    
    return new;
end;
$$ language plpgsql security definer;

-- Update timestamps
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at := now();
    return new;
end;
$$ language plpgsql;

-- endregion

-- =============================================================================
-- region Triggers
-- =============================================================================

-- Drop existing triggers if they exist (for re-running)
drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists on_project_created on projects;
drop trigger if exists on_task_created on tasks;
drop trigger if exists on_task_updated on tasks;
drop trigger if exists on_task_activity on tasks;
drop trigger if exists on_comment_created on comments;

-- Auth user trigger
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_auth_user();

-- Project trigger
create trigger on_project_created
    after insert on projects
    for each row execute procedure public.handle_new_project();

-- Task triggers
create trigger on_task_created
    before insert on tasks
    for each row execute procedure public.handle_new_task();

create trigger on_task_column_change
    before update on tasks
    for each row execute procedure public.handle_task_column_change();

create trigger on_task_activity
    after insert or update on tasks
    for each row execute procedure public.handle_task_activity();

-- Comment trigger
create trigger on_comment_created
    after insert on comments
    for each row execute procedure public.handle_comment_activity();

-- Updated_at triggers
create trigger handle_updated_at_profiles
    before update on profiles
    for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at_workspaces
    before update on workspaces
    for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at_workspace_members
    before update on workspace_members
    for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at_projects
    before update on projects
    for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at_board_columns
    before update on board_columns
    for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at_task_labels
    before update on task_labels
    for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at_tasks
    before update on tasks
    for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at_comments
    before update on comments
    for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at_user_assets
    before update on user_assets
    for each row execute procedure public.handle_updated_at();

-- endregion

-- =============================================================================
-- region Helper Functions (API)
-- =============================================================================

-- Create a new workspace
create or replace function public.create_workspace(
    ws_name text,
    ws_slug text default null,
    ws_description text default null
)
returns workspaces as $$
declare
    workspace workspaces;
    final_slug text;
begin
    -- Generate slug if not provided
    final_slug := coalesce(ws_slug, lower(regexp_replace(ws_name, '[^a-zA-Z0-9]+', '-', 'g')));
    
    -- Ensure slug uniqueness
    while exists(select 1 from workspaces where slug = final_slug) loop
        final_slug := final_slug || '-' || substr(md5(random()::text), 0, 5);
    end loop;
    
    -- Create workspace
    insert into workspaces (slug, name, description, owner_id)
    values (final_slug, ws_name, ws_description, auth.uid())
    returning * into workspace;
    
    -- Add creator as owner
    insert into workspace_members (workspace_id, user_id, role)
    values (workspace.id, auth.uid(), 'owner');
    
    return workspace;
end;
$$ language plpgsql security definer;

-- Invite member to workspace
create or replace function public.invite_workspace_member(
    ws_id uuid,
    member_email text,
    member_role workspace_role default 'member'
)
returns workspace_invitations as $$
declare
    invitation workspace_invitations;
    existing_user_id uuid;
begin
    -- Check if user is admin/owner
    if not can_manage_workspace(ws_id) then
        raise exception 'Not authorized to invite members';
    end if;
    
    -- Check if user already exists and is already a member
    select id into existing_user_id from auth.users where email = member_email;
    if existing_user_id is not null and exists(
        select 1 from workspace_members where workspace_id = ws_id and user_id = existing_user_id
    ) then
        raise exception 'User is already a member of this workspace';
    end if;
    
    -- Create invitation
    insert into workspace_invitations (workspace_id, email, role, invited_by)
    values (ws_id, member_email, member_role, auth.uid())
    returning * into invitation;
    
    return invitation;
end;
$$ language plpgsql security definer;

-- Accept workspace invitation
create or replace function public.accept_workspace_invitation(invitation_token text)
returns workspace_members as $$
declare
    inv workspace_invitations;
    member workspace_members;
begin
    -- Get invitation
    select * into inv from workspace_invitations 
    where token = invitation_token 
    and status = 'pending'
    and expires_at > now();
    
    if inv is null then
        raise exception 'Invalid or expired invitation';
    end if;
    
    -- Check if current user's email matches
    if (select email from auth.users where id = auth.uid()) != inv.email then
        raise exception 'Invitation is for a different email address';
    end if;
    
    -- Update invitation status
    update workspace_invitations 
    set status = 'accepted', accepted_at = now()
    where id = inv.id;
    
    -- Add member
    insert into workspace_members (workspace_id, user_id, role, invited_by, invited_at)
    values (inv.workspace_id, auth.uid(), inv.role, inv.invited_by, inv.created_at)
    returning * into member;
    
    return member;
end;
$$ language plpgsql security definer;

-- Create a new project
create or replace function public.create_project(
    ws_id uuid,
    proj_name text,
    proj_key text,
    proj_description text default null
)
returns projects as $$
declare
    project projects;
    proj_slug text;
begin
    -- Check permissions
    if not can_edit_workspace(ws_id) then
        raise exception 'Not authorized to create projects';
    end if;
    
    -- Generate slug
    proj_slug := lower(regexp_replace(proj_name, '[^a-zA-Z0-9]+', '-', 'g'));
    while exists(select 1 from projects where workspace_id = ws_id and slug = proj_slug) loop
        proj_slug := proj_slug || '-' || substr(md5(random()::text), 0, 5);
    end loop;
    
    -- Validate project key
    if not (proj_key ~ '^[A-Z]{2,5}$') then
        raise exception 'Project key must be 2-5 uppercase letters';
    end if;
    
    -- Create project
    insert into projects (workspace_id, slug, project_key, name, description, owner_id)
    values (ws_id, proj_slug, upper(proj_key), proj_name, proj_description, auth.uid())
    returning * into project;
    
    return project;
end;
$$ language plpgsql security definer;

-- Create a new task
create or replace function public.create_task(
    proj_id uuid,
    task_title text,
    task_description jsonb default null,
    task_column_id uuid default null,
    task_assignee_id uuid default null,
    task_priority task_priority default 'none',
    task_due_date date default null,
    task_parent_id uuid default null
)
returns tasks as $$
declare
    task tasks;
    default_column_id uuid;
    max_position numeric;
begin
    -- Check permissions
    if not can_edit_project(proj_id) then
        raise exception 'Not authorized to create tasks';
    end if;
    
    -- Get default column if not specified
    if task_column_id is null then
        select id into default_column_id 
        from board_columns 
        where project_id = proj_id and is_default = true
        limit 1;
        
        if default_column_id is null then
            select id into default_column_id 
            from board_columns 
            where project_id = proj_id
            order by position
            limit 1;
        end if;
        
        task_column_id := default_column_id;
    end if;
    
    -- Get max position in column
    select coalesce(max(position), 0) + 1 into max_position
    from tasks
    where column_id = task_column_id;
    
    -- Create task
    insert into tasks (
        project_id, column_id, parent_task_id, title, description,
        assignee_id, priority, due_date, position
    )
    values (
        proj_id, task_column_id, task_parent_id, task_title, task_description,
        task_assignee_id, task_priority, task_due_date, max_position
    )
    returning * into task;
    
    return task;
end;
$$ language plpgsql security definer;

-- Move task to different column
create or replace function public.move_task(
    t_id uuid,
    new_column_id uuid,
    new_position numeric
)
returns tasks as $$
declare
    task tasks;
begin
    -- Check permissions
    if not can_edit_project((select project_id from tasks where id = t_id)) then
        raise exception 'Not authorized to move tasks';
    end if;
    
    update tasks
    set column_id = new_column_id, position = new_position
    where id = t_id
    returning * into task;
    
    return task;
end;
$$ language plpgsql security definer;

-- Add comment to task
create or replace function public.add_comment(
    t_id uuid,
    comment_content jsonb,
    parent_id uuid default null
)
returns comments as $$
declare
    comment comments;
begin
    -- Check permissions
    if not can_edit_project((select project_id from tasks where id = t_id)) then
        raise exception 'Not authorized to comment';
    end if;
    
    insert into comments (task_id, author_id, content, parent_comment_id)
    values (t_id, auth.uid(), comment_content, parent_id)
    returning * into comment;
    
    return comment;
end;
$$ language plpgsql security definer;

-- Get workspace with member count
create or replace function public.get_workspaces_with_counts()
returns table (
    id uuid,
    slug text,
    name text,
    description text,
    logo_url text,
    is_personal boolean,
    member_count bigint,
    project_count bigint,
    role workspace_role,
    created_at timestamp with time zone
) as $$
begin
    return query
    select 
        w.id,
        w.slug,
        w.name,
        w.description,
        w.logo_url,
        w.is_personal,
        (select count(*) from workspace_members wm where wm.workspace_id = w.id) as member_count,
        (select count(*) from projects p where p.workspace_id = w.id and p.deleted_at is null) as project_count,
        (select wm.role from workspace_members wm where wm.workspace_id = w.id and wm.user_id = auth.uid()) as role,
        w.created_at
    from workspaces w
    where is_workspace_member(w.id)
    order by w.created_at desc;
end;
$$ language plpgsql security definer stable;

-- Get project board data
create or replace function public.get_project_board(proj_id uuid)
returns jsonb as $$
declare
    result jsonb;
begin
    if not can_access_project(proj_id) then
        raise exception 'Not authorized to view project';
    end if;
    
    select jsonb_build_object(
        'project', (select row_to_json(p) from projects p where p.id = proj_id),
        'columns', (
            select coalesce(jsonb_agg(
                jsonb_build_object(
                    'id', bc.id,
                    'name', bc.name,
                    'color', bc.color,
                    'position', bc.position,
                    'is_done_column', bc.is_done_column,
                    'tasks', (
                        select coalesce(jsonb_agg(
                            jsonb_build_object(
                                'id', t.id,
                                'task_key', t.task_key,
                                'title', t.title,
                                'priority', t.priority,
                                'position', t.position,
                                'due_date', t.due_date,
                                'assignee', (
                                    select jsonb_build_object(
                                        'id', p.id,
                                        'username', p.username,
                                        'full_name', p.full_name,
                                        'avatar_url', p.avatar_url
                                    )
                                    from profiles p where p.id = t.assignee_id
                                ),
                                'labels', (
                                    select coalesce(jsonb_agg(
                                        jsonb_build_object(
                                            'id', tl.id,
                                            'name', tl.name,
                                            'color', tl.color
                                        )
                                    ), '[]'::jsonb)
                                    from task_labels tl
                                    join task_label_assignments tla on tl.id = tla.label_id
                                    where tla.task_id = t.id
                                ),
                                'subtask_count', (
                                    select count(*) from tasks st where st.parent_task_id = t.id
                                ),
                                'comment_count', (
                                    select count(*) from comments c where c.task_id = t.id
                                )
                            )
                            order by t.position
                        ), '[]'::jsonb)
                        from tasks t
                        where t.column_id = bc.id
                        and t.parent_task_id is null
                    )
                )
                order by bc.position
            ), '[]'::jsonb)
            from board_columns bc
            where bc.project_id = proj_id
        ),
        'labels', (
            select coalesce(jsonb_agg(row_to_json(tl)), '[]'::jsonb)
            from task_labels tl
            where tl.project_id = proj_id
        ),
        'members', (
            select coalesce(jsonb_agg(
                jsonb_build_object(
                    'id', p.id,
                    'username', p.username,
                    'full_name', p.full_name,
                    'avatar_url', p.avatar_url,
                    'role', wm.role
                )
            ), '[]'::jsonb)
            from workspace_members wm
            join profiles p on p.id = wm.user_id
            where wm.workspace_id = (select workspace_id from projects where id = proj_id)
        )
    ) into result;
    
    return result;
end;
$$ language plpgsql security definer stable;

-- endregion

-- =============================================================================
-- region Indexes
-- =============================================================================

create index if not exists idx_profiles_username on profiles (username);
create index if not exists idx_workspaces_slug on workspaces (slug);
create index if not exists idx_workspaces_owner on workspaces (owner_id);
create index if not exists idx_workspace_members_workspace on workspace_members (workspace_id);
create index if not exists idx_workspace_members_user on workspace_members (user_id);
create index if not exists idx_workspace_invitations_token on workspace_invitations (token);
create index if not exists idx_workspace_invitations_email on workspace_invitations (email);
create index if not exists idx_projects_workspace on projects (workspace_id);
create index if not exists idx_projects_slug on projects (workspace_id, slug);
create index if not exists idx_projects_owner on projects (owner_id);
create index if not exists idx_board_columns_project on board_columns (project_id);
create index if not exists idx_task_labels_project on task_labels (project_id);
create index if not exists idx_tasks_project on tasks (project_id);
create index if not exists idx_tasks_column on tasks (column_id);
create index if not exists idx_tasks_assignee on tasks (assignee_id);
create index if not exists idx_tasks_parent on tasks (parent_task_id);
create index if not exists idx_tasks_position on tasks (column_id, position);
create index if not exists idx_comments_task on comments (task_id);
create index if not exists idx_comments_author on comments (author_id);
create index if not exists idx_activity_workspace on activity_log (workspace_id);
create index if not exists idx_activity_project on activity_log (project_id);
create index if not exists idx_activity_task on activity_log (task_id);
create index if not exists idx_activity_created on activity_log (created_at desc);
create index if not exists idx_user_assets_owner on user_assets (owner_id);
create index if not exists idx_user_assets_workspace on user_assets (workspace_id);
create index if not exists idx_user_assets_project on user_assets (project_id);
create index if not exists idx_user_assets_task on user_assets (task_id);

-- endregion

-- =============================================================================
-- region Realtime Configuration
-- =============================================================================

-- Enable realtime for specific tables
alter publication supabase_realtime add table tasks;
alter publication supabase_realtime add table comments;
alter publication supabase_realtime add table board_columns;
alter publication supabase_realtime add table activity_log;

-- endregion