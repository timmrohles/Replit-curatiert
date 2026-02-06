import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DSText } from './DSTypography';

interface DSPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showPageNumbers?: boolean;
}

export function DSPagination({
  currentPage,
  totalPages,
  onPageChange,
  showPageNumbers = true,
}: DSPaginationProps) {
  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="flex items-center justify-between gap-4">
      {/* Page Info */}
      <DSText variant="caption" color="secondary">
        Seite {currentPage} von {totalPages}
      </DSText>

      {/* Navigation */}
      <div className="flex items-center gap-2">
        {/* Previous Button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!canGoPrevious}
          className="w-8 h-8 flex items-center justify-center rounded-[var(--ds-radius-md)] border border-[var(--ds-border-default)] hover:bg-[var(--ds-hover-overlay)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Vorherige Seite"
        >
          <ChevronLeft className="w-4 h-4 text-[var(--ds-text-secondary)]" />
        </button>

        {/* Page Numbers */}
        {showPageNumbers && (
          <div className="flex items-center gap-1">
            {getPageNumbers().map((page, index) => {
              if (page === '...') {
                return (
                  <span key={`ellipsis-${index}`} className="px-2 text-[var(--ds-text-tertiary)]">
                    ...
                  </span>
                );
              }

              const isActive = page === currentPage;

              return (
                <button
                  key={page}
                  onClick={() => onPageChange(page as number)}
                  className={`w-8 h-8 flex items-center justify-center rounded-[var(--ds-radius-md)] text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[var(--ds-accent-slate-blue)] text-white'
                      : 'text-[var(--ds-text-secondary)] hover:bg-[var(--ds-hover-overlay)]'
                  }`}
                >
                  {page}
                </button>
              );
            })}
          </div>
        )}

        {/* Next Button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!canGoNext}
          className="w-8 h-8 flex items-center justify-center rounded-[var(--ds-radius-md)] border border-[var(--ds-border-default)] hover:bg-[var(--ds-hover-overlay)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Nächste Seite"
        >
          <ChevronRight className="w-4 h-4 text-[var(--ds-text-secondary)]" />
        </button>
      </div>
    </div>
  );
}