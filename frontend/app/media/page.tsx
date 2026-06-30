'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, SkipBack, SkipForward, Music } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

const tracks = [
  { title: 'Ambient — Chill Marais', artist: 'Hermes', duration: '3:42' },
  { title: 'Synthwave — btop nights', artist: 'Mio', duration: '4:15' },
  { title: 'Lo-fi — coding session', artist: 'Hermes', duration: '2:58' },
];

export default function MediaPlayerPage() {
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (playing) {
      timerRef.current = setInterval(() => {
        setProgress((p) => p >= 100 ? 0 : p + 0.5);
      }, 150);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [playing]);

  const track = tracks[current];

  return (
    <div className="space-y-4 animate-fade-in">
      <h1 className="text-2xl font-bold text-tx-primary flex items-center gap-2">
        <Music className="text-ac-cyan" /> Media Player
      </h1>

      {/* Now playing */}
      <Card className="flex flex-col items-center py-8">
        <div className={`w-32 h-32 rounded-xl bg-gradient-to-br from-ac-cyan/20 to-ac-purple/20 flex items-center justify-center mb-4 ${playing ? 'animate-pulse-glow' : ''}`}>
          <Music size={48} className="text-ac-cyan" />
        </div>
        <h2 className="text-lg font-semibold text-tx-primary">{track.title}</h2>
        <p className="text-sm text-tx-secondary">{track.artist}</p>
        <Badge color="cyan" className="mt-2">{track.duration}</Badge>

        {/* Progress */}
        <div className="w-full max-w-md mt-6">
          <div className="h-1.5 bg-bg-elevated rounded-full overflow-hidden">
            <div className="h-full bg-ac-cyan transition-base" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 mt-6">
          <Button variant="ghost" size="icon" onClick={() => setCurrent((c) => (c - 1 + tracks.length) % tracks.length)}>
            <SkipBack size={20} />
          </Button>
          <Button size="lg" onClick={() => setPlaying(!playing)} className="rounded-full w-14 h-14 p-0">
            {playing ? <Pause size={24} /> : <Play size={24} />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setCurrent((c) => (c + 1) % tracks.length)}>
            <SkipForward size={20} />
          </Button>
        </div>
      </Card>

      {/* Playlist */}
      <Card className="p-0">
        <div className="p-3 border-b border-bd">
          <h3 className="text-sm font-semibold text-tx-primary">Playlist</h3>
        </div>
        {tracks.map((t, i) => (
          <div
            key={i}
            onClick={() => { setCurrent(i); setPlaying(true); setProgress(0); }}
            className={`flex items-center gap-3 px-4 py-3 border-b border-bd-subtle last:border-0 cursor-pointer transition-base hover:bg-bd-subtle ${i === current ? 'bg-ac-cyan/5' : ''}`}
          >
            <div className={`w-8 h-8 rounded flex items-center justify-center ${i === current ? 'bg-ac-cyan/20' : 'bg-bg-elevated'}`}>
              {i === current && playing ? <Pause size={14} className="text-ac-cyan" /> : <Play size={14} className="text-tx-muted" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm truncate ${i === current ? 'text-ac-cyan font-medium' : 'text-tx-primary'}`}>{t.title}</p>
              <p className="text-xs text-tx-muted">{t.artist}</p>
            </div>
            <span className="text-xs text-tx-muted">{t.duration}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}