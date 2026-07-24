import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');

  let query = supabase.from('ai_jobs').select('*').order('created_at', { ascending: false }).limit(100);
  if (projectId) query = query.eq('project_id', projectId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ jobs: data });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { jobId, action } = await request.json();

  if (!jobId || !['retry', 'cancel'].includes(action)) {
    return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 });
  }

  const update = action === 'retry' ? { status: 'queued', error_message: null, attempts: 0 } : { status: 'canceled' };

  const { error } = await supabase.from('ai_jobs').update(update).eq('id', jobId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
