import Image from 'next/image';
import { Badge } from '@/components/ui/badge';

interface ProjectCardProps {
  project: {
    name: string;
    cover_url: string | null;
    work_type: string;
    target_language: string;
    status: string;
    tags: string[];
  };
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <div className="group cursor-pointer">
      <div className="aspect-[2/3] overflow-hidden rounded-lg border border-border bg-secondary">
        {project.cover_url ? (
          <Image src={project.cover_url} alt={project.name} width={220} height={330} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">Sem capa</div>
        )}
      </div>
      <p className="mt-2 truncate font-medium">{project.name}</p>
      <div className="mt-1 flex flex-wrap items-center gap-1">
        <Badge variant="outline" className="text-[10px] capitalize">{project.work_type}</Badge>
        <Badge variant="secondary" className="text-[10px]">{project.target_language}</Badge>
      </div>
    </div>
  );
}
