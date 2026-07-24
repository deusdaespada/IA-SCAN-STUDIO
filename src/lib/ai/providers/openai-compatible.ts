import type { AiProviderClient, TranslateRequest, TranslateResult, ReviewRequest, ReviewResult, OcrRequest, OcrResult } from '../types';
import { buildTranslationPrompt, buildReviewPrompt, parseJsonResponse } from '../prompts';

/**
 * DeepSeek e OpenRouter expõem uma API compatível com o formato de chat completions
 * da OpenAI, então compartilham a mesma implementação, variando apenas a base URL.
 */
function createOpenAiCompatibleClient(
  provider: 'deepseek' | 'openrouter',
  apiKey: string,
  baseUrl: string
): AiProviderClient {
  async function call(model: string, prompt: string): Promise<{ text: string; tokens: number }> {
    const res = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`${provider} API error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content ?? '';
    const tokens = data.usage?.total_tokens ?? 0;
    return { text, tokens };
  }

  return {
    provider,

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
      throw new Error(`OCR via ${provider} ainda não configurado.`);
    },
  };
}

export function createDeepSeekClient(apiKey: string): AiProviderClient {
  return createOpenAiCompatibleClient('deepseek', apiKey, 'https://api.deepseek.com/chat/completions');
}

export function createOpenRouterClient(apiKey: string): AiProviderClient {
  return createOpenAiCompatibleClient('openrouter', apiKey, 'https://openrouter.ai/api/v1/chat/completions');
}
