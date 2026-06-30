'use client';

import { useState, useEffect, useRef } from 'react';
import { Music, Play, Pause, RotateCcw } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

// Strudel — live coding musical pattern (simplified visual)
const pattern = [
  { time: 0, note: 'C', freq: 261.63 },
  { time: 250, note: 'E', freq: 329.63 },
  { time: 500, note: 'G', freq: 392.00 },
  { time: 750, note: 'B', freq: 493.88 },
  { time: 1000, note: 'C', freq: 523.25 },
];

export default function StrudelPage() {
  const [playing, setPlaying] = useState(false);
  const [step, setStep] = useState(0);
  const [bpm, setBpm] = useState(120);
  const audioRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!playing) return;
    const interval = setInterval(() => {
      setStep((s) => (s + 1) % pattern.length);
      // Web Audio beep
      try {
        if (!audioRef.current) audioRef.current = new AudioContext();
        const ctx = audioRef.current;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = pattern[step % pattern.length].freq;
        osc.connect(gain);
        gain.connect(ctx.destination);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      } catch {}
    }, (60000 / bpm) / 2);
    return () => clearInterval(interval);
  }, [playing, bpm, step]);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-tx-primary flex items-center gap-2">
          <Music className="text-ac-cyan" /> Strudel
        </h1>
        <Badge color="cyan">{bpm} BPM</Badge>
      </div>

      <Card className="flex flex-col items-center py-8">
        <div className="flex gap-2 mb-6">
          {pattern.map((p, i) => (
            <div
              key={i}
              className={`w-16 h-16 rounded-lg border-2 flex items-center justify-center transition-base ${
                playing && step === i
                  ? 'border-ac-cyan bg-ac-cyan/20 scale-110 shadow-glow'
                  : 'border-bd bg-bg-elevated'
              }`}
            >
              <span className={`text-lg font-bold ${playing && step === i ? 'text-ac-cyan' : 'text-tx-muted'}`}>{p.note}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setPlaying(!playing)} size="lg">
            {playing ? <Pause size={18} /> : <Play size={18} />}
            {playing ? 'Pause' : 'Play'}
          </Button>
          <Button variant="outline" size="lg" onClick={() => { setPlaying(false); setStep(0); }}>
            <RotateCcw size={18} /> Reset
          </Button>
        </div>
        <input
          type="range" min={60} max={200} value={bpm}
          onChange={(e) => setBpm(Number(e.target.value))}
          className="mt-6 w-64 accent-ac-cyan"
        />
      </Card>
    </div>
  );
}