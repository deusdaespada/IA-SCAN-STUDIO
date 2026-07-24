import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

// Cliente autenticado como o usuário atual (respeita RLS). Use em Server Components,
// Server Actions e Route Handlers para qualquer operação que deva respeitar permissões.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // chamado a partir de um Server Component sem permissão de escrita — ignorável
            // pois o middleware já cuida de renovar a sessão.
          }
        },
      },
    }
  );
}

// Cliente com a service_role key — ignora RLS. Usar SOMENTE em rotas server-side
// (route handlers / server actions) para operações administrativas específicas
// (ex: processar jobs de fila, decriptar chaves de IA). NUNCA importar em código de cliente.
export function createAdminClient() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: { getAll: () => [], setAll: () => {} },
    }
  );
}
