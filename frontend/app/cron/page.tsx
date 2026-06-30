'use client';

import { useEffect, useState } from 'react';
import { Clock, Play, Pause, Plus, ChevronRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingState, EmptyState, ErrorState } from '@/components/ui/State';
import { Modal } from '@/components/ui/Modal';
import { api, type CronJob, type CronOutput } from '@/lib/api';
import { formatDate, truncate } from '@/lib/utils';

export default function CronPage() {
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [outputModal, setOutputModal] = useState<{ id: string; name: string } | null>(null);
  const [output, setOutput] = useState<CronOutput | null>(null);

  useEffect(() => {
    api.getCrons()
      .then(setJobs)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const viewOutput = (id: string, name: string) => {
    setOutputModal({ id, name });
    api.getCronOutput(id).then(setOutput).catch(() => {});
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-tx-primary flex items-center gap-2">
            <Clock className="text-ac-cyan" />
            Cron Jobs
          </h1>
          <p className="text-sm text-tx-secondary mt-1">{jobs.length} tâches planifiées</p>
        </div>
        <Button size="sm"><Plus size={16} /> Nouveau</Button>
      </div>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} />
      ) : jobs.length === 0 ? (
        <EmptyState icon={<Clock size={32} />} title="Aucun cron" description="Aucune tâche planifiée" />
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <Card key={job.id} hoverable onClick={() => viewOutput(job.id, job.name)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-bg-elevated shrink-0">
                    {job.status === 'active' ? (
                      <Play className="text-status-success" size={16} />
                    ) : (
                      <Pause className="text-tx-muted" size={16} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-medium text-tx-primary truncate">{job.name}</h3>
                    <div className="flex items-center gap-3 text-xs text-tx-muted mt-0.5">
                      <code className="text-ac-cyan">{job.schedule}</code>
                      <span className="truncate">{truncate(job.prompt, 60)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge color={job.status === 'active' ? 'green' : 'gray'}>
                    {job.status}
                  </Badge>
                  <ChevronRight size={16} className="text-tx-muted" />
                </div>
              </div>
              {(job.last_run || job.next_run) && (
                <div className="flex gap-4 mt-3 text-xs text-tx-muted">
                  {job.last_run && <span>Dernier: {formatDate(job.last_run)}</span>}
                  {job.next_run && <span>Prochain: {formatDate(job.next_run)}</span>}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={!!outputModal}
        onClose={() => setOutputModal(null)}
        title={`Output — ${outputModal?.name}`}
        className="max-w-3xl"
      >
        {output ? (
          <pre className="text-sm text-tx-secondary font-mono whitespace-pre-wrap bg-bg-base p-4 rounded-lg max-h-[50vh] overflow-y-auto">
            {output.output || '(aucun output)'}
          </pre>
        ) : (
          <LoadingState />
        )}
      </Modal>
    </div>
  );
}