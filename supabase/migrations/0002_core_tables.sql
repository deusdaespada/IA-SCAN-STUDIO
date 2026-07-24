-- ============================================================
-- AI SCAN STUDIO — Migration 0002
-- Tabelas principais: profiles, projects, chapters, pages
-- ============================================================

-- PERFIS (estende auth.users do Supabase)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  full_name text,
  avatar_url text,
  plan subscription_plan not null default 'free',
  storage_used_bytes bigint not null default 0,
  storage_limit_bytes bigint not null default 2147483648, -- 2GB no plano free
  ai_tokens_used bigint not null default 0,
  ai_tokens_limit bigint not null default 100000,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at_profiles before update on public.profiles
  for each row execute function extensions.moddatetime('updated_at');

-- Cria automaticamente um profile quando um novo usuário se registra
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- PROJETOS
create table public.projects (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  description text,
  cover_url text,
  work_type work_type not null default 'manga',
  source_language text not null default 'ja',
  target_language text not null default 'pt-BR',
  author text,
  artist text,
  tags text[] not null default '{}',
  genres text[] not null default '{}',
  status project_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_projects_owner on public.projects(owner_id);
create index idx_projects_status on public.projects(status);
create trigger set_updated_at_projects before update on public.projects
  for each row execute function extensions.moddatetime('updated_at');

-- CAPÍTULOS
create table public.chapters (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  number numeric not null,
  title text,
  status project_status not null default 'draft',
  current_stage pipeline_stage not null default 'upload',
  page_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, number)
);

create index idx_chapters_project on public.chapters(project_id);
create trigger set_updated_at_chapters before update on public.chapters
  for each row execute function extensions.moddatetime('updated_at');

-- PÁGINAS
create table public.pages (
  id uuid primary key default uuid_generate_v4(),
  chapter_id uuid not null references public.chapters(id) on delete cascade,
  page_number int not null,
  original_image_url text not null,
  clean_image_url text,
  final_image_url text,
  width int,
  height int,
  qc_status qc_status not null default 'pending',
  current_stage pipeline_stage not null default 'upload',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (chapter_id, page_number)
);

create index idx_pages_chapter on public.pages(chapter_id);
create trigger set_updated_at_pages before update on public.pages
  for each row execute function extensions.moddatetime('updated_at');
