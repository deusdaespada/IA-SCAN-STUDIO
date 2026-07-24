-- ============================================================
-- AI SCAN STUDIO — Migration 0006
-- Buckets de Storage, políticas de acesso e funções auxiliares
-- para o dashboard (estatísticas agregadas).
-- ============================================================

-- Buckets: 'covers' (capas, público para leitura), 'pages' (páginas originais e processadas, privado),
-- 'exports' (arquivos finais exportados, privado)
insert into storage.buckets (id, name, public)
values
  ('covers', 'covers', true),
  ('pages', 'pages', false),
  ('exports', 'exports', false)
on conflict (id) do nothing;

-- Capas: qualquer usuário autenticado pode ler; apenas o dono do projeto pode escrever
-- (Convenção de path: covers/{project_id}/cover.ext)
create policy "covers_public_read" on storage.objects
  for select using (bucket_id = 'covers');

create policy "covers_owner_write" on storage.objects
  for insert with check (
    bucket_id = 'covers'
    and public.has_project_role((storage.foldername(name))[1]::uuid, array['owner', 'admin']::project_role[])
  );

create policy "covers_owner_update" on storage.objects
  for update using (
    bucket_id = 'covers'
    and public.has_project_role((storage.foldername(name))[1]::uuid, array['owner', 'admin']::project_role[])
  );

-- Páginas: apenas membros do projeto (Convenção de path: pages/{project_id}/{chapter_id}/{page_number}.ext)
create policy "pages_bucket_select" on storage.objects
  for select using (
    bucket_id = 'pages'
    and public.has_project_access((storage.foldername(name))[1]::uuid)
  );

create policy "pages_bucket_insert" on storage.objects
  for insert with check (
    bucket_id = 'pages'
    and public.has_project_role((storage.foldername(name))[1]::uuid, array['owner', 'admin', 'cleaner', 'typesetter']::project_role[])
  );

create policy "pages_bucket_update" on storage.objects
  for update using (
    bucket_id = 'pages'
    and public.has_project_role((storage.foldername(name))[1]::uuid, array['owner', 'admin', 'cleaner', 'typesetter']::project_role[])
  );

create policy "pages_bucket_delete" on storage.objects
  for delete using (
    bucket_id = 'pages'
    and public.has_project_role((storage.foldername(name))[1]::uuid, array['owner', 'admin']::project_role[])
  );

-- Exports: apenas membros do projeto (Convenção de path: exports/{project_id}/{export_id}.ext)
create policy "exports_bucket_select" on storage.objects
  for select using (
    bucket_id = 'exports'
    and public.has_project_access((storage.foldername(name))[1]::uuid)
  );

create policy "exports_bucket_insert" on storage.objects
  for insert with check (
    bucket_id = 'exports'
    and public.has_project_access((storage.foldername(name))[1]::uuid)
  );

-- ==================== FUNÇÕES DE ESTATÍSTICAS (dashboard) ====================

create or replace function public.get_dashboard_stats(p_user_id uuid)
returns jsonb as $$
declare
  result jsonb;
begin
  select jsonb_build_object(
    'total_projects', (
      select count(*) from public.projects p
      where p.owner_id = p_user_id
         or exists (select 1 from public.project_members m where m.project_id = p.id and m.user_id = p_user_id)
    ),
    'total_chapters', (
      select count(*) from public.chapters c
      join public.projects p on p.id = c.project_id
      where p.owner_id = p_user_id
         or exists (select 1 from public.project_members m where m.project_id = p.id and m.user_id = p_user_id)
    ),
    'total_pages', (
      select count(*) from public.pages pg
      join public.chapters c on c.id = pg.chapter_id
      join public.projects p on p.id = c.project_id
      where p.owner_id = p_user_id
         or exists (select 1 from public.project_members m where m.project_id = p.id and m.user_id = p_user_id)
    ),
    'total_translations', (
      select count(*) from public.translations t
      join public.ocr_results o on o.id = t.ocr_result_id
      join public.pages pg on pg.id = o.page_id
      join public.chapters c on c.id = pg.chapter_id
      join public.projects p on p.id = c.project_id
      where p.owner_id = p_user_id
    ),
    'ai_tokens_used', (select ai_tokens_used from public.profiles where id = p_user_id),
    'storage_used_bytes', (select storage_used_bytes from public.profiles where id = p_user_id),
    'queue_waiting', (select count(*) from public.ai_jobs j join public.projects p on p.id = j.project_id where p.owner_id = p_user_id and j.status = 'queued'),
    'queue_processing', (select count(*) from public.ai_jobs j join public.projects p on p.id = j.project_id where p.owner_id = p_user_id and j.status = 'processing'),
    'queue_completed', (select count(*) from public.ai_jobs j join public.projects p on p.id = j.project_id where p.owner_id = p_user_id and j.status = 'completed'),
    'queue_failed', (select count(*) from public.ai_jobs j join public.projects p on p.id = j.project_id where p.owner_id = p_user_id and j.status = 'failed')
  ) into result;

  return result;
end;
$$ language plpgsql security definer stable;

-- Atualiza automaticamente page_count do capítulo quando páginas são inseridas/removidas
create or replace function public.update_chapter_page_count()
returns trigger as $$
begin
  update public.chapters
  set page_count = (select count(*) from public.pages where chapter_id = coalesce(new.chapter_id, old.chapter_id))
  where id = coalesce(new.chapter_id, old.chapter_id);
  return coalesce(new, old);
end;
$$ language plpgsql security definer;

create trigger trg_update_chapter_page_count
  after insert or delete on public.pages
  for each row execute function public.update_chapter_page_count();

-- Pega o próximo job da fila (usado pelo worker de processamento) com locking seguro
create or replace function public.claim_next_job(p_stages pipeline_stage[])
returns public.ai_jobs as $$
declare
  claimed public.ai_jobs;
begin
  select * into claimed
  from public.ai_jobs
  where status = 'queued' and stage = any(p_stages)
  order by priority desc, created_at asc
  limit 1
  for update skip locked;

  if found then
    update public.ai_jobs
    set status = 'processing', started_at = now(), attempts = attempts + 1
    where id = claimed.id
    returning * into claimed;
  end if;

  return claimed;
end;
$$ language plpgsql security definer;
