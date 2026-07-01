'use client';

import { useEffect, useState } from 'react';
import { UserCircle, Sparkles, RefreshCw, Plus } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingState, EmptyState, ErrorState } from '@/components/ui/State';

interface Profile {
  name: string;
  active: boolean;
  sessions: number;
  skills: number;
}

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/profiles')
      .then((r) => r.json())
      .then((d) => setProfiles(d.profiles || []))
      .catch(() => setProfiles([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-tx-primary flex items-center gap-2">
          <UserCircle className="text-ac-cyan" /> Profiles
        </h1>
        <Button size="sm"><Plus size={14} /> New profile</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {profiles.map((p) => (
          <Card key={p.name} hoverable>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                {p.name}
                {p.active && <Badge color="green">active</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 text-sm">
                <div><span className="text-tx-muted">Sessions</span><br /><span className="text-tx-primary font-medium">{p.sessions}</span></div>
                <div><span className="text-tx-muted">Skills</span><br /><span className="text-tx-primary font-medium">{p.skills}</span></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}