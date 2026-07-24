'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createGlossaryTerm(formData: FormData) {
  const supabase = await createClient();

  const projectId = String(formData.get('project_id') || '');
  const termOriginal = String(formData.get('term_original') || '').trim();
  const termTranslated = String(formData.get('term_translated') || '').trim();
  const category = String(formData.get('category') || 'other');
  const notes = String(formData.get('notes') || '') || null;

  if (!projectId || !termOriginal || !termTranslated) {
    throw new Error('Projeto, termo original e tradução são obrigatórios');
  }

  const { error } = await supabase.from('glossaries').insert({
    project_id: projectId,
    term_original: termOriginal,
    term_translated: termTranslated,
    category,
    notes,
  });

  if (error) throw new Error(error.message);
  revalidatePath('/glossary');
}

export async function deleteGlossaryTerm(termId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('glossaries').delete().eq('id', termId);
  if (error) throw new Error(error.message);
  revalidatePath('/glossary');
}
