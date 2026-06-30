'use client';

import { useEffect, useState } from 'react';
import { Wrench, Search, ChevronRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { LoadingState, EmptyState, ErrorState } from '@/components/ui/State';
import { MarkdownRenderer } from '@/components/shared/MarkdownRenderer';
import { api, type SkillGroup, type SkillDetail } from '@/lib/api';
import { truncate } from '@/lib/utils';

export default function SkillsPage() {
  const [groups, setGroups] = useState<SkillGroup[]>([]);
  const [filtered, setFiltered] = useState<SkillGroup[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<SkillDetail | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    api.getSkillsGrouped()
      .then((g) => {
        setGroups(g);
        setFiltered(g);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!search) { setFiltered(groups); return; }
    const q = search.toLowerCase();
    setFiltered(groups.map((g) => ({
      ...g,
      skills: g.skills.filter((s) =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q)
      ),
    })).filter((g) => g.skills.length > 0));
  }, [search, groups]);

  const openSkill = (name: string) => {
    api.getSkill(name)
      .then((s) => { setSelected(s); setModalOpen(true); })
      .catch((e) => setError(e.message));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-tx-primary flex items-center gap-2">
          <Wrench className="text-ac-cyan" />
          Skills
        </h1>
        <p className="text-sm text-tx-secondary mt-1">
          {groups.reduce((acc, g) => acc + g.skills.length, 0)} compétences installées
        </p>
      </div>

      <Input
        icon={<Search size={16} />}
        placeholder="Filtrer les skills…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Wrench size={32} />} title="Aucun skill trouvé" />
      ) : (
        <div className="space-y-6">
          {filtered.map((group) => (
            <div key={group.category}>
              <h2 className="text-sm font-semibold text-tx-secondary mb-3 uppercase tracking-wide">
                {group.category} ({group.skills.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {group.skills.map((skill) => (
                  <Card key={skill.name} hoverable onClick={() => openSkill(skill.name)}>
                    <CardHeader>
                      <CardTitle className="text-sm">{skill.name}</CardTitle>
                      <ChevronRight size={16} className="text-tx-muted" />
                    </CardHeader>
                    <CardContent>{truncate(skill.description, 80)}</CardContent>
                    {skill.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {skill.tags.slice(0, 3).map((t) => (
                          <Badge key={t} color="purple">{t}</Badge>
                        ))}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Skill detail modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selected?.name}
        className="max-w-3xl"
      >
        {selected && (
          <div className="space-y-4">
            <p className="text-sm text-tx-secondary">{selected.description}</p>
            {selected.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selected.tags.map((t) => (
                  <Badge key={t} color="purple">{t}</Badge>
                ))}
              </div>
            )}
            <div className="max-h-[50vh] overflow-y-auto">
              <MarkdownRenderer content={selected.content} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}