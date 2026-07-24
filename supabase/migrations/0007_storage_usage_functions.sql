-- ============================================================
-- AI SCAN STUDIO — Migration 0007
-- Função auxiliar para atualizar o storage usado pelo usuário
-- ============================================================

create or replace function public.increment_storage_used(p_user_id uuid, p_bytes bigint)
returns void as $$
begin
  update public.profiles
  set storage_used_bytes = storage_used_bytes + p_bytes
  where id = p_user_id;
end;
$$ language plpgsql security definer;

create or replace function public.increment_ai_tokens_used(p_user_id uuid, p_tokens bigint)
returns void as $$
begin
  update public.profiles
  set ai_tokens_used = ai_tokens_used + p_tokens
  where id = p_user_id;
end;
$$ language plpgsql security definer;
