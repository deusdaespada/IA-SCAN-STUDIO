'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { WorkType } from '@/types/domain';

export async function createProject(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const name = String(formData.get('name') || '').trim();
  if (!name) throw new Error('Nome do projeto é obrigatório');

  const { data, error } = await supabase
    .from('projects')
    .insert({
      owner_id: user.id,
      name,
      description: String(formData.get('description') || '') || null,
      work_type: String(formData.get('work_type') || 'manga') as WorkType,
      source_language: String(formData.get('source_language') || 'ja'),
      target_language: String(formData.get('target_language') || 'pt-BR'),
      author: String(formData.get('author') || '') || null,
      artist: String(formData.get('artist') || '') || null,
      tags: String(formData.get('tags') || '')
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      genres: String(formData.get('genres') || '')
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    })
    .select('id')
    .single();

  if (error) throw new Error(error.message);

  revalidatePath('/projects');
  redirect(`/projects/${data.id}`);
}

export async function deleteProject(projectId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('projects').delete().eq('id', projectId);
  if (error) throw new Error(error.message);
  revalidatePath('/projects');
}

export async function createChapter(projectId: string, formData: FormData) {
  const supabase = await createClient();
  const number = Number(formData.get('number'));
  const title = String(formData.get('title') || '') || null;

  const { data, error } = await supabase
    .from('chapters')
    .insert({ project_id: projectId, number, title })
    .select('id')
    .single();

  if (error) throw new Error(error.message);
  revalidatePath(`/projects/${projectId}`);
  return data.id as string;
}

export async function deleteChapter(projectId: string, chapterId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('chapters').delete().eq('id', chapterId);
  if (error) throw new Error(error.message);
  revalidatePath(`/projects/${projectId}`);
}

export async function deletePage(projectId: string, chapterId: string, pageId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('pages').delete().eq('id', pageId);
  if (error) throw new Error(error.message);
  revalidatePath(`/projects/${projectId}/chapters/${chapterId}`);
}
