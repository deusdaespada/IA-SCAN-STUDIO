'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { encryptApiKey } from '@/lib/ai/crypto';
import { revalidatePath } from 'next/cache';
import type { AiProvider } from '@/types/domain';

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Não autenticado');

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: String(formData.get('full_name') || ''),
      username: String(formData.get('username') || ''),
    })
    .eq('id', user.id);

  if (error) throw new Error(error.message);
  revalidatePath('/settings');
}

export async function saveAiProviderKey(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Não autenticado');

  const provider = String(formData.get('provider') || '') as AiProvider;
  const apiKey = String(formData.get('api_key') || '').trim();
  const label = String(formData.get('label') || 'default');

  if (!provider || !apiKey) throw new Error('Provedor e chave são obrigatórios');

  // Usa o client admin apenas para escrever na tabela de chaves, que já é protegida
  // por RLS (user_id = auth.uid()) — aqui reforçamos manualmente o user_id correto.
  const admin = createAdminClient();
  const encrypted = encryptApiKey(apiKey);

  const { error } = await admin
    .from('ai_provider_keys')
    .upsert(
      { user_id: user.id, provider, label, encrypted_key: encrypted, is_active: true },
      { onConflict: 'user_id,provider,label' }
    );

  if (error) throw new Error(error.message);
  revalidatePath('/settings');
}

export async function deactivateAiProviderKey(keyId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('ai_provider_keys').update({ is_active: false }).eq('id', keyId);
  if (error) throw new Error(error.message);
  revalidatePath('/settings');
}
