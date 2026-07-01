'use client';

import { FileCode, Plus, FileCode2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/State';

const blueprints: Array<{ name: string; desc: string; tags: string[] }> = [];

export default function BlueprintsPage() {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-tx-primary flex items-center gap-2">
          <FileCode2 className="text-ac-cyan" /> Blueprints
        </h1>
        <Button size="sm"><Plus size={14} /> New blueprint</Button>
      </div>
      {blueprints.length === 0 ? (
        <EmptyState icon={<FileCode2 size={32} />} title="Aucun blueprint" description="Les blueprints seront listés ici" />
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {blueprints.map((b) => (
          <Card key={b.name} hoverable>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2"><FileCode size={14} className="text-ac-purple" /> {b.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-3">{b.desc}</p>
              <div className="flex flex-wrap gap-1">
                {b.tags.map((t) => <Badge key={t} color="purple">{t}</Badge>)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      )}
    </div>
  );
}