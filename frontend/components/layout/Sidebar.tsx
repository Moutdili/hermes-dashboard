'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BookOpen,
  MessageSquare,
  Wrench,
  Clock,
  History,
  Settings,
  Network,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/knowledge', label: 'Knowledge', icon: BookOpen },
  { href: '/chat', label: 'Chat', icon: MessageSquare },
  { href: '/skills', label: 'Skills', icon: Wrench },
  { href: '/cron', label: 'Cron', icon: Clock },
  { href: '/sessions', label: 'Sessions', icon: History },
  { href: '/graph', label: 'Graph', icon: Network },
  { href: '/settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-bg-root/60 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-sidebar bg-bg-base border-r border-bd',
          'flex flex-col transition-base',
          'md:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="h-navbar flex items-center px-4 border-b border-bd">
          <Link href="/" className="flex items-center gap-2" onClick={onClose}>
            <div className="w-8 h-8 rounded-lg bg-ac-cyan/20 flex items-center justify-center">
              <span className="text-ac-cyan font-bold text-sm">H</span>
            </div>
            <span className="font-display font-semibold text-tx-primary">Hermes</span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-base',
                  active
                    ? 'bg-ac-cyan/10 text-ac-cyan font-medium'
                    : 'text-tx-secondary hover:text-tx-primary hover:bg-bd-subtle'
                )}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-bd">
          <div className="flex items-center gap-2 px-3 py-2 rounded-md text-xs text-tx-muted">
            <div className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
            <span>v0.4.0 · Phase 4</span>
          </div>
        </div>
      </aside>
    </>
  );
}