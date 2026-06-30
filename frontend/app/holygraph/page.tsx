'use client';

import { Network, GitBranch, Cpu, Layers } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/State';

export default function HolygraphPage() {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-tx-primary flex items-center gap-2">
          <Network className="text-ac-cyan" /> Holygraph
        </h1>
        <div className="flex gap-2">
          <Badge color="purple"><GitBranch size={12} /> v2</Badge>
          <Badge color="cyan"><Cpu size={12} /> multi-agent</Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Layers size={14} className="text-ac-purple" /> Multi-Agent Graph
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">Vue graphe des agents et leurs dépendances — orchestrator, workers, et tâches kanban.</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {['T1-Agent1', 'T1-Agent2', 'T1-Agent3', 'T2-Agent1', 'T2-Agent2', 'T2-Agent3'].map((agent) => (
              <Card key={agent} className="bg-bg-elevated p-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
                  <span className="text-xs font-mono text-tx-primary">{agent}</span>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <EmptyState
        icon={<Network size={32} />}
        title="Visualisation interactive à venir"
        description="Le graphe D3.js multi-agent sera intégré ici — en attendant, voir /graph pour le knowledge graph"
      />
    </div>
  );
}