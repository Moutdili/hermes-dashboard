'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen, MessageSquare, Wrench, Clock, History, Network,
  Activity, Database, Cpu, FileText,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingState, ErrorState } from '@/components/ui/State';
import { api, type SystemStatus, type HealthStatus } from '@/lib/api';

export default function HomePage() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.health(), api.status()])
      .then(([h, s]) => {
        setHealth(h);
        setStatus(s);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState label="Connexion au backend…" />;
  if (error) return <ErrorState message={`Backend injoignable: ${error}`} onRetry={() => window.location.reload()} />;

  const stats = [
    { label: 'Skills', value: status?.skills_count ?? '—', icon: Wrench, href: '/skills', color: 'purple' as const },
    { label: 'Cron Jobs', value: status?.cron_count ?? '—', icon: Clock, href: '/cron', color: 'amber' as const },
    { label: 'Sessions', value: status?.active_sessions ?? '—', icon: History, href: '/sessions', color: 'cyan' as const },
    { label: 'Knowledge', value: '—', icon: BookOpen, href: '/knowledge', color: 'green' as const },
  ];

  const quickLinks = [
    { href: '/knowledge', label: 'Knowledge Vault', icon: BookOpen, desc: 'Recherche full-text PostgreSQL', color: 'purple' as const },
    { href: '/chat', label: 'Chat Agent', icon: MessageSquare, desc: 'Discuter avec Hermes en temps réel', color: 'cyan' as const },
    { href: '/graph', label: 'Knowledge Graph', icon: Network, desc: 'Visualiser les connexions', color: 'green' as const },
    { href: '/skills', label: 'Skills Browser', icon: Wrench, desc: `${status?.skills_count ?? '—'} compétences installées`, color: 'amber' as const },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-tx-primary flex items-center gap-2">
          <Activity className="text-ac-cyan" />
          Dashboard
        </h1>
        <p className="text-sm text-tx-secondary mt-1">
          Vue d'ensemble du système Hermes Agent
        </p>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
              Backend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge color={health?.status === 'ok' ? 'green' : 'rose'}>
                {health?.status ?? 'unknown'}
              </Badge>
              <span className="text-xs text-tx-muted">v{health?.version ?? '?'}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Database className="text-ac-purple" size={16} />
              Database
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge color={health?.database === 'ok' ? 'green' : 'rose'}>
              {health?.database ?? 'unknown'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Cpu className="text-ac-amber" size={16} />
              Uptime
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-sm text-tx-primary">{status?.uptime ?? '—'}</span>
          </CardContent>
        </Card>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.label} href={s.href}>
              <Card hoverable className="flex flex-col items-center text-center py-6">
                <div className="mb-3">
                  <Icon className={`text-ac-${s.color}`} size={24} />
                </div>
                <div className="text-2xl font-bold text-tx-primary">{s.value}</div>
                <div className="text-xs text-tx-secondary mt-1">{s.label}</div>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="text-lg font-semibold text-tx-primary mb-3 flex items-center gap-2">
          <FileText size={18} className="text-ac-cyan" />
          Accès rapide
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickLinks.map((q) => {
            const Icon = q.icon;
            return (
              <Link key={q.href} href={q.href}>
                <Card hoverable className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-bg-elevated">
                    <Icon className={`text-ac-${q.color}`} size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-tx-primary">{q.label}</h3>
                    <p className="text-xs text-tx-secondary mt-1">{q.desc}</p>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}