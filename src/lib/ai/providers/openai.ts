import type { AiProviderClient, TranslateRequest, TranslateResult, ReviewRequest, ReviewResult, OcrRequest, OcrResult } from '../types';
import { buildTranslationPrompt, buildReviewPrompt, buildOcrPrompt, parseJsonResponse } from '../prompts';
import { fetchImageAsBase64 } from '../fetch-image';

export function createOpenAiClient(apiKey: string): AiProviderClient {
  const baseUrl = 'https://api.openai.com/v1/chat/completions';

  async function call(model: string, prompt: string): Promise<{ text: string; tokens: number }> {
    const res = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenAI API error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content ?? '';
    const tokens = data.usage?.total_tokens ?? 0;
    return { text, tokens };
  }

  async function callWithImage(model: string, prompt: string, imageBase64: string, imageMimeType: string): Promise<{ text: string; tokens: number }> {
    const res = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: `data:${imageMimeType};base64,${imageBase64}` } },
            ],
          },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenAI API error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content ?? '';
    const tokens = data.usage?.total_tokens ?? 0;
    return { text, tokens };
  }

  return {
    provider: 'openai',

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
