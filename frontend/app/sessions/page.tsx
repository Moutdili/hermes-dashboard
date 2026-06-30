'use client';

import { useEffect, useState } from 'react';
import { History, MessageSquare } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingState, EmptyState, ErrorState } from '@/components/ui/State';
import { Modal } from '@/components/ui/Modal';
import { api, type Session, type SessionMessage } from '@/lib/api';
import { formatDate, truncate } from '@/lib/utils';

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Session | null>(null);
  const [messages, setMessages] = useState<SessionMessage[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    api.getSessions()
      .then(setSessions)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const viewSession = (s: Session) => {
    setSelected(s);
    setModalOpen(true);
    api.getSessionMessages(s.id).then(setMessages).catch(() => {});
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-tx-primary flex items-center gap-2">
          <History className="text-ac-cyan" />
          Sessions
        </h1>
        <p className="text-sm text-tx-secondary mt-1">{sessions.length} sessions enregistrées</p>
      </div>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} />
      ) : sessions.length === 0 ? (
        <EmptyState icon={<History size={32} />} title="Aucune session" />
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => (
            <Card key={s.id} hoverable onClick={() => viewSession(s)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-bg-elevated shrink-0">
                    <MessageSquare className="text-ac-purple" size={16} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-medium text-tx-primary truncate">{s.title}</h3>
                    <div className="flex items-center gap-3 text-xs text-tx-muted mt-0.5">
                      <span>{formatDate(s.when)}</span>
                      <span>{s.messages} messages</span>
                    </div>
                  </div>
                </div>
                <Badge color="cyan">{s.source}</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selected?.title}
        className="max-w-3xl"
      >
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {messages.length === 0 ? (
            <p className="text-sm text-tx-muted text-center py-8">Aucun message</p>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={`rounded-lg p-3 ${
                  m.role === 'user'
                    ? 'bg-ac-cyan/10 border border-ac-cyan/20'
                    : m.role === 'tool'
                    ? 'bg-bg-elevated border border-bd'
                    : 'glass'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Badge color={m.role === 'user' ? 'cyan' : m.role === 'tool' ? 'gray' : 'purple'}>
                    {m.role}
                  </Badge>
                  <span className="text-xs text-tx-muted">{formatDate(m.timestamp)}</span>
                </div>
                <p className="text-sm text-tx-primary whitespace-pre-wrap">
                  {truncate(m.content, 500)}
                </p>
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
}