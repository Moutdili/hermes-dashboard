'use client';

import { Pickaxe, TrendingUp, Database, Zap } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export default function LeadminerPage() {
  return (
    <div className="space-y-4 animate-fade-in">
      <h1 className="text-2xl font-bold text-tx-primary flex items-center gap-2">
        <Pickaxe className="text-ac-cyan" /> Leadminer
      </h1>
      <p className="text-sm text-tx-secondary">Data mining & lead generation</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><TrendingUp size={14} className="text-ac-green" /> Trends</CardTitle></CardHeader>
          <CardContent>Analyses de tendances en temps réel</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Database size={14} className="text-ac-purple" /> Sources</CardTitle></CardHeader>
          <CardContent>Gestion des sources de données</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Zap size={14} className="text-ac-amber" /> Automations</CardTitle></CardHeader>
          <CardContent>Pipelines automatisés</CardContent>
        </Card>
      </div>
    </div>
  );
}