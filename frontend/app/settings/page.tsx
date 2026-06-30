'use client';

import { useEffect, useState } from 'react';
import { Settings, User, Server, Database } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingState, ErrorState } from '@/components/ui/State';
import { Tabs, TabList, Tab, TabPanel } from '@/components/ui/Tabs';
import { api, type User as UserType, type SystemStatus } from '@/lib/api';

export default function SettingsPage() {
  const [user, setUser] = useState<UserType | null>(null);
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.whoami(), api.status()])
      .then(([u, s]) => { setUser(u); setStatus(s); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-tx-primary flex items-center gap-2">
          <Settings className="text-ac-cyan" />
          Settings
        </h1>
        <p className="text-sm text-tx-secondary mt-1">Configuration du système</p>
      </div>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} />
      ) : (
      <Tabs default="profile">
        <TabList>
          <Tab value="profile">Profil</Tab>
          <Tab value="system">Système</Tab>
        </TabList>

        <TabPanel value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <User size={16} className="text-ac-cyan" /> Utilisateur
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-tx-muted">Nom</span>
                  <span className="text-tx-primary">{user?.name ?? '—'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-tx-muted">IP</span>
                  <span className="text-tx-primary font-mono">{user?.ip ?? '—'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-tx-muted">Channels</span>
                  <div className="flex gap-1">
                    {user?.channels?.map((c) => (
                      <Badge key={c} color="cyan">{c}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value="system">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Server size={16} className="text-ac-purple" /> Serveur
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-tx-muted">Plateforme</span>
                    <span className="text-tx-primary">{status?.platform ?? '—'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-tx-muted">Uptime</span>
                    <span className="text-tx-primary">{status?.uptime ?? '—'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Database size={16} className="text-ac-amber" /> Composants
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-tx-muted">Skills</span>
                    <Badge color="purple">{status?.skills_count ?? '—'}</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-tx-muted">Cron Jobs</span>
                    <Badge color="amber">{status?.cron_count ?? '—'}</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-tx-muted">Sessions actives</span>
                    <Badge color="cyan">{status?.active_sessions ?? '—'}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabPanel>
      </Tabs>
      )}
    </div>
  );
}