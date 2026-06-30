'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Network } from 'lucide-react';
import { GraphView } from '@/components/knowledge/GraphView';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/State';
import { api, type GraphData } from '@/lib/api';

export default function GraphPage() {
  const router = useRouter();
  const [data, setData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getGraph()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleNodeClick = (id: string) => {
    router.push(`/knowledge/${encodeURIComponent(id)}`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-tx-primary flex items-center gap-2">
            <Network className="text-ac-cyan" />
            Knowledge Graph
          </h1>
          <p className="text-sm text-tx-secondary mt-1">
            {data ? `${data.nodes.length} nœuds · ${data.links.length} connexions` : 'Chargement…'}
          </p>
        </div>
      </div>

      {loading ? (
        <LoadingState label="Construction du graphe…" />
      ) : error ? (
        <ErrorState message={error} />
      ) : !data || data.nodes.length === 0 ? (
        <EmptyState
          icon={<Network size={32} />}
          title="Graphe vide"
          description="Aucune note n'a été indexée"
        />
      ) : (
        <Card className="p-2">
          <GraphView data={data} onNodeClick={handleNodeClick} />
        </Card>
      )}
    </div>
  );
}