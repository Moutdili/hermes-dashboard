'use client';

import { useState, createContext, useContext } from 'react';
import { cn } from '@/lib/utils';

interface TabsContextValue {
  active: string;
  setActive: (v: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

export function Tabs({
  default: defaultValue,
  children,
  className,
}: {
  default: string;
  children: React.ReactNode;
  className?: string;
}) {
  const [active, setActive] = useState(defaultValue);
  return (
    <TabsContext.Provider value={{ active, setActive }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabList({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'flex gap-1 border-b border-bd mb-4 overflow-x-auto',
        className
      )}
    >
      {children}
    </div>
  );
}

export function Tab({ value, children }: { value: string; children: React.ReactNode }) {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('Tab must be inside <Tabs>');
  const isActive = ctx.active === value;
  return (
    <button
      onClick={() => ctx.setActive(value)}
      className={cn(
        'px-4 py-2 text-sm font-medium whitespace-nowrap transition-base',
        'border-b-2 -mb-px',
        isActive
          ? 'text-ac-cyan border-ac-cyan'
          : 'text-tx-secondary border-transparent hover:text-tx-primary'
      )}
    >
      {children}
    </button>
  );
}

export function TabPanel({ value, children }: { value: string; children: React.ReactNode }) {
  const ctx = useContext(TabsContext);
  if (!ctx || ctx.active !== value) return null;
  return <div className="animate-fade-in">{children}</div>;
}