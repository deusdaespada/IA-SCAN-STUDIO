export type WorkType = 'manga' | 'manhwa' | 'manhua' | 'webtoon' | 'novel' | 'light_novel' | 'other';
export type ProjectStatus = 'draft' | 'in_progress' | 'review' | 'completed' | 'archived';
export type PipelineStage = 'upload' | 'ocr' | 'translation' | 'review' | 'clean_redraw' | 'typesetting' | 'qc' | 'export';
export type JobStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'canceled';
export type ProjectRole = 'owner' | 'admin' | 'translator' | 'reviewer' | 'cleaner' | 'typesetter' | 'qc' | 'viewer';
export type QcStatus = 'approved' | 'needs_review' | 'critical_error' | 'pending';
export type AiProvider = 'openai' | 'google_gemini' | 'anthropic' | 'deepseek' | 'openrouter';

export const PIPELINE_STAGES: { key: PipelineStage; label: string }[] = [
  { key: 'upload', label: 'Upload' },
  { key: 'ocr', label: 'OCR' },
  { key: 'translation', label: 'Tradução' },
  { key: 'review', label: 'Revisão' },
  { key: 'clean_redraw', label: 'Clean / Redraw' },
  { key: 'typesetting', label: 'Typesetting' },
  { key: 'qc', label: 'QC' },
  { key: 'export', label: 'Exportação' },
];

export interface Project {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  work_type: WorkType;
  source_language: string;
  target_language: string;
  author: string | null;
  artist: string | null;
  tags: string[];
  genres: string[];
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
}

export interface Chapter {
  id: string;
  project_id: string;
  number: number;
  title: string | null;
  status: ProjectStatus;
  current_stage: PipelineStage;
  page_count: number;
  created_at: string;
  updated_at: string;
}

export interface PageRow {
  id: string;
  chapter_id: string;
  page_number: number;
  original_image_url: string;
  clean_image_url: string | null;
  final_image_url: string | null;
  width: number | null;
  height: number | null;
  qc_status: QcStatus;
  current_stage: PipelineStage;
}

export interface AiJob {
  id: string;
  project_id: string;
  chapter_id: string | null;
  page_id: string | null;
  stage: PipelineStage;
  status: JobStatus;
  priority: number;
  ai_provider: AiProvider | null;
  ai_model: string | null;
  attempts: number;
  max_attempts: number;
  error_message: string | null;
  created_at: string;
}

export interface DashboardStats {
  total_projects: number;
  total_chapters: number;
  total_pages: number;
  total_translations: number;
  ai_tokens_used: number;
  storage_used_bytes: number;
  queue_waiting: number;
  queue_processing: number;
  queue_completed: number;
  queue_failed: number;
}
