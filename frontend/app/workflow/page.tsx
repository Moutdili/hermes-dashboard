'use client';

import { Workflow, Play, Pause, Plus } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

const workflows = [
  { name: 'Deploy dashboard', steps: 6, status: 'active', lastRun: 'il y a 2h' },
  { name: 'Index vault', steps: 3, status: 'paused', lastRun: 'il y a 3j' },
  { name: 'Backup memories', steps: 4, status: 'active', lastRun: 'il y a 1h' },
];

export default function WorkflowPage() {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-tx-primary flex items-center gap-2">
          <Workflow className="text-ac-cyan" /> Workflows
        </h1>
        <Button size="sm"><Plus size={14} /> New workflow</Button>
      </div>
      <div className="space-y-3">
        {workflows.map((w) => (
          <Card key={w.name} hoverable>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-bg-elevated">
                  {w.status === 'active' ? <Play className="text-status-success" size={16} /> : <Pause className="text-tx-muted" size={16} />}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-tx-primary">{w.name}</h3>
                  <p className="text-xs text-tx-muted">{w.steps} étapes · {w.lastRun}</p>
                </div>
              </div>
              <Badge color={w.status === 'active' ? 'green' : 'gray'}>{w.status}</Badge>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}