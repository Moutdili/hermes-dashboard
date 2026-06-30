'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Input';
import { Terminal, Send, Trash2, Copy } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface Line {
  id: number;
  type: 'cmd' | 'out' | 'err';
  text: string;
}

export default function TerminalPage() {
  const [lines, setLines] = useState<Line[]>([
    { id: 0, type: 'out', text: 'Hermes Terminal — connecté au backend' },
    { id: 1, type: 'out', text: 'Tape une commande ou utilise les raccourcis ci-dessous' },
  ]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [hIdx, setHIdx] = useState(-1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(2);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [lines]);

  const exec = (cmd: string) => {
    if (!cmd.trim()) return;
    const id = idRef.current++;
    setLines((p) => [...p, { id, type: 'cmd', text: cmd }]);
    setHistory((p) => [cmd, ...p].slice(0, 50));
    setHIdx(-1);

    // Simulated output — real terminal needs backend WebSocket
    fetch('/api/terminal/exec', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: cmd }),
    })
      .then((r) => r.json())
      .then((data) => {
        setLines((p) => [...p, { id: idRef.current++, type: 'out', text: data.output || data.error || '(empty)' }]);
      })
      .catch(() => {
        setLines((p) => [...p, { id: idRef.current++, type: 'err', text: 'Backend terminal non disponible' }]);
      });
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { exec(input); setInput(''); }
    else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const next = Math.min(hIdx + 1, history.length - 1);
      if (next >= 0) { setHIdx(next); setInput(history[next]); }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = Math.max(hIdx - 1, -1);
      setHIdx(next);
      setInput(next === -1 ? '' : history[next]);
    }
  };

  const clear = () => setLines([]);
  const copyAll = () => navigator.clipboard.writeText(lines.map((l) => l.text).join('\n'));

  const shortcuts = ['hermes status', 'hermes doctor', 'hermes skills list', 'docker ps', 'df -h'];

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-tx-primary flex items-center gap-2">
          <Terminal className="text-ac-cyan" /> Terminal
        </h1>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={copyAll}><Copy size={14} /> Copier</Button>
          <Button variant="ghost" size="sm" onClick={clear}><Trash2 size={14} /> Clear</Button>
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <div ref={scrollRef} className="h-[calc(100vh-280px)] min-h-[400px] overflow-y-auto p-4 font-mono text-sm bg-bg-root">
          {lines.map((l) => (
            <div key={l.id} className="whitespace-pre-wrap break-all">
              {l.type === 'cmd' && <span className="text-ac-cyan">$ </span>}
              <span className={l.type === 'err' ? 'text-ac-rose' : l.type === 'cmd' ? 'text-tx-primary' : 'text-tx-secondary'}>
                {l.text}
              </span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 border-t border-bd p-3 bg-bg-base">
          <span className="text-ac-cyan font-mono">$</span>
          <input
            className="flex-1 bg-transparent text-tx-primary font-mono text-sm outline-none"
            placeholder="Commande…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            autoFocus
          />
          <Button size="sm" onClick={() => { exec(input); setInput(''); }} disabled={!input.trim()}>
            <Send size={14} />
          </Button>
        </div>
      </Card>

      <div className="flex flex-wrap gap-2">
        {shortcuts.map((s) => (
          <Badge key={s} color="cyan" className="cursor-pointer" onClick={() => exec(s)}>
            {s}
          </Badge>
        ))}
      </div>
    </div>
  );
}