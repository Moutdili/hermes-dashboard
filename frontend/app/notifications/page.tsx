'use client';

import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/State';
import { formatDate } from '@/lib/utils';

const notifications: Array<{ id: number; type: string; title: string; desc: string; time: string; read: boolean }> = [];

const typeColors: Record<string, 'green' | 'amber' | 'cyan'> = {
  success: 'green', warning: 'amber', info: 'cyan',
};

export default function NotificationsPage() {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-tx-primary flex items-center gap-2">
          <Bell className="text-ac-cyan" /> Notifications
        </h1>
        <Button variant="ghost" size="sm"><CheckCheck size={14} /> Tout marquer lu</Button>
      </div>
      {notifications.length === 0 ? (
        <EmptyState icon={<Bell size={32} />} title="Aucune notification" />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Card key={n.id} className={!n.read ? 'border-ac-cyan/20' : ''}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${n.read ? 'bg-tx-muted' : 'bg-ac-cyan animate-pulse'}`} />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium text-tx-primary">{n.title}</h3>
                      <Badge color={typeColors[n.type]}>{n.type}</Badge>
                    </div>
                    <p className="text-xs text-tx-secondary mt-1">{n.desc}</p>
                    <p className="text-xs text-tx-muted mt-1">{formatDate(n.time)}</p>
                  </div>
                </div>
                {!n.read && <Button variant="ghost" size="icon"><Trash2 size={14} className="text-tx-muted" /></Button>}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}