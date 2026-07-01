'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, BookOpen, MessageSquare, Wrench, Clock,
  History, Settings, Network, Terminal, FileText, Brain,
  ScrollText, Stethoscope, UserCircle, Ghost, Bot, Trello,
  Share2, FileCode2, Workflow, Bell, ChevronDown, Pickaxe, Home,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface NavSection {
  label: string;
  icon: LucideIcon;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    label: 'Core',
    icon: LayoutDashboard,
    items: [
      { href: '/', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/knowledge', label: 'Knowledge', icon: BookOpen },
      { href: '/chat', label: 'Chat', icon: MessageSquare },
      { href: '/graph', label: 'Graph', icon: Network },
    ],
  },
  {
    label: 'System',
    icon: Terminal,
    items: [
      { href: '/skills', label: 'Skills', icon: Wrench },
      { href: '/cron', label: 'Cron', icon: Clock },
      { href: '/sessions', label: 'Sessions', icon: History },
      { href: '/terminal', label: 'Terminal', icon: Terminal },
      { href: '/files', label: 'Files', icon: FileText },
      { href: '/memory', label: 'Memory', icon: Brain },
      { href: '/logs', label: 'Logs', icon: ScrollText },
      { href: '/doctor', label: 'Doctor', icon: Stethoscope },
    ],
  },
  {
    label: 'Workspace',
    icon: Bot,
    items: [
      { href: '/agents', label: 'Agents', icon: Bot },
      { href: '/kanban', label: 'Kanban', icon: Trello },
      { href: '/nodes', label: 'Nodes', icon: Share2 },
      { href: '/holygraph', label: 'Holygraph', icon: Network },
      { href: '/hub', label: 'Hub', icon: Home },
      { href: '/blueprints', label: 'Blueprints', icon: FileCode2 },
      { href: '/workflow', label: 'Workflow', icon: Workflow },
      { href: '/leadminer', label: 'Leadminer', icon: Pickaxe },
    ],
  },
  {
    label: 'Config',
    icon: Settings,
    items: [
      { href: '/profiles', label: 'Profiles', icon: UserCircle },
      { href: '/souls', label: 'Souls', icon: Ghost },
      { href: '/settings', label: 'Settings', icon: Settings },
      { href: '/notifications', label: 'Notifs', icon: Bell },
    ],
  },
];

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggleSection = (label: string) => {
    setCollapsed((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-bg-root/60 backdrop-blur-sm md:hidden" onClick={onClose} />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-sidebar bg-bg-base border-r border-bd',
          'flex flex-col transition-base',
          'md:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Logo */}
        <div className="h-navbar flex items-center px-4 border-b border-bd shrink-0">
          <Link href="/" className="flex items-center gap-2" onClick={onClose}>
            <div className="w-8 h-8 rounded-lg bg-ac-cyan/20 flex items-center justify-center">
              <span className="text-ac-cyan font-bold text-sm">H</span>
            </div>
            <span className="font-display font-semibold text-tx-primary">Hermes</span>
          </Link>
        </div>

        {/* Nav — scrollable */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {navSections.map((section) => {
            const isCollapsed = collapsed[section.label];
            const SectionIcon = section.icon;
            const hasActive = section.items.some(
              (item) => pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href)),
            );

            return (
              <div key={section.label} className="mb-1">
                <button
                  onClick={() => toggleSection(section.label)}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-base',
                    hasActive ? 'text-ac-cyan' : 'text-tx-muted hover:text-tx-secondary',
                  )}
                >
                  <SectionIcon size={12} />
                  <span className="flex-1 text-left">{section.label}</span>
                  <ChevronDown
                    size={12}
                    className={cn('transition-base', isCollapsed && '-rotate-90')}
                  />
                </button>

                {!isCollapsed && (
                  <div className="mt-0.5">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const active =
                        pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={onClose}
                          className={cn(
                            'flex items-center gap-3 px-3 py-1.5 rounded-md text-sm ml-3 transition-base',
                            active
                              ? 'bg-ac-cyan/10 text-ac-cyan font-medium'
                              : 'text-tx-secondary hover:text-tx-primary hover:bg-bd-subtle',
                          )}
                        >
                          <Icon size={16} />
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-bd shrink-0">
          <div className="flex items-center gap-2 px-3 py-1 rounded-md text-xs text-tx-muted">
            <div className="w-2 h-2 rounded-full bg-status-success" />
            <span>v1.0.0</span>
          </div>
        </div>
      </aside>
    </>
  );
}
