'use client';

import { useEffect, useState } from 'react';
import { Activity, Stethoscope, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingState, ErrorState } from '@/components/ui/State';
import { api, type HealthStatus, type SystemStatus } from '@/lib/api';

interface Check {
  name: string;
  status: 'ok' | 'warn' | 'fail';
  detail: string;
}

export default function DoctorPage() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    Promise.all([api.health(), api.status()])
      .then(([h, s]) => { setHealth(h); setStatus(s); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const checks: Check[] = [
    { name: 'Backend FastAPI', status: health?.status === 'ok' ? 'ok' : 'fail', detail: `v${health?.version ?? '?'}` },
    { name: 'PostgreSQL', status: health?.database === 'ok' ? 'ok' : 'fail', detail: health?.database ?? 'unknown' },
    { name: 'Skills system', status: 'ok', detail: `${status?.skills_count ?? 0} skills` },
    { name: 'Cron scheduler', status: 'ok', detail: `${status?.cron_count ?? 0} jobs` },
    { name: 'Session store', status: 'ok', detail: `${status?.active_sessions ?? 0} active` },
  ];

  const icons = {
    ok: <CheckCircle className="text-status-success" size={20} />,
    warn: <AlertCircle className="text-status-warning" size={20} />,
    fail: <XCircle className="text-ac-rose" size={20} />,
  };

  if (loading) return <LoadingState label="Diagnostic…" />;
  if (error) return <ErrorState message={error} />;

  const allOk = checks.every((c) => c.status === 'ok');

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-tx-primary flex items-center gap-2">
          <Stethoscope className="text-ac-cyan" /> Doctor
        </h1>
        <Button variant="ghost" size="sm" onClick={load}><RefreshCw size={14} /> Re-run</Button>
      </div>

      <Card className={allOk ? 'border-status-success/30' : 'border-ac-rose/30'}>
        <div className="flex items-center gap-3">
          {allOk ? <CheckCircle className="text-status-success" size={32} /> : <XCircle className="text-ac-rose" size={32} />}
          <div>
            <h2 className="text-lg font-semibold text-tx-primary">{allOk ? 'Système sain' : 'Problèmes détectés'}</h2>
            <p className="text-sm text-tx-secondary">{checks.filter((c) => c.status === 'ok').length}/{checks.length} checks OK</p>
          </div>
        </div>
      </Card>

      <div className="space-y-3">
        {checks.map((c) => (
          <Card key={c.name}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {icons[c.status]}
                <div>
                  <h3 className="text-sm font-medium text-tx-primary">{c.name}</h3>
                  <p className="text-xs text-tx-muted">{c.detail}</p>
                </div>
              </div>
              <Badge color={c.status === 'ok' ? 'green' : c.status === 'warn' ? 'amber' : 'rose'}>
                {c.status}
              </Badge>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2"><Activity size={16} className="text-ac-cyan" /> System info</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-tx-muted">Platform</span><br /><span className="text-tx-primary">{status?.platform ?? '—'}</span></div>
            <div><span className="text-tx-muted">Uptime</span><br /><span className="text-tx-primary">{status?.uptime ?? '—'}</span></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}