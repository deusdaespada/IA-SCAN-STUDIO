'use client';

import { Button } from '@/components/ui/button';
import { signInWithOAuth } from '@/lib/supabase/auth-actions';

export function OAuthButtons() {
  return (
    <div className="grid grid-cols-3 gap-3">
      <Button type="button" variant="outline" onClick={() => signInWithOAuth('google')}>
        Google
      </Button>
      <Button type="button" variant="outline" onClick={() => signInWithOAuth('discord')}>
        Discord
      </Button>
      <Button type="button" variant="outline" onClick={() => signInWithOAuth('github')}>
        GitHub
      </Button>
    </div>
  );
}
