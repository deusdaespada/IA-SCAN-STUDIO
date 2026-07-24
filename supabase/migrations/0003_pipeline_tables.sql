-- ============================================================
-- AI SCAN STUDIO — Migration 0003
-- Tabelas do pipeline: OCR, tradução, revisão, clean/redraw,
-- typesetting, QC
-- ============================================================

-- RESULTADOS DE OCR (um elemento de texto detectado por página)
create table public.ocr_results (
  id uuid primary key default uuid_generate_v4(),
  page_id uuid not null references public.pages(id) on delete cascade,
  element_type text_element_type not null default 'speech_bubble',
  bbox_x numeric not null,
  bbox_y numeric not null,
  bbox_width numeric not null,
  bbox_height numeric not null,
  polygon jsonb, -- opcional: contorno poligonal preciso do balão
  original_text text not null default '',
  confidence numeric, -- 0 a 1
  order_index int not null default 0,
  edited_manually boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_ocr_page on public.ocr_results(page_id);
create trigger set_updated_at_ocr before update on public.ocr_results
  for each row execute function extensions.moddatetime('updated_at');

-- TRADUÇÕES (vinculadas a cada elemento de OCR)
create table public.translations (
  id uuid primary key default uuid_generate_v4(),
  ocr_result_id uuid not null references public.ocr_results(id) on delete cascade,
  translated_text text not null default '',
  ai_provider ai_provider,
  ai_model text,
  tokens_used int default 0,
  version int not null default 1,
  is_current boolean not null default true,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create index idx_translations_ocr on public.translations(ocr_result_id);
create index idx_translations_current on public.translations(ocr_result_id) where is_current = true;

-- REVISÕES (sugestões de IA e edições humanas sobre uma tradução)
create table public.reviews (
  id uuid primary key default uuid_generate_v4(),
  translation_id uuid not null references public.translations(id) on delete cascade,
  suggested_text text,
  reasoning text,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected', 'edited')),
  reviewed_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at_reviews before update on public.reviews
  for each row execute function extensions.moddatetime('updated_at');

-- JOBS DE LIMPEZA (clean)
create table public.cleaning_jobs (
  id uuid primary key default uuid_generate_v4(),
  page_id uuid not null references public.pages(id) on delete cascade,
  mode text not null default 'auto' check (mode in ('auto', 'redraw', 'clean_redraw', 'manual')),
  mask_data jsonb, -- máscaras desenhadas manualmente, se houver
  status job_status not null default 'queued',
  result_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_cleaning_page on public.cleaning_jobs(page_id);
create trigger set_updated_at_cleaning before update on public.cleaning_jobs
  for each row execute function extensions.moddatetime('updated_at');

-- JOBS DE REDRAW (reconstrução de arte via inpainting)
create table public.redraw_jobs (
  id uuid primary key default uuid_generate_v4(),
  cleaning_job_id uuid not null references public.cleaning_jobs(id) on delete cascade,
  ai_provider ai_provider,
  ai_model text,
  status job_status not null default 'queued',
  result_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at_redraw before update on public.redraw_jobs
  for each row execute function extensions.moddatetime('updated_at');

-- TYPESETTING (posicionamento final do texto sobre a página limpa)
create table public.typesetting (
  id uuid primary key default uuid_generate_v4(),
  ocr_result_id uuid not null references public.ocr_results(id) on delete cascade,
  translation_id uuid references public.translations(id),
  pos_x numeric not null,
  pos_y numeric not null,
  width numeric not null,
  height numeric not null,
  rotation numeric not null default 0,
  font_family text not null default 'Anime Ace',
  font_size numeric not null default 14,
  bold boolean not null default false,
  italic boolean not null default false,
  color text not null default '#000000',
  outline_color text,
  outline_width numeric default 0,
  text_align text not null default 'center' check (text_align in ('left', 'center', 'right')),
  is_ai_generated boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_typesetting_ocr on public.typesetting(ocr_result_id);
create trigger set_updated_at_typesetting before update on public.typesetting
  for each row execute function extensions.moddatetime('updated_at');

-- RESULTADOS DE QC
create table public.qc_results (
  id uuid primary key default uuid_generate_v4(),
  page_id uuid not null references public.pages(id) on delete cascade,
  status qc_status not null default 'pending',
  issue_type text, -- ex: 'text_overflow', 'missing_translation', 'duplicate_page', etc.
  description text,
  bbox_x numeric,
  bbox_y numeric,
  bbox_width numeric,
  bbox_height numeric,
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_qc_page on public.qc_results(page_id);
