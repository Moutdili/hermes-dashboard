'use client';

import { useEffect, useState } from 'react';
import { ScrollText, Search, Download } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { LoadingState, EmptyState, ErrorState } from '@/components/ui/State';
import { formatDate } from '@/lib/utils';

interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  source: string;
  message: string;
}

const mockLogs: LogEntry[] = [
  { timestamp: new Date().toISOString(), level: 'INFO', source: 'gateway', message: 'Gateway started — Discord connected' },
  { timestamp: new Date(Date.now() - 60000).toISOString(), level: 'INFO', source: 'cron', message: 'Cron scheduler tick — 0 jobs ran' },
  { timestamp: new Date(Date.now() - 120000).toISOString(), level: 'WARN', source: 'memory', message: 'MEMORY.md at 99% capacity (15877/16000 chars)' },
  { timestamp: new Date(Date.now() - 180000).toISOString(), level: 'INFO', source: 'skill', message: 'Skill "hermes-agent" loaded' },
];

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filtered, setFiltered] = useState<LogEntry[]>([]);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/logs')
      .then((r) => r.json())
      .then((d) => { setLogs(d.entries || mockLogs); setFiltered(d.entries || mockLogs); })
      .catch(() => { setLogs(mockLogs); setFiltered(mockLogs); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let f = logs;
    if (levelFilter !== 'ALL') f = f.filter((l) => l.level === levelFilter);
    if (search) {
      const q = search.toLowerCase();
      f = f.filter((l) => l.message.toLowerCase().includes(q) || l.source.toLowerCase().includes(q));
    }
    setFiltered(f);
  }, [search, levelFilter, logs]);

  const levelColors: Record<string, 'green' | 'amber' | 'rose' | 'gray'> = {
    INFO: 'green', WARN: 'amber', ERROR: 'rose', DEBUG: 'gray',
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-tx-primary flex items-center gap-2">
          <ScrollText className="text-ac-cyan" /> Logs
        </h1>
        <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(filtered.map((l) => `[${l.timestamp}] ${l.level} ${l.source}: ${l.message}`).join('\n'))}>
          <Download size={14} /> Export
        </Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Input icon={<Search size={16} />} placeholder="Filtrer logs…" value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 min-w-[200px]" />
        <div className="flex gap-1">
          {['ALL', 'INFO', 'WARN', 'ERROR', 'DEBUG'].map((l) => (
            <Button key={l} variant={levelFilter === l ? 'default' : 'outline'} size="sm" onClick={() => setLevelFilter(l)}>
              {l}
            </Button>
          ))}
        </div>
      </div>

      <Card className="p-0">
        {loading ? <LoadingState /> : filtered.length === 0 ? (
          <EmptyState icon={<ScrollText size={32} />} title="Aucun log" />
        ) : (
          <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
            {filtered.map((l, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-2 border-b border-bd-subtle last:border-0 hover:bg-bd-subtle">
                <Badge color={levelColors[l.level]}>{l.level}</Badge>
                <span className="text-xs text-tx-muted font-mono shrink-0">{formatDate(l.timestamp)}</span>
                <span className="text-xs text-ac-purple font-mono shrink-0">{l.source}</span>
                <span className="text-sm text-tx-primary flex-1">{l.message}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}