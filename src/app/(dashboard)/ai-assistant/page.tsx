import { createClient } from '@/lib/supabase/server';
import { AssistantChat } from '@/components/ai/assistant-chat';

export default async function AiAssistantPage() {
  const supabase = await createClient();
  const { data: projects } = await supabase.from('projects').select('id, name').order('name');

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-bold">IA Assistente</h1>
        <p className="text-muted-foreground">Converse com a IA sobre o contexto de um projeto: personagens, glossário, consistência</p>
      </div>
      <AssistantChat projects={projects ?? []} />
    </div>
  );
}
