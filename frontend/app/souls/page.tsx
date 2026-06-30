'use client';

import { Ghost, Sparkles, Plus } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

const souls = [
  { name: 'discord', desc: 'Persona Discord — helpful, concise, French', active: true },
  { name: 'soul', desc: 'Soul-MD — anti-nataliste, mélancolie informée', active: false },
  { name: 'catgirl', desc: 'Neko-chan — anime catgirl, nya~', active: false },
  { name: 'kawaii', desc: 'Kawaii — cute, sparkles, adorable', active: false },
  { name: 'noir', desc: 'Detective noir — rain, regrets, silicon', active: false },
  { name: 'pirate', desc: 'Captain Hermes — nautical, yo ho ho', active: false },
  { name: 'shakespeare', desc: 'Bardic prose, soliloquies', active: false },
  { name: 'philosopher', desc: 'Contemplates deeper meaning', active: false },
  { name: 'concise', desc: 'Brief, to the point', active: false },
  { name: 'creative', desc: 'Out of the box, innovative', active: false },
  { name: 'hype', desc: 'SO PUMPED! LET\'S GOOO!', active: false },
  { name: 'helpful', desc: 'Friendly, helpful default', active: false },
];

export default function SoulsPage() {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-tx-primary flex items-center gap-2">
          <Ghost className="text-ac-cyan" /> Souls & Personas
        </h1>
        <Button size="sm"><Plus size={14} /> New persona</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {souls.map((s) => (
          <Card key={s.name} hoverable>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles size={14} className={s.active ? 'text-ac-cyan' : 'text-tx-muted'} />
                {s.name}
              </CardTitle>
              {s.active && <Badge color="cyan">active</Badge>}
            </CardHeader>
            <CardContent>{s.desc}</CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}