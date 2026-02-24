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
      <div className="w-14 h-14 rounded-full flex items-center justify-center mb-5 bg-[#247ba0]/[0.08] dark:bg-[#247ba0]/[0.15]">
        <Icon className="w-6 h-6 text-[#247ba0]" />
      </div>
      <h3
        className="text-lg mb-2 text-gray-800 dark:text-gray-100"
        style={{ fontFamily: 'Fjalla One' }}
        data-testid="text-empty-title"
      >
        {title}
      </h3>
      <p className="text-sm max-w-md mb-6 text-gray-600 dark:text-gray-400" data-testid="text-empty-description">
        {description}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-white text-sm font-medium transition-colors bg-[#247ba0] hover:bg-[#1d6584]"
          data-testid="button-empty-action"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
