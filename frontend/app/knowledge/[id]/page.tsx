'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText, Folder, Clock, Link2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingState, ErrorState } from '@/components/ui/State';
import { MarkdownRenderer } from '@/components/shared/MarkdownRenderer';
import { api, type NoteDetail } from '@/lib/api';
import { formatDate } from '@/lib/utils';

export default function NotePage() {
  const params = useParams();
  const router = useRouter();
  const id = decodeURIComponent(params.id as string);

  const [note, setNote] = useState<NoteDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getNote(id)
      .then(setNote)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingState label="Chargement de la note…" />;
  if (error) return <ErrorState message={error} />;
  if (!note) return <ErrorState message="Note introuvable" />;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Back */}
      <Button variant="ghost" size="sm" onClick={() => router.back()}>
        <ArrowLeft size={16} /> Retour
      </Button>

      {/* Header */}
      <Card>
        <div className="flex items-start gap-3 mb-4">
          <div className="p-3 rounded-lg bg-bg-elevated shrink-0">
            <FileText className="text-ac-cyan" size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-tx-primary">{note.title}</h1>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-tx-muted">
              <span className="flex items-center gap-1">
                <Folder size={12} /> {note.folder}
              </span>
              <span className="flex items-center gap-1">
                <Clock size={12} /> {formatDate(note.modified)}
              </span>
            </div>
          </div>
        </div>

        {note.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {note.tags.map((tag) => (
              <Badge key={tag} color="cyan">{tag}</Badge>
            ))}
          </div>
        )}
      </Card>

      {/* Content */}
      <Card>
        <MarkdownRenderer content={note.content} />
      </Card>

      {/* Links */}
      {note.links?.length > 0 && (
        <Card>
          <h3 className="text-sm font-semibold text-tx-primary mb-3 flex items-center gap-2">
            <Link2 size={16} className="text-ac-cyan" />
            Liens ({note.links.length})
          </h3>
          <div className="space-y-1">
            {note.links.map((link) => (
              <Link
                key={link}
                href={`/knowledge/${encodeURIComponent(link)}`}
                className="block px-3 py-2 rounded-md text-sm text-tx-secondary hover:text-tx-primary hover:bg-bd-subtle transition-fast"
              >
                {link}
              </Link>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}