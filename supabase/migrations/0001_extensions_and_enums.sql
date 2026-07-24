-- ============================================================
-- AI SCAN STUDIO — Migration 0001
-- Extensões e tipos ENUM
-- ============================================================

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
create extension if not exists "moddatetime" schema extensions;

-- Tipo de obra
create type work_type as enum ('manga', 'manhwa', 'manhua', 'webtoon', 'novel', 'light_novel', 'other');

-- Status geral de projeto/capítulo
create type project_status as enum ('draft', 'in_progress', 'review', 'completed', 'archived');

-- Etapas do pipeline
create type pipeline_stage as enum ('upload', 'ocr', 'translation', 'review', 'clean_redraw', 'typesetting', 'qc', 'export');

-- Status de um job/etapa
create type job_status as enum ('queued', 'processing', 'completed', 'failed', 'canceled');

-- Papéis de colaboração dentro de um projeto
create type project_role as enum ('owner', 'admin', 'translator', 'reviewer', 'cleaner', 'typesetter', 'qc', 'viewer');

-- Status de QC de página
create type qc_status as enum ('approved', 'needs_review', 'critical_error', 'pending');

-- Planos de assinatura
create type subscription_plan as enum ('free', 'starter', 'pro', 'studio', 'enterprise');

-- Provedores de IA suportados
create type ai_provider as enum ('openai', 'google_gemini', 'anthropic', 'deepseek', 'openrouter');

-- Tipo de texto detectado por OCR
create type text_element_type as enum ('speech_bubble', 'text_box', 'sfx', 'title', 'caption', 'other');
