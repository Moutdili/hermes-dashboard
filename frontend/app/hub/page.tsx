'use client';

import { Home, Star, TrendingUp, Clock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

const sections = [
  { title: 'Favoris', icon: Star, items: ['Dashboard', 'Knowledge Vault', 'Chat', 'Terminal'] },
  { title: 'Récents', icon: Clock, items: ['Settings', 'Doctor', 'Skills', 'Sessions'] },
  { title: 'Tendance', icon: TrendingUp, items: ['Graph', 'Logs', 'Kanban', 'Agents'] },
];

export default function HubPage() {
  return (
    <div className="space-y-4 animate-fade-in">
      <h1 className="text-2xl font-bold text-tx-primary flex items-center gap-2">
        <Home className="text-ac-cyan" /> Hub
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sections.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.title}>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2"><Icon size={14} className="text-ac-cyan" /> {s.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {s.items.map((item) => (
                    <div key={item} className="flex items-center justify-between text-sm">
                      <span className="text-tx-primary">{item}</span>
                      <Badge color="gray">→</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}