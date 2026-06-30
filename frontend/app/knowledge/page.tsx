'use client';

import { useEffect, useState } from 'react';
import { SearchBar } from '@/components/knowledge/SearchBar';
import { NoteCard } from '@/components/knowledge/NoteCard';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingState, EmptyState, ErrorState } from '@/components/ui/State';
import { Tabs, TabList, Tab, TabPanel } from '@/components/ui/Tabs';
import { BookOpen, Tag, Folder } from 'lucide-react';
import { api, type SearchResult, type Tag as TagType, type Folder as FolderType } from '@/lib/api';

export default function KnowledgePage() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [tags, setTags] = useState<TagType[]>([]);
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    Promise.all([api.getTags(), api.getFolders()])
      .then(([t, f]) => {
        setTags(t);
        setFolders(f);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
    // Initial search — empty query returns latest
    api.searchNotes('', 20).then(setResults).catch(() => {});
  }, []);

  const handleSearch = (q: string) => {
    setQuery(q);
    setLoading(true);
    api.searchNotes(q, 30)
      .then(setResults)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-tx-primary flex items-center gap-2">
          <BookOpen className="text-ac-cyan" />
          Knowledge Vault
        </h1>
        <p className="text-sm text-tx-secondary mt-1">448 notes indexées · recherche full-text PostgreSQL</p>
      </div>

      <SearchBar onSearch={handleSearch} placeholder="Rechercher dans le vault…" />

      <Tabs default="notes">
        <TabList>
          <Tab value="notes">Notes ({results.length})</Tab>
          <Tab value="tags">Tags ({tags.length})</Tab>
          <Tab value="folders">Dossiers ({folders.length})</Tab>
        </TabList>

        <TabPanel value="notes">
          {loading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState message={error} />
          ) : results.length === 0 ? (
            <EmptyState
              icon={<BookOpen size={32} />}
              title="Aucun résultat"
              description={query ? `Rien trouvé pour « ${query} »` : 'Le vault est vide'}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((note) => (
                <NoteCard key={note.id} note={note} />
              ))}
            </div>
          )}
        </TabPanel>

        <TabPanel value="tags">
          <Card>
            <div className="flex flex-wrap gap-2">
              {tags.map((t) => (
                <Badge key={t.name} color="cyan">
                  {t.name} <span className="text-tx-muted ml-1">{t.count}</span>
                </Badge>
              ))}
            </div>
          </Card>
        </TabPanel>

        <TabPanel value="folders">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {folders.map((f) => (
              <Card key={f.path} hoverable>
                <div className="flex items-center gap-3">
                  <Folder className="text-ac-purple" size={20} />
                  <div>
                    <h3 className="text-sm font-medium text-tx-primary">{f.name}</h3>
                    <p className="text-xs text-tx-muted">{f.count} notes · {f.path}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabPanel>
      </Tabs>
    </div>
  );
}