import { cn } from '@/lib/utils';

export function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'inline-block h-4 w-4 animate-spin rounded-full border-2',
        'border-bd border-t-ac-cyan',
        className
      )}
    />
  );
}

export function LoadingState({ label = 'Chargement…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <Spinner className="h-8 w-8" />
      <p className="text-sm text-tx-secondary">{label}</p>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {icon && <div className="mb-4 text-tx-muted">{icon}</div>}
      <h3 className="text-lg font-semibold text-tx-primary mb-1">{title}</h3>
      {description && <p className="text-sm text-tx-secondary max-w-md">{description}</p>}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="text-2xl mb-2">⚠️</div>
      <p className="text-sm text-ac-rose">{message}</p>
    </div>
  );
}