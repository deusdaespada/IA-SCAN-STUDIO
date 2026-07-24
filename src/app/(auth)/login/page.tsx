'use client';

import { useFormState } from 'react-dom';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { signInWithPassword, type AuthState } from '@/lib/supabase/auth-actions';
import { OAuthButtons } from '@/components/auth/oauth-buttons';
import { SubmitButton } from '@/components/auth/submit-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const initialState: AuthState = { error: null };

export default function LoginPage() {
  const [state, formAction] = useFormState(signInWithPassword, initialState);
  const params = useSearchParams();
  const redirectTo = params.get('redirect') || '/dashboard';
  const message = params.get('message');

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-2 h-10 w-10 rounded-lg bg-primary" />
          <CardTitle className="text-2xl">AI Scan Studio</CardTitle>
          <CardDescription>Entre na sua conta para continuar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {message && <p className="rounded-md bg-secondary p-3 text-sm text-foreground">{message}</p>}
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="redirect" value={redirectTo} />
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required placeholder="voce@exemplo.com" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                <Link href="/reset-password" className="text-xs text-primary hover:underline">
                  Esqueceu a senha?
                </Link>
              </div>
              <Input id="password" name="password" type="password" required placeholder="••••••••" />
            </div>
            {state.error && <p className="text-sm text-destructive">{state.error}</p>}
            <SubmitButton loadingText="Entrando...">Entrar</SubmitButton>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">ou continue com</span>
            </div>
          </div>

          <OAuthButtons />

          <p className="text-center text-sm text-muted-foreground">
            Não tem uma conta?{' '}
            <Link href="/signup" className="text-primary hover:underline">
              Cadastre-se
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
