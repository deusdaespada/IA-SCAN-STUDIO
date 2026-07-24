import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function QueueOverview({
  waiting,
  processing,
  completed,
  failed,
}: {
  waiting: number;
  processing: number;
  completed: number;
  failed: number;
}) {
  const items = [
    { label: 'Em espera', value: waiting, variant: 'secondary' as const },
    { label: 'Processando', value: processing, variant: 'warning' as const },
    { label: 'Concluído', value: completed, variant: 'success' as const },
    { label: 'Com erro', value: failed, variant: 'danger' as const },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fila de processamento</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {items.map((item) => (
          <div key={item.label} className="rounded-lg border border-border p-4">
            <Badge variant={item.variant}>{item.label}</Badge>
            <p className="mt-2 text-2xl font-bold">{item.value}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
