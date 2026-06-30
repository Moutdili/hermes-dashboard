'use client';

import { useEffect, useState } from 'react';
import { Trello, Plus, User, Link2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingState, EmptyState } from '@/components/ui/State';

interface Task {
  id: string;
  title: string;
  status: 'todo' | 'in-progress' | 'done' | 'blocked';
  assignee?: string;
  links?: string[];
}

export default function KanbanPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/kanban')
      .then((r) => r.json())
      .then((d) => setTasks(d.tasks || []))
      .catch(() => setTasks([]))
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    { id: 'todo', label: 'À faire', color: 'gray' as const },
    { id: 'in-progress', label: 'En cours', color: 'amber' as const },
    { id: 'done', label: 'Terminé', color: 'green' as const },
    { id: 'blocked', label: 'Bloqué', color: 'rose' as const },
  ];

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-tx-primary flex items-center gap-2">
          <Trello className="text-ac-cyan" /> Kanban
        </h1>
        <Button size="sm"><Plus size={14} /> New task</Button>
      </div>

      {tasks.length === 0 ? (
        <EmptyState icon={<Trello size={32} />} title="Aucune tâche" description="Crée des tâches pour orchestrer tes agents" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {columns.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.id);
            return (
              <div key={col.id} className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <span className="text-sm font-medium text-tx-secondary">{col.label}</span>
                  <Badge color={col.color}>{colTasks.length}</Badge>
                </div>
                {colTasks.map((t) => (
                  <Card key={t.id} hoverable>
                    <p className="text-sm text-tx-primary mb-2">{t.title}</p>
                    {t.assignee && (
                      <div className="flex items-center gap-1 text-xs text-tx-muted mb-1">
                        <User size={12} /> {t.assignee}
                      </div>
                    )}
                    {t.links && t.links.length > 0 && (
                      <div className="flex items-center gap-1 text-xs text-tx-muted">
                        <Link2 size={12} /> {t.links!.length} liens
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}