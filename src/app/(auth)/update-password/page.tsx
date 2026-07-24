'use client';

import { useActionState } from 'react';
import { updatePassword, type AuthState } from '@/lib/supabase/auth-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const initialState: AuthState = { error: null };

export default function UpdatePasswordPage() {
  const [state, formAction, pending] = useActionState(updatePassword, initialState);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl">Definir nova senha</CardTitle>
          <CardDescription>Escolha uma nova senha para sua conta</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nova senha</Label>
              <Input id="password" name="password" type="password" required minLength={8} />
            </div>
            {state.error && <p className="text-sm text-destructive">{state.error}</p>}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? 'Salvando...' : 'Salvar nova senha'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
