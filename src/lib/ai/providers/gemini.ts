import type { AiProviderClient, TranslateRequest, TranslateResult, ReviewRequest, ReviewResult, OcrRequest, OcrResult } from '../types';
import { buildTranslationPrompt, buildReviewPrompt, buildOcrPrompt, parseJsonResponse } from '../prompts';
import { fetchImageAsBase64 } from '../fetch-image';

export function createGeminiClient(apiKey: string): AiProviderClient {
  function url(model: string) {
    return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  }

  async function call(model: string, prompt: string): Promise<{ text: string; tokens: number }> {
    const res = await fetch(url(model), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini API error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || '').join('') ?? '';
    const tokens = data.usageMetadata?.totalTokenCount ?? 0;
    return { text, tokens };
  }

  async function callWithImage(model: string, prompt: string, imageBase64: string, imageMimeType: string): Promise<{ text: string; tokens: number }> {
    const res = await fetch(url(model), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ inline_data: { mime_type: imageMimeType, data: imageBase64 } }, { text: prompt }],
          },
        ],
        generationConfig: { responseMimeType: 'application/json' },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini API error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || '').join('') ?? '';
    const tokens = data.usageMetadata?.totalTokenCount ?? 0;
    return { text, tokens };
  }

  return {
    provider: 'google_gemini',

    async translate(req: TranslateRequest, model: string): Promise<TranslateResult> {
      const prompt = buildTranslationPrompt(req);
      const { text, tokens } = await call(model, prompt);
      const parsed = parseJsonResponse<{ translations: { id: string; translated: string }[] }>(text);
      return { translations: parsed.translations, tokensUsed: tokens };
    },

    async review(req: ReviewRequest, model: string): Promise<ReviewResult> {
      const prompt = buildReviewPrompt(req);
      const { text, tokens } = await call(model, prompt);
      const parsed = parseJsonResponse<{ suggestion: string | null; reasoning: string }>(text);
      return { suggestion: parsed.suggestion, reasoning: parsed.reasoning, tokensUsed: tokens };
    },

    async ocr(req: OcrRequest, model: string): Promise<OcrResult> {
      const { base64, mimeType } = await fetchImageAsBase64(req.imageUrl);
      const prompt = buildOcrPrompt();
      const { text } = await callWithImage(model, prompt, base64, mimeType);
      const parsed = parseJsonResponse<{ elements: OcrResult['elements'] }>(text);
      return { elements: parsed.elements ?? [] };
    },
  };
}
