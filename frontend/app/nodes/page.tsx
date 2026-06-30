'use client';

import { useEffect, useState } from 'react';
import { Share2, Server, Cpu, HardDrive, Wifi } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingState } from '@/components/ui/State';

interface Node {
  id: string;
  name: string;
  type: string;
  status: 'online' | 'offline';
  cpu: number;
  mem: number;
  disk: number;
}

export default function NodesPage() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/nodes')
      .then((r) => r.json())
      .then((d) => setNodes(d.nodes || [
        { id: 'fedora-hp', name: 'fedora-hp', type: 'local', status: 'online', cpu: 23, mem: 45, disk: 67 },
        { id: 'vv-db', name: 'vv-db', type: 'ssh', status: 'online', cpu: 12, mem: 38, disk: 82 },
      ]))
      .catch(() => setNodes([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-4 animate-fade-in">
      <h1 className="text-2xl font-bold text-tx-primary flex items-center gap-2">
        <Share2 className="text-ac-cyan" /> Nodes
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {nodes.map((n) => (
          <Card key={n.id}>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Server size={14} className={n.status === 'online' ? 'text-status-success' : 'text-tx-muted'} />
                {n.name}
              </CardTitle>
              <Badge color={n.status === 'online' ? 'green' : 'gray'}>{n.status}</Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Meter icon={<Cpu size={12} />} label="CPU" value={n.cpu} />
                <Meter icon={<HardDrive size={12} />} label="RAM" value={n.mem} />
                <Meter icon={<HardDrive size={12} />} label="Disk" value={n.disk} />
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-tx-muted">
                <Wifi size={12} /> {n.type}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Meter({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  const color = value > 80 ? 'bg-ac-rose' : value > 60 ? 'bg-status-warning' : 'bg-ac-green';
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="flex items-center gap-1 text-tx-muted">{icon} {label}</span>
        <span className="text-tx-primary">{value}%</span>
      </div>
      <div className="h-1.5 bg-bg-elevated rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-base`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}