import { Inbox } from 'lucide-react';

export function OverviewEmptyState({ message }: { message: string }) {
  return (
    <div className="flex min-h-44 flex-col items-center justify-center rounded-2xl border border-dashed border-primary/25 bg-primary/[0.04] p-5 text-center">
      <div className="flex size-11 items-center justify-center rounded-2xl bg-background text-primary shadow-sm ring-1 ring-primary/10">
        <Inbox className="size-5" />
      </div>
      <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">{message}</p>
    </div>
  );
}
