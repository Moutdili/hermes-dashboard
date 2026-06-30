'use client';

import { useEffect, useState } from 'react';
import { FileText, Folder, Search, ChevronRight, Download } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { LoadingState, EmptyState, ErrorState } from '@/components/ui/State';
import { MarkdownRenderer } from '@/components/shared/MarkdownRenderer';
import { formatDate, truncate } from '@/lib/utils';

interface FileItem {
  name: string;
  path: string;
  type: 'file' | 'dir';
  size: number;
  modified: string;
}

export default function FilesPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [filtered, setFiltered] = useState<FileItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<FileItem | null>(null);
  const [content, setContent] = useState<string>('');

  useEffect(() => {
    // In production, fetch from /api/files
    fetch('/api/files')
      .then((r) => r.json())
      .then((d) => { setFiles(d.items || []); setFiltered(d.items || []); })
      .catch(() => {
        // Fallback — show vault files
        setError('Backend files API non disponible');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!search) { setFiltered(files); return; }
    const q = search.toLowerCase();
    setFiltered(files.filter((f) => f.name.toLowerCase().includes(q) || f.path.toLowerCase().includes(q)));
  }, [search, files]);

  const openFile = (f: FileItem) => {
    setSelected(f);
    fetch(`/api/files/read?path=${encodeURIComponent(f.path)}`)
      .then((r) => r.json())
      .then((d) => setContent(d.content || ''))
      .catch(() => setContent('Impossible de lire le fichier'));
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-tx-primary flex items-center gap-2">
          <FileText className="text-ac-cyan" /> Files
        </h1>
        <p className="text-sm text-tx-secondary mt-1">{filtered.length} fichiers</p>
      </div>

      <Input
        icon={<Search size={16} />}
        placeholder="Rechercher un fichier…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* File list */}
        <div className="space-y-2">
          {loading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState message={error} />
          ) : filtered.length === 0 ? (
            <EmptyState icon={<FileText size={32} />} title="Aucun fichier" />
          ) : (
            filtered.map((f) => (
              <Card key={f.path} hoverable onClick={() => f.type === 'file' && openFile(f)}>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-bg-elevated shrink-0">
                    {f.type === 'dir' ? <Folder className="text-ac-purple" size={16} /> : <FileText className="text-ac-cyan" size={16} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-medium text-tx-primary truncate">{f.name}</h3>
                    <p className="text-xs text-tx-muted truncate">{f.path}</p>
                  </div>
                  <ChevronRight size={16} className="text-tx-muted" />
                </div>
              </Card>
            ))
          )}
        </div>

        {/* File preview */}
        <Card className="lg:sticky lg:top-20 h-fit">
          {selected ? (
            <>
              <CardHeader>
                <CardTitle className="text-sm truncate">{selected.name}</CardTitle>
                <Button variant="ghost" size="sm"><Download size={14} /></Button>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-3">
                  <Badge color="gray">{formatDate(selected.modified)}</Badge>
                  <Badge color="cyan">{(selected.size / 1024).toFixed(1)} KB</Badge>
                </div>
                {selected.name.endsWith('.md') ? (
                  <MarkdownRenderer content={content} />
                ) : (
                  <pre className="text-xs font-mono text-tx-secondary whitespace-pre-wrap bg-bg-root p-3 rounded-md max-h-[400px] overflow-y-auto">
                    {content || '(vide)'}
                  </pre>
                )}
              </CardContent>
            </>
          ) : (
            <EmptyState icon={<FileText size={32} />} title="Sélectionne un fichier" description="Clique sur un fichier pour le prévisualiser" />
          )}
        </Card>
      </div>
    </div>
  );
}