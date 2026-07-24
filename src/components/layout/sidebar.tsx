'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderKanban,
  ListChecks,
  PencilRuler,
  BookOpenText,
  Database,
  Sparkles,
  Gauge,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { signOut } from '@/lib/supabase/auth-actions';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/projects', label: 'Projetos', icon: FolderKanban },
  { href: '/queue', label: 'Fila de Processamento', icon: ListChecks },
  { href: '/editor', label: 'Editor', icon: PencilRuler },
  { href: '/glossary', label: 'Glossário', icon: BookOpenText },
  { href: '/translation-memory', label: 'Memória de Tradução', icon: Database },
  { href: '/ai-assistant', label: 'IA', icon: Sparkles },
  { href: '/usage', label: 'Uso', icon: Gauge },
  { href: '/settings', label: 'Configurações', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-6 py-5">
        <div className="h-8 w-8 rounded-lg bg-primary" />
        <span className="text-lg font-bold">AI Scan Studio</span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                active ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <form action={signOut} className="border-t border-border p-3">
        <button className="w-full rounded-md px-3 py-2 text-left text-sm text-muted-foreground hover:bg-secondary hover:text-foreground">
          Sair
        </button>
      </form>
    </aside>
  );
}
