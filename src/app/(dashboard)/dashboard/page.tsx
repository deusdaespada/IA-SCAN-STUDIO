import { createClient } from '@/lib/supabase/server';
import { StatCard } from '@/components/dashboard/stat-card';
import { QueueOverview } from '@/components/dashboard/queue-overview';
import { RecentProjects } from '@/components/dashboard/recent-projects';
import { formatBytes, formatNumber } from '@/lib/utils/format';
import { FolderKanban, BookOpen, Image as ImageIcon, Languages, Sparkles, HardDrive } from 'lucide-react';
import type { DashboardStats } from '@/types/domain';

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: stats } = await supabase.rpc('get_dashboard_stats', { p_user_id: user!.id }).returns<DashboardStats>();

  const { data: recentProjects } = await supabase
    .from('projects')
    .select('id, name, cover_url, work_type, target_language, status, updated_at')
    .order('updated_at', { ascending: false })
    .limit(6);

  const s: DashboardStats = stats ?? {
    total_projects: 0,
    total_chapters: 0,
    total_pages: 0,
    total_translations: 0,
    ai_tokens_used: 0,
    storage_used_bytes: 0,
    queue_waiting: 0,
    queue_processing: 0,
    queue_completed: 0,
    queue_failed: 0,
  };

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral da sua produção</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Projetos" value={formatNumber(s.total_projects)} icon={FolderKanban} />
        <StatCard label="Capítulos" value={formatNumber(s.total_chapters)} icon={BookOpen} />
        <StatCard label="Páginas" value={formatNumber(s.total_pages)} icon={ImageIcon} />
        <StatCard label="Traduções" value={formatNumber(s.total_translations)} icon={Languages} />
        <StatCard label="Tokens IA" value={formatNumber(s.ai_tokens_used)} icon={Sparkles} />
        <StatCard label="Storage" value={formatBytes(s.storage_used_bytes)} icon={HardDrive} />
      </div>

      <QueueOverview
        waiting={s.queue_waiting}
        processing={s.queue_processing}
        completed={s.queue_completed}
        failed={s.queue_failed}
      />

      <RecentProjects projects={recentProjects ?? []} />
    </div>
  );
}
