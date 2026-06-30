'use client';

import { FileCode, Plus, FileCode2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/State';

const blueprints = [
  { name: 'FastAPI + PostgreSQL', desc: 'Backend avec asyncpg, Pydantic v2, tests pytest', tags: ['backend', 'python'] },
  { name: 'Next.js + Tailwind', desc: 'Frontend SSR, dark theme, design system', tags: ['frontend', 'typescript'] },
  { name: 'Docker Compose stack', desc: 'Multi-service avec healthchecks et réseau', tags: ['devops'] },
];

export default function BlueprintsPage() {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-tx-primary flex items-center gap-2">
          <FileCode2 className="text-ac-cyan" /> Blueprints
        </h1>
        <Button size="sm"><Plus size={14} /> New blueprint</Button>
      </div>
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
    </div>
  );
}