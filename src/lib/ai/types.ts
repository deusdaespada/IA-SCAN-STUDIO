import type { AiProvider } from '@/types/domain';

export interface TranslationContext {
  sourceLanguage: string;
  targetLanguage: string;
  glossary: { term_original: string; term_translated: string; category: string }[];
  previousChapterSummary?: string;
  characterNotes?: string;
}

export interface TranslateRequest {
  texts: { id: string; text: string }[];
  context: TranslationContext;
}

export interface TranslateResult {
  translations: { id: string; translated: string }[];
  tokensUsed: number;
}

export interface ReviewRequest {
  original: string;
  translated: string;
  context: TranslationContext;
}

export interface ReviewResult {
  suggestion: string | null;
  reasoning: string;
  tokensUsed: number;
}

export interface OcrRequest {
  imageUrl: string;
}

export interface OcrDetectedElement {
  type: 'speech_bubble' | 'text_box' | 'sfx' | 'title' | 'caption' | 'other';
  bbox: { x: number; y: number; width: number; height: number };
  text: string;
  confidence: number;
}

export interface OcrResult {
  elements: OcrDetectedElement[];
}

/**
 * Contrato que todo provedor de IA (OpenAI, Gemini, Claude, DeepSeek, OpenRouter...)
 * deve implementar. Isso permite adicionar novos provedores sem reescrever o pipeline.
 */
export interface AiProviderClient {
  readonly provider: AiProvider;
  translate(req: TranslateRequest, model: string): Promise<TranslateResult>;
  review(req: ReviewRequest, model: string): Promise<ReviewResult>;
  ocr(req: OcrRequest, model: string): Promise<OcrResult>;
}
