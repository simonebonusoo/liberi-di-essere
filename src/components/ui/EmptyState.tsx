import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-brand-200 bg-white/60 py-14 text-center">
      <div className="mb-4 rounded-full bg-brand-100 p-4 text-brand-500">
        {icon ?? <Inbox className="h-7 w-7" />}
      </div>
      <h3 className="heading-serif text-lg text-brand-900">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-brand-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
