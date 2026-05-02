import { Inbox } from 'lucide-react';

export function OverviewEmptyState({ message }: { message: string }) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center rounded-xl border border-dashed border-border/70 bg-muted/20 p-4 text-center">
      <Inbox className="size-5 text-muted-foreground" />
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
