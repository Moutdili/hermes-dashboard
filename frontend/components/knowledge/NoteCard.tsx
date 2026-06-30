'use client';

import Link from 'next/link';
import { FileText, Folder } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { truncate } from '@/lib/utils';
import type { SearchResult } from '@/lib/api';

interface NoteCardProps {
  note: SearchResult;
}

export function NoteCard({ note }: NoteCardProps) {
  return (
    <Link href={`/knowledge/${note.id}`}>
      <Card hoverable className="h-full">
        <div className="flex items-start gap-3 mb-2">
          <div className="p-2 rounded-md bg-bg-elevated shrink-0">
            <FileText className="text-ac-cyan" size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-medium text-tx-primary truncate">{note.title}</h3>
            <div className="flex items-center gap-1 text-xs text-tx-muted mt-0.5">
              <Folder size={12} />
              <span className="truncate">{note.path}</span>
            </div>
          </div>
        </div>
        <p className="text-xs text-tx-secondary line-clamp-3">{note.snippet}</p>
        {note.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {note.tags.slice(0, 4).map((tag) => (
              <Badge key={tag} color="cyan">{tag}</Badge>
            ))}
            {note.tags.length > 4 && (
              <span className="text-xs text-tx-muted">+{note.tags.length - 4}</span>
            )}
          </div>
        )}
      </Card>
    </Link>
  );
}