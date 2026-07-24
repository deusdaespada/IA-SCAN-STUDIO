import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { updateProfile, saveAiProviderKey, deactivateAiProviderKey } from '@/lib/actions/settings';
import { formatBytes, formatNumber } from '@/lib/utils/format';

const PROVIDERS = [
  ['openai', 'OpenAI'],
  ['google_gemini', 'Google Gemini'],
  ['anthropic', 'Anthropic Claude'],
  ['deepseek', 'DeepSeek'],
  ['openrouter', 'OpenRouter'],
];

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single();
  const { data: keys } = await supabase
    .from('ai_provider_keys')
    .select('id, provider, label, is_active, created_at')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false });

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">Perfil, plano e provedores de IA</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Perfil</CardTitle>
          <CardDescription>{user?.email}</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateProfile} className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nome completo</Label>
              <Input id="full_name" name="full_name" defaultValue={profile?.full_name ?? ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Usuário</Label>
              <Input id="username" name="username" defaultValue={profile?.username ?? ''} />
            </div>
            <div className="col-span-2 flex items-center gap-4 text-sm text-muted-foreground">
              <span>Plano: <Badge variant="secondary" className="ml-1 capitalize">{profile?.plan}</Badge></span>
              <span>Armazenamento: {formatBytes(profile?.storage_used_bytes ?? 0)} / {formatBytes(profile?.storage_limit_bytes ?? 0)}</span>
              <span>Tokens IA: {formatNumber(profile?.ai_tokens_used ?? 0)} / {formatNumber(profile?.ai_tokens_limit ?? 0)}</span>
            </div>
            <div className="col-span-2">
              <Button type="submit">Salvar perfil</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Provedores de IA</CardTitle>
          <CardDescription>
            Configure suas próprias chaves de API. Elas são criptografadas (AES-256-GCM) antes de serem salvas
            e nunca são expostas ao navegador.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form action={saveAiProviderKey} className="grid grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Provedor</Label>
              <select name="provider" required className="h-10 w-full rounded-md border border-input bg-secondary/50 px-2 text-sm">
                {PROVIDERS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">API Key</Label>
              <Input name="api_key" type="password" required placeholder="sk-..." />
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full">Salvar</Button>
            </div>
          </form>

          <div className="space-y-2">
            {keys?.filter((k) => k.is_active).map((k) => (
              <div key={k.id} className="flex items-center justify-between rounded-md border border-border p-3">
                <div>
                  <span className="font-medium capitalize">{k.provider.replace('_', ' ')}</span>
                  <span className="ml-2 text-xs text-muted-foreground">••••••••{k.label !== 'default' ? ` (${k.label})` : ''}</span>
                </div>
                <form action={deactivateAiProviderKey.bind(null, k.id)}>
                  <Button size="sm" variant="ghost">Remover</Button>
                </form>
              </div>
            ))}
            {(!keys || keys.filter((k) => k.is_active).length === 0) && (
              <p className="text-sm text-muted-foreground">Nenhuma chave configurada. Sem chave, a plataforma tenta usar a chave padrão da instância (se configurada no servidor).</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
