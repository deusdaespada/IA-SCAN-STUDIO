import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { resolveAiClientForUser } from '@/lib/ai/factory';

export const runtime = 'nodejs';

/**
 * Chat de IA com contexto do projeto. Reaproveita o método `review` do provedor
 * como um canal de texto livre genérico (original = pergunta do usuário,
 * translated = "" ) — para um chat mais rico, adicione um método `chat()` dedicado
 * na interface AiProviderClient em src/lib/ai/types.ts.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const { projectId, message, provider = 'anthropic', model = 'claude-sonnet-4-6' } = await request.json();

  const { data: project } = await supabase.from('projects').select('name, source_language, target_language').eq('id', projectId).single();
  const { data: glossary } = await supabase.from('glossaries').select('term_original, term_translated, category').eq('project_id', projectId);

  try {
    const client = await resolveAiClientForUser(user.id, provider);
    const result = await client.review(
      {
        original: message,
        translated: '',
        context: {
          sourceLanguage: project?.source_language ?? 'ja',
          targetLanguage: project?.target_language ?? 'pt-BR',
          glossary: glossary ?? [],
          characterNotes: `O usuário está trabalhando no projeto "${project?.name}". Responda a pergunta dele diretamente, usando o glossário como contexto quando relevante.`,
        },
      },
      model
    );

    return NextResponse.json({ reply: result.suggestion ?? result.reasoning });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
