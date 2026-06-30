'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'default' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variants: Record<Variant, string> = {
  default: 'bg-ac-cyan text-bg-root hover:bg-ac-cyan/80 font-medium',
  outline: 'border border-bd bg-transparent text-tx-primary hover:bg-bd-subtle',
  ghost: 'bg-transparent text-tx-secondary hover:bg-bd-subtle hover:text-tx-primary',
  danger: 'bg-ac-rose text-white hover:bg-ac-rose/80 font-medium',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs rounded-sm',
  md: 'h-10 px-4 text-sm rounded-md',
  lg: 'h-12 px-6 text-base rounded-lg',
  icon: 'h-10 w-10 rounded-md flex items-center justify-center',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-2 transition-base',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ac-cyan',
        'disabled:opacity-50 disabled:pointer-events-none',
        'active:scale-[0.98]',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  )
);

Button.displayName = 'Button';