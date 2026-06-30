'use client';

import { Menu, Activity } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface NavbarProps {
  onMenuClick: () => void;
}

export function Navbar({ onMenuClick }: NavbarProps) {
  return (
    <header className="h-navbar flex items-center justify-between px-4 border-b border-bd bg-bg-base/80 backdrop-blur-sm sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMenuClick}
          aria-label="Menu"
        >
          <Menu size={20} />
        </Button>
        <div className="flex items-center gap-2 text-sm text-tx-secondary">
          <Activity size={16} className="text-ac-cyan" />
          <span className="hidden sm:inline">Hermes Dashboard</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-status-success/10 border border-status-success/20">
          <div className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
          <span className="text-xs text-status-success font-medium hidden sm:inline">Online</span>
        </div>
      </div>
    </header>
  );
}