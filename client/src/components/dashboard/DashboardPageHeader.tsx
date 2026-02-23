interface DashboardPageHeaderProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: typeof import('lucide-react').Plus;
  };
}

export function DashboardPageHeader({ title, description, action }: DashboardPageHeaderProps) {
  const ActionIcon = action?.icon;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
      <div>
        <h1
          className="text-2xl md:text-3xl"
          style={{ fontFamily: 'Fjalla One', color: 'var(--ds-text-primary, #3A3A3A)' }}
          data-testid="text-page-title"
        >
          {title}
        </h1>
        {description && (
          <p className="text-sm text-muted-foreground mt-1" data-testid="text-page-description">
            {description}
          </p>
        )}
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm font-medium transition-colors"
          style={{ backgroundColor: '#247ba0' }}
          data-testid="button-page-action"
        >
          {ActionIcon && <ActionIcon className="w-4 h-4" />}
          {action.label}
        </button>
      )}
    </div>
  );
}
