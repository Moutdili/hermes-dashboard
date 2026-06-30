'use client';

import { useState, useEffect, useRef } from 'react';
import { Mic, Video, FileText, Activity, Radio, Play, Pause, Square } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Tabs, TabList, Tab, TabPanel } from '@/components/ui/Tabs';

export default function PretextPage() {
  const [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (recording) {
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [recording]);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="space-y-4 animate-fade-in">
      <h1 className="text-2xl font-bold text-tx-primary flex items-center gap-2">
        <Radio className="text-ac-cyan" /> Pretext
      </h1>

      <Tabs default="overview">
        <TabList>
          <Tab value="overview"><span className="flex items-center gap-1"><Activity size={14} /> Overview</span></Tab>
          <Tab value="audio"><span className="flex items-center gap-1"><Mic size={14} /> Audio</span></Tab>
          <Tab value="video"><span className="flex items-center gap-1"><Video size={14} /> Video</span></Tab>
          <Tab value="video-stable"><span className="flex items-center gap-1"><Video size={14} /> Stable</span></Tab>
          <Tab value="log"><span className="flex items-center gap-1"><FileText size={14} /> Log</span></Tab>
        </TabList>

        {/* Overview */}
        <TabPanel value="overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card hoverable>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Mic size={14} className="text-ac-cyan" /> Audio</CardTitle></CardHeader>
              <CardContent>Transcription audio en temps réel avec faster-whisper</CardContent>
            </Card>
            <Card hoverable>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Video size={14} className="text-ac-purple" /> Video</CardTitle></CardHeader>
              <CardContent>Capture et analyse vidéo frame par frame</CardContent>
            </Card>
            <Card hoverable>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><FileText size={14} className="text-ac-amber" /> Log</CardTitle></CardHeader>
              <CardContent>Journal des sessions et métriques</CardContent>
            </Card>
          </div>
        </TabPanel>

        {/* Audio */}
        <TabPanel value="audio">
          <Card className="flex flex-col items-center py-8">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-4 transition-base ${recording ? 'bg-ac-rose/20 animate-pulse-glow' : 'bg-bg-elevated'}`}>
              <Mic size={36} className={recording ? 'text-ac-rose' : 'text-tx-muted'} />
            </div>
            <div className="text-3xl font-mono font-bold text-tx-primary mb-4">{fmt(duration)}</div>
            <div className="flex gap-3">
              <Button variant={recording ? 'danger' : 'default'} size="lg" onClick={() => setRecording(!recording)}>
                {recording ? <><Square size={18} /> Stop</> : <><Play size={18} /> Record</>}
              </Button>
              <Button variant="outline" size="lg" onClick={() => { setRecording(false); setDuration(0); }}>
                Reset
              </Button>
            </div>
            {recording && <Badge color="rose" className="mt-4 animate-pulse">● REC</Badge>}
          </Card>
        </TabPanel>

        {/* Video */}
        <TabPanel value="video">
          <Card className="flex flex-col items-center py-12">
            <Video size={48} className="text-tx-muted mb-4" />
            <p className="text-sm text-tx-secondary mb-4">Capture vidéo — stream depuis webcam ou screen</p>
            <Button size="lg"><Play size={18} /> Start capture</Button>
            <div className="w-full max-w-md mt-6 h-32 bg-bg-root rounded-lg border border-bd flex items-center justify-center">
              <span className="text-xs text-tx-muted">Preview non disponible en mode démo</span>
            </div>
          </Card>
        </TabPanel>

        {/* Video Stable */}
        <TabPanel value="video-stable">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Video size={14} className="text-status-success" /> Stable Video Pipeline
              </CardTitle>
              <Badge color="green">stable</Badge>
            </CardHeader>
            <CardContent>
              <p className="mb-4">Version stabilisée du pipeline vidéo avec retry et error recovery.</p>
              <div className="space-y-2">
                {['Init capture', 'Frame extraction', 'Stabilization pass', 'Output encoding'].map((step, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <div className="w-6 h-6 rounded-full bg-status-success/20 flex items-center justify-center text-xs text-status-success">{i + 1}</div>
                    <span className="text-tx-primary">{step}</span>
                    <Badge color="green">ok</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabPanel>

        {/* Log */}
        <TabPanel value="log">
          <Card className="p-0">
            <div className="max-h-[500px] overflow-y-auto p-4 font-mono text-xs space-y-1">
              {[
                '[00:00] Pretext initialized — faster-whisper base model',
                '[00:05] Audio device: default (2 channels, 48kHz)',
                '[00:10] Recording started',
                '[00:42] Transcription segment: "bonjour hermes"',
                '[01:15] Recording stopped — 73s total',
                '[01:16] Saved to /tmp/pretext/session-001.wav',
              ].map((line, i) => (
                <div key={i} className="text-tx-secondary">{line}</div>
              ))}
            </div>
          </Card>
        </TabPanel>
      </Tabs>
    </div>
  );
}