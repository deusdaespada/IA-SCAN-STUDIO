import type { AiProviderClient, TranslateRequest, TranslateResult, ReviewRequest, ReviewResult, OcrRequest, OcrResult } from '../types';
import { buildTranslationPrompt, buildReviewPrompt, parseJsonResponse } from '../prompts';

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

    async ocr(_req: OcrRequest, _model: string): Promise<OcrResult> {
      throw new Error('OCR via OpenAI (gpt-4o vision) ainda não configurado. Adicione a lógica de visão em openai.ts');
    },
  };
}
