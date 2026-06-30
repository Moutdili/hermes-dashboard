'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon, ...props }, ref) => (
    <div className="relative flex items-center">
      {icon && (
        <span className="absolute left-3 text-tx-muted pointer-events-none">{icon}</span>
      )}
      <input
        ref={ref}
        className={cn(
          'w-full h-10 bg-bg-elevated border border-bd rounded-md',
          'text-tx-primary placeholder:text-tx-placeholder',
          'px-3 text-sm transition-base',
          'focus:outline-none focus:border-ac-cyan focus:ring-1 focus:ring-ac-cyan',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          icon && 'pl-10',
          className
        )}
        {...props}
      />
    </div>
  )
);

Input.displayName = 'Input';

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'w-full bg-bg-elevated border border-bd rounded-md',
        'text-tx-primary placeholder:text-tx-placeholder',
        'px-3 py-2 text-sm transition-base resize-y',
        'focus:outline-none focus:border-ac-cyan focus:ring-1 focus:ring-ac-cyan',
        className
      )}
      {...props}
    />
  )
);

Textarea.displayName = 'Textarea';