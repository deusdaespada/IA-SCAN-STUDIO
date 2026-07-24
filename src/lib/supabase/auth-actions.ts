'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

export type AuthState = { error: string | null };

export async function signInWithPassword(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get('email') || '');
  const password = String(formData.get('password') || '');
  const redirectTo = String(formData.get('redirect') || '/dashboard');

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: error.message };
  redirect(redirectTo);
}

export async function signUpWithPassword(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get('email') || '');
  const password = String(formData.get('password') || '');
  const username = String(formData.get('username') || '');
  const fullName = String(formData.get('fullName') || '');
  const origin = (await headers()).get('origin');

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: { username, full_name: fullName },
    },
  });

  if (error) return { error: error.message };
  redirect('/login?message=Verifique seu email para confirmar a conta.');
}

export async function signInWithOAuth(provider: 'google' | 'discord' | 'github') {
  const origin = (await headers()).get('origin');
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: `${origin}/auth/callback` },
  });

  if (error) throw error;
  if (data.url) redirect(data.url);
}

export async function requestPasswordReset(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get('email') || '');
  const origin = (await headers()).get('origin');
  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/update-password`,
  });

  if (error) return { error: error.message };
  return { error: null };
}

export async function updatePassword(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  const password = String(formData.get('password') || '');
  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };
  redirect('/dashboard');
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
