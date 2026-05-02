import { Leaf } from 'lucide-react';

export function SupervisorEmptyState({ message }: { message: string }) {
  return (
    <div className="flex min-h-36 flex-col items-center justify-center rounded-2xl border border-dashed border-primary/25 bg-primary/[0.04] p-6 text-center">
      <Leaf className="size-5 text-primary/80" />
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
