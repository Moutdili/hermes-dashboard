'use client';

import { useEffect, useRef, useState } from 'react';
import { Send, MessageSquare, Wifi, WifiOff } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { MarkdownRenderer } from '@/components/shared/MarkdownRenderer';
import { WsClient } from '@/lib/ws';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const wsRef = useRef<WsClient | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ws = new WsClient(`${window.location.origin}/api/chat/ws`);
    wsRef.current = ws;

    ws.on('open', () => setConnected(true));
    ws.on('close', () => setConnected(false));
    ws.on('message', (data: any) => {
      if (data.type === 'token') {
        setStreaming(true);
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last && last.role === 'assistant') {
            return [...prev.slice(0, -1), { ...last, content: last.content + data.content }];
          }
          return [...prev, {
            id: Date.now(),
            role: 'assistant',
            content: data.content,
            timestamp: new Date().toISOString(),
          }];
        });
      } else if (data.type === 'done') {
        setStreaming(false);
      }
    });

    ws.connect();
    return () => ws.close();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const send = () => {
    if (!input.trim() || !connected) return;
    const msg: Message = {
      id: Date.now(),
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, msg]);
    wsRef.current?.send({ type: 'message', content: input });
    setInput('');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] min-h-[500px]">
      {/* Status bar */}
      <div className="flex items-center justify-between mb-3">
        <Badge color={connected ? 'green' : 'rose'}>
          {connected ? <Wifi size={12} /> : <WifiOff size={12} />}
          {connected ? 'Connecté' : 'Déconnecté'}
        </Badge>
        {streaming && <Badge color="cyan">Streaming…</Badge>}
      </div>

      {/* Messages */}
      <Card className="flex-1 overflow-hidden p-0">
        <div ref={scrollRef} className="h-full overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageSquare size={32} className="text-tx-muted mb-3" />
              <p className="text-sm text-tx-secondary">Envoie un message pour commencer</p>
            </div>
          ) : (
            messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))
          )}
        </div>
      </Card>

      {/* Input */}
      <div className="mt-3 flex gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Écris ton message… (Enter pour envoyer, Shift+Enter pour newline)"
          className="min-h-[44px] max-h-32"
          rows={1}
        />
        <Button onClick={send} disabled={!connected || !input.trim()} size="lg">
          <Send size={18} />
        </Button>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-lg px-4 py-2 ${
          isUser
            ? 'bg-ac-cyan/10 border border-ac-cyan/20'
            : 'glass'
        }`}
      >
        {isUser ? (
          <p className="text-sm text-tx-primary whitespace-pre-wrap">{message.content}</p>
        ) : (
          <MarkdownRenderer content={message.content} />
        )}
      </div>
    </div>
  );
}