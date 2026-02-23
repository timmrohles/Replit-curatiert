import { BookOpen } from 'lucide-react';

interface DashboardEmptyStateProps {
  icon?: typeof BookOpen;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function DashboardEmptyState({ icon: Icon = BookOpen, title, description, action }: DashboardEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center" data-testid="empty-state">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
        style={{ backgroundColor: '#247ba0', opacity: 0.1 }}
      >
        <Icon className="w-8 h-8" style={{ color: '#247ba0' }} />
      </div>
      <h3
        className="text-xl mb-2"
        style={{ fontFamily: 'Fjalla One', color: 'var(--ds-text-primary, #3A3A3A)' }}
        data-testid="text-empty-title"
      >
        {title}
      </h3>
      <p className="text-sm text-muted-foreground max-w-md mb-6" data-testid="text-empty-description">
        {description}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-white text-sm font-medium transition-colors"
          style={{ backgroundColor: '#247ba0' }}
          data-testid="button-empty-action"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
