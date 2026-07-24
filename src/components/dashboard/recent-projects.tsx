import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ProjectRow {
  id: string;
  name: string;
  cover_url: string | null;
  work_type: string;
  target_language: string;
  status: string;
  updated_at: string;
}

const STATUS_VARIANT: Record<string, 'secondary' | 'success' | 'warning' | 'danger'> = {
  draft: 'secondary',
  in_progress: 'warning',
  review: 'warning',
  completed: 'success',
  archived: 'secondary',
};

export function RecentProjects({ projects }: { projects: ProjectRow[] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Projetos recentes</CardTitle>
        <Link href="/projects" className="text-sm text-primary hover:underline">
          Ver todos
        </Link>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {projects.length === 0 && <p className="col-span-full text-sm text-muted-foreground">Nenhum projeto ainda. Crie o primeiro em Projetos.</p>}
        {projects.map((p) => (
          <Link key={p.id} href={`/projects/${p.id}`} className="group">
            <div className="aspect-[2/3] overflow-hidden rounded-lg bg-secondary">
              {p.cover_url ? (
                <Image src={p.cover_url} alt={p.name} width={200} height={300} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">Sem capa</div>
              )}
            </div>
            <p className="mt-2 truncate text-sm font-medium">{p.name}</p>
            <div className="mt-1 flex items-center gap-1">
              <Badge variant={STATUS_VARIANT[p.status] ?? 'secondary'} className="text-[10px]">
                {p.status}
              </Badge>
              <span className="text-[10px] text-muted-foreground">{p.target_language}</span>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
