'use client';

import { Ghost, Sparkles, Plus } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/State';

const souls: Array<{ name: string; desc: string; active: boolean }> = [];

export default function SoulsPage() {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-tx-primary flex items-center gap-2">
          <Ghost className="text-ac-cyan" /> Souls & Personas
        </h1>
        <Button size="sm"><Plus size={14} /> New persona</Button>
      </div>

      {souls.length === 0 ? (
        <EmptyState icon={<Ghost size={32} />} title="Aucune persona" description="Les personas seront listées ici" />
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {souls.map((s) => (
          <Card key={s.name} hoverable>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles size={14} className={s.active ? 'text-ac-cyan' : 'text-tx-muted'} />
                {s.name}
              </CardTitle>
              {s.active && <Badge color="cyan">active</Badge>}
            </CardHeader>
            <CardContent>{s.desc}</CardContent>
          </Card>
        ))}
      </div>
      )}
    </div>
  );
}