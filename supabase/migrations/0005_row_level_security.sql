-- ============================================================
-- AI SCAN STUDIO — Migration 0005
-- Row Level Security (RLS) — garante que cada usuário só
-- acesse os projetos aos quais possui permissão.
-- ============================================================

-- Função auxiliar: o usuário atual tem acesso ao projeto (dono ou membro)?
create or replace function public.has_project_access(p_project_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.projects p
    where p.id = p_project_id and p.owner_id = auth.uid()
  ) or exists (
    select 1 from public.project_members m
    where m.project_id = p_project_id and m.user_id = auth.uid()
  );
$$ language sql security definer stable;

-- Função auxiliar: o usuário atual pode editar o projeto (owner, admin, ou papel específico)?
create or replace function public.has_project_role(p_project_id uuid, p_roles project_role[])
returns boolean as $$
  select exists (
    select 1 from public.projects p
    where p.id = p_project_id and p.owner_id = auth.uid()
  ) or exists (
    select 1 from public.project_members m
    where m.project_id = p_project_id and m.user_id = auth.uid() and m.role = any(p_roles)
  );
$$ language sql security definer stable;

-- ==================== PROFILES ====================
alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- ==================== PROJECTS ====================
alter table public.projects enable row level security;

create policy "projects_select" on public.projects
  for select using (owner_id = auth.uid() or public.has_project_access(id));

create policy "projects_insert" on public.projects
  for insert with check (owner_id = auth.uid());

create policy "projects_update" on public.projects
  for update using (public.has_project_role(id, array['owner', 'admin']::project_role[]));

create policy "projects_delete" on public.projects
  for delete using (owner_id = auth.uid());

-- ==================== CHAPTERS ====================
alter table public.chapters enable row level security;

create policy "chapters_select" on public.chapters
  for select using (public.has_project_access(project_id));

create policy "chapters_insert" on public.chapters
  for insert with check (public.has_project_role(project_id, array['owner', 'admin']::project_role[]));

create policy "chapters_update" on public.chapters
  for update using (public.has_project_role(project_id, array['owner', 'admin', 'translator', 'reviewer', 'cleaner', 'typesetter', 'qc']::project_role[]));

create policy "chapters_delete" on public.chapters
  for delete using (public.has_project_role(project_id, array['owner', 'admin']::project_role[]));

-- ==================== PAGES ====================
alter table public.pages enable row level security;

create policy "pages_select" on public.pages
  for select using (
    exists (select 1 from public.chapters c where c.id = chapter_id and public.has_project_access(c.project_id))
  );

create policy "pages_insert" on public.pages
  for insert with check (
    exists (select 1 from public.chapters c where c.id = chapter_id and public.has_project_role(c.project_id, array['owner', 'admin']::project_role[]))
  );

create policy "pages_update" on public.pages
  for update using (
    exists (select 1 from public.chapters c where c.id = chapter_id and public.has_project_role(c.project_id, array['owner', 'admin', 'translator', 'reviewer', 'cleaner', 'typesetter', 'qc']::project_role[]))
  );

create policy "pages_delete" on public.pages
  for delete using (
    exists (select 1 from public.chapters c where c.id = chapter_id and public.has_project_role(c.project_id, array['owner', 'admin']::project_role[]))
  );

-- ==================== OCR / TRANSLATIONS / REVIEWS ====================
alter table public.ocr_results enable row level security;
alter table public.translations enable row level security;
alter table public.reviews enable row level security;

create policy "ocr_all_access" on public.ocr_results
  for all using (
    exists (
      select 1 from public.pages pg join public.chapters c on c.id = pg.chapter_id
      where pg.id = page_id and public.has_project_access(c.project_id)
    )
  );

create policy "translations_all_access" on public.translations
  for all using (
    exists (
      select 1 from public.ocr_results o join public.pages pg on pg.id = o.page_id join public.chapters c on c.id = pg.chapter_id
      where o.id = ocr_result_id and public.has_project_access(c.project_id)
    )
  );

create policy "reviews_all_access" on public.reviews
  for all using (
    exists (
      select 1 from public.translations t
      join public.ocr_results o on o.id = t.ocr_result_id
      join public.pages pg on pg.id = o.page_id
      join public.chapters c on c.id = pg.chapter_id
      where t.id = translation_id and public.has_project_access(c.project_id)
    )
  );

-- ==================== CLEANING / REDRAW / TYPESETTING / QC ====================
alter table public.cleaning_jobs enable row level security;
alter table public.redraw_jobs enable row level security;
alter table public.typesetting enable row level security;
alter table public.qc_results enable row level security;

create policy "cleaning_jobs_access" on public.cleaning_jobs
  for all using (
    exists (select 1 from public.pages pg join public.chapters c on c.id = pg.chapter_id where pg.id = page_id and public.has_project_access(c.project_id))
  );

create policy "redraw_jobs_access" on public.redraw_jobs
  for all using (
    exists (
      select 1 from public.cleaning_jobs cj join public.pages pg on pg.id = cj.page_id join public.chapters c on c.id = pg.chapter_id
      where cj.id = cleaning_job_id and public.has_project_access(c.project_id)
    )
  );

create policy "typesetting_access" on public.typesetting
  for all using (
    exists (
      select 1 from public.ocr_results o join public.pages pg on pg.id = o.page_id join public.chapters c on c.id = pg.chapter_id
      where o.id = ocr_result_id and public.has_project_access(c.project_id)
    )
  );

create policy "qc_results_access" on public.qc_results
  for all using (
    exists (select 1 from public.pages pg join public.chapters c on c.id = pg.chapter_id where pg.id = page_id and public.has_project_access(c.project_id))
  );

-- ==================== GLOSSARY / TRANSLATION MEMORY ====================
alter table public.glossaries enable row level security;
alter table public.translation_memory enable row level security;

create policy "glossaries_access" on public.glossaries
  for all using (public.has_project_access(project_id));

create policy "tm_access" on public.translation_memory
  for all using (public.has_project_access(project_id));

-- ==================== AI JOBS / USAGE / KEYS ====================
alter table public.ai_jobs enable row level security;
alter table public.ai_usage enable row level security;
alter table public.ai_provider_keys enable row level security;

create policy "ai_jobs_access" on public.ai_jobs
  for all using (public.has_project_access(project_id));

create policy "ai_usage_select_own" on public.ai_usage
  for select using (user_id = auth.uid());

create policy "ai_usage_insert_own" on public.ai_usage
  for insert with check (user_id = auth.uid());

create policy "ai_keys_owner_only" on public.ai_provider_keys
  for all using (user_id = auth.uid());

-- ==================== MEMBERS / NOTIFICATIONS / AUDIT / EXPORTS ====================
alter table public.project_members enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;
alter table public.exports enable row level security;

create policy "members_select" on public.project_members
  for select using (public.has_project_access(project_id));

create policy "members_manage" on public.project_members
  for all using (public.has_project_role(project_id, array['owner', 'admin']::project_role[]));

create policy "notifications_owner_only" on public.notifications
  for all using (user_id = auth.uid());

create policy "audit_logs_select" on public.audit_logs
  for select using (project_id is null or public.has_project_access(project_id));

create policy "exports_access" on public.exports
  for all using (public.has_project_access(project_id));
