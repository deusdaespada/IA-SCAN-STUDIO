'use client';

import { useFormState } from 'react-dom';
import Link from 'next/link';
import { signUpWithPassword, type AuthState } from '@/lib/supabase/auth-actions';
import { OAuthButtons } from '@/components/auth/oauth-buttons';
import { SubmitButton } from '@/components/auth/submit-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const initialState: AuthState = { error: null };

export default function SignupPage() {
  const [state, formAction] = useFormState(signUpWithPassword, initialState);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-2 h-10 w-10 rounded-lg bg-primary" />
          <CardTitle className="text-2xl">Criar conta</CardTitle>
          <CardDescription>Comece a automatizar suas traduções com IA</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action={formAction} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nome completo</Label>
                <Input id="fullName" name="fullName" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Usuário</Label>
                <Input id="username" name="username" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required placeholder="voce@exemplo.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" name="password" type="password" required minLength={8} placeholder="Mínimo 8 caracteres" />
            </div>
            {state.error && <p className="text-sm text-destructive">{state.error}</p>}
            <SubmitButton loadingText="Criando conta...">Criar conta</SubmitButton>
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
            Já tem uma conta?{' '}
            <Link href="/login" className="text-primary hover:underline">
              Entrar
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
