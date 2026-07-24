'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { requestPasswordReset, type AuthState } from '@/lib/supabase/auth-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const initialState: AuthState = { error: null };

export default function ResetPasswordPage() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, initialState);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl">Recuperar senha</CardTitle>
          <CardDescription>Enviaremos um link para redefinir sua senha</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required placeholder="voce@exemplo.com" />
            </div>
            {state.error && <p className="text-sm text-destructive">{state.error}</p>}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? 'Enviando...' : 'Enviar link de recuperação'}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground">
            <Link href="/login" className="text-primary hover:underline">
              Voltar para o login
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
