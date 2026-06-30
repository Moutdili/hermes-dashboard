'use client';

import { useEffect, useState } from 'react';
import { Brain, RefreshCw, Trash2, User } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Tabs, TabList, Tab, TabPanel } from '@/components/ui/Tabs';
import { LoadingState, ErrorState } from '@/components/ui/State';

interface MemEntry { content: string; }

export default function MemoryPage() {
  const [memEntries, setMemEntries] = useState<MemEntry[]>([]);
  const [userEntries, setUserEntries] = useState<MemEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [memUsage, setMemUsage] = useState('');
  const [userUsage, setUserUsage] = useState('');

  const load = () => {
    setLoading(true);
    fetch('/api/memory')
      .then((r) => r.json())
      .then((d) => {
        setMemEntries(d.memory || []);
        setUserEntries(d.user || []);
        setMemUsage(d.mem_usage || '');
        setUserUsage(d.user_usage || '');
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const removeEntry = (target: 'memory' | 'user', content: string) => {
    fetch('/api/memory', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target, old_text: content.slice(0, 40) }),
    }).then(load);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-tx-primary flex items-center gap-2">
            <Brain className="text-ac-cyan" /> Memory
          </h1>
          <p className="text-sm text-tx-secondary mt-1">Mémoire persistante Hermes</p>
        </div>
        <Button variant="ghost" size="sm" onClick={load}><RefreshCw size={14} /> Refresh</Button>
      </div>

      {loading ? <LoadingState /> : error ? <ErrorState message={error} /> : (
        <Tabs default="memory">
          <TabList>
            <Tab value="memory">MEMORY.md ({memEntries.length})</Tab>
            <Tab value="user">USER.md ({userEntries.length})</Tab>
          </TabList>

          <TabPanel value="memory">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-tx-muted flex items-center gap-1"><Brain size={12} /> Agent notes</span>
                <Badge color={parseInt(memUsage) > 80 ? 'rose' : 'green'}>{memUsage}</Badge>
              </div>
              <div className="h-2 bg-bg-elevated rounded-full overflow-hidden">
                <div className={`h-full ${parseInt(memUsage) > 80 ? 'bg-ac-rose' : 'bg-ac-green'}`} style={{ width: `${memUsage}%` }} />
              </div>
            </div>
            <div className="space-y-2">
              {memEntries.map((e, i) => (
                <Card key={i}>
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm text-tx-primary whitespace-pre-wrap flex-1">{e.content}</p>
                    <Button variant="ghost" size="icon" onClick={() => removeEntry('memory', e.content)} aria-label="Delete">
                      <Trash2 size={14} className="text-ac-rose" />
                    </Button>
                  </div>
                </Card>
              ))}
              {memEntries.length === 0 && <p className="text-sm text-tx-muted text-center py-8">Mémoire vide</p>}
            </div>
          </TabPanel>

          <TabPanel value="user">
            <div className="mb-4">
              <span className="text-xs text-tx-muted flex items-center gap-1 mb-1"><User size={12} /> User profile</span>
              <Badge color={parseInt(userUsage) > 80 ? 'rose' : 'green'}>{userUsage}</Badge>
            </div>
            <div className="space-y-2">
              {userEntries.map((e, i) => (
                <Card key={i}>
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm text-tx-primary whitespace-pre-wrap flex-1">{e.content}</p>
                    <Button variant="ghost" size="icon" onClick={() => removeEntry('user', e.content)} aria-label="Delete">
                      <Trash2 size={14} className="text-ac-rose" />
                    </Button>
                  </div>
                </Card>
              ))}
              {userEntries.length === 0 && <p className="text-sm text-tx-muted text-center py-8">Profil vide</p>}
            </div>
          </TabPanel>
        </Tabs>
      )}
    </div>
  );
}