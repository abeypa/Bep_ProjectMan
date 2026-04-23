-- Add role to profiles
alter table public.profiles add column if not exists role text default 'user' check (role in ('admin', 'user'));

-- Update handle_new_auth_user to set default role
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
    
    -- Create profile with role
    insert into public.profiles (id, full_name, username, avatar_url, role)
    values (
        new.id, 
        coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
        new_username,
        new.raw_user_meta_data ->> 'avatar_url',
        'user' -- Default role
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
