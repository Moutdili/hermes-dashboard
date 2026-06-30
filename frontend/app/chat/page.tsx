'use client';

import { MessageSquare } from 'lucide-react';
import { ChatWindow } from '@/components/chat/ChatWindow';

export default function ChatPage() {
  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-tx-primary flex items-center gap-2">
          <MessageSquare className="text-ac-cyan" />
          Chat
        </h1>
        <p className="text-sm text-tx-secondary mt-1">Communication temps réel avec Hermes Agent</p>
      </div>
      <ChatWindow />
    </div>
  );
}