import { cn } from '@/lib/utils';

type Color = 'cyan' | 'purple' | 'green' | 'amber' | 'rose' | 'gray';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  color?: Color;
}

const colors: Record<Color, string> = {
  cyan: 'bg-ac-cyan/10 text-ac-cyan border-ac-cyan/20',
  purple: 'bg-ac-purple/10 text-ac-purple border-ac-purple/20',
  green: 'bg-ac-green/10 text-ac-green border-ac-green/20',
  amber: 'bg-ac-amber/10 text-ac-amber border-ac-amber/20',
  rose: 'bg-ac-rose/10 text-ac-rose border-ac-rose/20',
  gray: 'bg-tx-muted/10 text-tx-secondary border-bd',
};

export function Badge({ className, color = 'gray', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full',
        'border text-xs font-medium whitespace-nowrap',
        colors[color],
        className
      )}
      {...props}
    />
  );
}