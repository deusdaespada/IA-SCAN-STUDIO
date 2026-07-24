'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';

interface Project { id: string; name: string }
interface Message { role: 'user' | 'assistant'; content: string }

export function AssistantChat({ projects }: { projects: Project[] }) {
  const [projectId, setProjectId] = React.useState(projects[0]?.id ?? '');
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [input, setInput] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  async function send() {
    if (!input.trim() || !projectId) return;
    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ projectId, message: userMessage.content }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply || data.error || 'Sem resposta.' }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-[70vh] flex-col rounded-lg border border-border bg-card">
      <div className="border-b border-border p-3">
        <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="h-9 rounded-md border border-input bg-secondary/50 px-2 text-sm">
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Pergunte coisas como: &quot;Como traduzimos esse termo anteriormente?&quot;, &quot;Existe alguma inconsistência neste capítulo?&quot;
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`max-w-[80%] rounded-lg p-3 text-sm ${m.role === 'user' ? 'ml-auto bg-primary text-primary-foreground' : 'bg-secondary'}`}>
            {m.content}
          </div>
        ))}
        {loading && <div className="max-w-[80%] rounded-lg bg-secondary p-3 text-sm text-muted-foreground">Pensando...</div>}
      </div>

      <div className="flex gap-2 border-t border-border p-3">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Pergunte algo sobre o projeto..."
        />
        <Button onClick={send} disabled={loading}><Send className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}
