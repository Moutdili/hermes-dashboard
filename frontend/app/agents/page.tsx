'use client';

import { useEffect, useState } from 'react';
import { Bot, Plus, Activity, Clock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingState, EmptyState } from '@/components/ui/State';

interface Agent {
  id: string;
  name: string;
  status: 'running' | 'idle' | 'stopped';
  task: string;
  uptime: string;
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/agents')
      .then((r) => r.json())
      .then((d) => setAgents(d.agents || []))
      .catch(() => setAgents([]))
      .finally(() => setLoading(false));
  }, []);

  const statusColor: Record<string, 'green' | 'amber' | 'gray'> = {
    running: 'green', idle: 'amber', stopped: 'gray',
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-tx-primary flex items-center gap-2">
          <Bot className="text-ac-cyan" /> Agents
        </h1>
        <Button size="sm"><Plus size={14} /> Spawn agent</Button>
      </div>

      {loading ? <LoadingState /> : agents.length === 0 ? (
        <EmptyState icon={<Bot size={32} />} title="Aucun agent actif" description="Spawn un agent pour démarrer une tâche autonome" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {agents.map((a) => (
            <Card key={a.id} hoverable>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity size={14} className={a.status === 'running' ? 'text-status-success animate-pulse' : 'text-tx-muted'} />
                  {a.name}
                </CardTitle>
                <Badge color={statusColor[a.status]}>{a.status}</Badge>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-2">{a.task}</p>
                <div className="flex items-center gap-1 text-xs text-tx-muted">
                  <Clock size={12} /> {a.uptime}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}