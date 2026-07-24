import type { AiProvider } from '@/types/domain';
import type { AiProviderClient } from './types';
import { createAnthropicClient } from './providers/anthropic';
import { createOpenAiClient } from './providers/openai';
import { createGeminiClient } from './providers/gemini';
import { createDeepSeekClient, createOpenRouterClient } from './providers/openai-compatible';
import { decryptApiKey } from './crypto';
import { createAdminClient } from '@/lib/supabase/server';

export function getAiClient(provider: AiProvider, apiKey: string): AiProviderClient {
  switch (provider) {
    case 'anthropic':
      return createAnthropicClient(apiKey);
    case 'openai':
      return createOpenAiClient(apiKey);
    case 'google_gemini':
      return createGeminiClient(apiKey);
    case 'deepseek':
      return createDeepSeekClient(apiKey);
    case 'openrouter':
      return createOpenRouterClient(apiKey);
    default:
      throw new Error(`Provedor de IA não suportado: ${provider}`);
  }
}

/**
 * Busca e descriptografa a chave de API configurada pelo usuário para um provedor,
 * ou recorre à chave "default" da instância (variável de ambiente), se houver.
 */
export async function resolveAiClientForUser(userId: string, provider: AiProvider): Promise<AiProviderClient> {
  const admin = createAdminClient();

  const { data: keyRow } = await admin
    .from('ai_provider_keys')
    .select('encrypted_key')
    .eq('user_id', userId)
    .eq('provider', provider)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();

  let apiKey: string | undefined;

  if (keyRow?.encrypted_key) {
    apiKey = decryptApiKey(keyRow.encrypted_key);
  } else {
    const envKeyMap: Record<AiProvider, string | undefined> = {
      openai: process.env.OPENAI_API_KEY,
      google_gemini: process.env.GOOGLE_GEMINI_API_KEY,
      anthropic: process.env.ANTHROPIC_API_KEY,
      deepseek: process.env.DEEPSEEK_API_KEY,
      openrouter: process.env.OPENROUTER_API_KEY,
    };
    apiKey = envKeyMap[provider];
  }

  if (!apiKey) {
    throw new Error(`Nenhuma chave de API configurada para ${provider}. Configure em Configurações → IA.`);
  }

  return getAiClient(provider, apiKey);
}
