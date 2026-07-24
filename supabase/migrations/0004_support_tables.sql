-- ============================================================
-- AI SCAN STUDIO — Migration 0004
-- Glossário, memória de tradução, fila de jobs de IA,
-- colaboração, notificações, auditoria, exportações,
-- chaves de IA dos usuários
-- ============================================================

-- GLOSSÁRIO por projeto
create table public.glossaries (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  term_original text not null,
  term_translated text not null,
  category text default 'other' check (category in ('character', 'technique', 'organization', 'place', 'item', 'other')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, term_original)
);

create index idx_glossary_project on public.glossaries(project_id);
create trigger set_updated_at_glossary before update on public.glossaries
  for each row execute function extensions.moddatetime('updated_at');

-- MEMÓRIA DE TRADUÇÃO (pares originais/traduzidos reutilizáveis, com embeddings opcionais)
create table public.translation_memory (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  source_text text not null,
  target_text text not null,
  context text,
  usage_count int not null default 1,
  created_at timestamptz not null default now()
);

create index idx_tm_project on public.translation_memory(project_id);

-- FILA DE JOBS DE IA (unifica OCR, tradução, revisão, redraw, typesetting, QC, export)
create table public.ai_jobs (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  chapter_id uuid references public.chapters(id) on delete cascade,
  page_id uuid references public.pages(id) on delete cascade,
  stage pipeline_stage not null,
  status job_status not null default 'queued',
  priority int not null default 0,
  ai_provider ai_provider,
  ai_model text,
  attempts int not null default 0,
  max_attempts int not null default 3,
  error_message text,
  logs jsonb not null default '[]',
  payload jsonb not null default '{}',
  result jsonb,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_ai_jobs_status on public.ai_jobs(status);
create index idx_ai_jobs_project on public.ai_jobs(project_id);
create index idx_ai_jobs_chapter on public.ai_jobs(chapter_id);
create index idx_ai_jobs_priority on public.ai_jobs(priority desc, created_at asc);
create trigger set_updated_at_ai_jobs before update on public.ai_jobs
  for each row execute function extensions.moddatetime('updated_at');

-- USO DE IA (para métricas de dashboard e billing)
create table public.ai_usage (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  ai_provider ai_provider not null,
  ai_model text,
  operation text not null, -- 'ocr' | 'translation' | 'review' | 'redraw' | 'typesetting' | 'chat'
  input_tokens int not null default 0,
  output_tokens int not null default 0,
  cost_usd numeric(10, 6) default 0,
  created_at timestamptz not null default now()
);

create index idx_ai_usage_user on public.ai_usage(user_id);
create index idx_ai_usage_project on public.ai_usage(project_id);

-- CHAVES DE API DE IA DOS USUÁRIOS (armazenadas criptografadas — nunca em texto puro)
create table public.ai_provider_keys (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider ai_provider not null,
  encrypted_key text not null, -- criptografado com AES-256-GCM (ver src/lib/ai/crypto.ts)
  label text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (user_id, provider, label)
);

-- MEMBROS DO PROJETO (colaboração)
create table public.project_members (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role project_role not null default 'viewer',
  invited_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (project_id, user_id)
);

create index idx_members_project on public.project_members(project_id);
create index idx_members_user on public.project_members(user_id);

-- NOTIFICAÇÕES
create table public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  message text,
  type text not null default 'info' check (type in ('info', 'success', 'warning', 'error')),
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_notifications_user on public.notifications(user_id, read);

-- LOGS DE AUDITORIA
create table public.audit_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete set null,
  project_id uuid references public.projects(id) on delete cascade,
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb default '{}',
  created_at timestamptz not null default now()
);

create index idx_audit_project on public.audit_logs(project_id);

-- EXPORTAÇÕES
create table public.exports (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  chapter_id uuid references public.chapters(id) on delete cascade,
  format text not null check (format in ('zip', 'cbz', 'pdf', 'png', 'jpg', 'webp')),
  scope text not null check (scope in ('chapter', 'project')),
  status job_status not null default 'queued',
  file_url text,
  file_size_bytes bigint,
  requested_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  finished_at timestamptz
);

create index idx_exports_project on public.exports(project_id);
