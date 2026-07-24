import type { AiProviderClient, TranslateRequest, TranslateResult, ReviewRequest, ReviewResult, OcrRequest, OcrResult } from '../types';
import { buildTranslationPrompt, buildReviewPrompt, parseJsonResponse } from '../prompts';

export function createAnthropicClient(apiKey: string): AiProviderClient {
  const baseUrl = 'https://api.anthropic.com/v1/messages';

  async function call(model: string, prompt: string, maxTokens = 4096): Promise<{ text: string; tokens: number }> {
    const res = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Anthropic API error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const text = data.content?.map((c: { text?: string }) => c.text || '').join('') ?? '';
    const tokens = (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0);
    return { text, tokens };
  }

  return {
    provider: 'anthropic',

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
      // OCR via modelo de visão: requer envio da imagem como base64 (content type "image").
      // Implementar quando a chave estiver configurada — estrutura de chamada de exemplo
      // está documentada em /docs/ai-providers.md deste projeto.
      throw new Error('OCR via Anthropic ainda não configurado. Adicione a lógica de visão em anthropic.ts');
    },
  };
}
