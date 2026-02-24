import { useState } from 'react';
import { Gem, Bird, PenLine } from 'lucide-react';

function LaurelWreathIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 21c1-3 1.5-6 1-9" />
      <path d="M19 21c-1-3-1.5-6-1-9" />
      <path d="M4.5 16c-1.5-1-2.5-3-2.5-5 1.5.5 3 1.5 4 3" />
      <path d="M19.5 16c1.5-1 2.5-3 2.5-5-1.5.5-3 1.5-4 3" />
      <path d="M4 11c-1.5-1.5-2-4-1.5-6.5 1.5 1 3 2.5 3.5 4.5" />
      <path d="M20 11c1.5-1.5 2-4 1.5-6.5-1.5 1-3 2.5-3.5 4.5" />
      <path d="M7 5C6 3 5.5 1 6 0c1.5 1 2.5 2.5 3 4.5" />
      <path d="M17 5c1-2 1.5-4 1-5-1.5 1-2.5 2.5-3 4.5" />
      <path d="M12 22V18" />
      <circle cx="12" cy="16" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

const OUTCOME_LABELS: Record<string, string> = {
  winner: 'Gewinner',
  shortlist: 'Shortlist',
  longlist: 'Longlist',
  nominee: 'Nominiert',
  finalist: 'Finalist',
  special: 'Sonderpreis',
};

interface AwardDetail {
  name: string;
  outcome: string;
  year?: number | string;
}

export interface BookEnrichmentData {
  award_count?: number;
  nomination_count?: number;
  is_hidden_gem?: boolean;
  is_indie?: boolean;
  indie_type?: string | null;
  award_details?: AwardDetail[];
}

interface BookEnrichmentBadgesProps {
  book: BookEnrichmentData;
  size?: 'sm' | 'md';
}

function EnrichmentBadge({
  type,
  icon,
  tooltipContent,
  size = 'md',
}: {
  type: string;
  icon: React.ReactNode;
  tooltipContent?: React.ReactNode;
  size?: 'sm' | 'md';
}) {
  const [showTooltip, setShowTooltip] = useState(false);

  const sizeClass = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10';

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <button
        className={`${sizeClass} rounded-full flex items-center justify-center shadow-md transition-transform hover:scale-110 text-white`}
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)' }}
        data-testid={`badge-${type}`}
        onClick={(e) => {
          e.stopPropagation();
          setShowTooltip(!showTooltip);
        }}
      >
        {icon}
      </button>
      {showTooltip && tooltipContent && (
        <div
          className="absolute top-0 right-full mr-2 z-[200] min-w-[200px] max-w-[280px] bg-card border border-border rounded-lg shadow-lg p-3 text-left"
          onClick={(e) => e.stopPropagation()}
        >
          {tooltipContent}
        </div>
      )}
    </div>
  );
}

export function BookEnrichmentBadges({ book, size = 'md' }: BookEnrichmentBadgesProps) {
  const hasAward = book.award_count !== undefined && book.award_count > 0;
  const hasHiddenGem = book.is_hidden_gem && !hasAward;
  const hasIndie = book.is_indie;

  if (!hasAward && !hasHiddenGem && !hasIndie) return null;

  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';
  const tooltipIconSize = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5';

  return (
    <>
      {hasAward && (
        <EnrichmentBadge
          type="award"
          size={size}
          icon={<LaurelWreathIcon className={iconSize} />}
          tooltipContent={
            book.award_details && book.award_details.length > 0 ? (
              <div>
                <p className="text-xs font-semibold text-foreground mb-2">Auszeichnungen</p>
                <ul className="space-y-1.5">
                  {book.award_details.map((d, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs">
                      <LaurelWreathIcon className={`${tooltipIconSize} mt-0.5 flex-shrink-0 text-foreground`} />
                      <span className="text-muted-foreground">
                        <span className="font-medium text-foreground">{OUTCOME_LABELS[d.outcome] || d.outcome}</span>
                        {' '}{d.name}{d.year ? ` ${d.year}` : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : undefined
          }
        />
      )}
      {hasHiddenGem && (
        <EnrichmentBadge
          type="hidden-gem"
          size={size}
          icon={<Gem className={iconSize} />}
          tooltipContent={
            book.award_details && book.award_details.length > 0 ? (
              <div>
                <p className="text-xs font-semibold text-foreground mb-2">Nominierungen</p>
                <ul className="space-y-1.5">
                  {book.award_details.map((d, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs">
                      <Gem className={`${tooltipIconSize} mt-0.5 flex-shrink-0 text-foreground`} />
                      <span className="text-muted-foreground">
                        <span className="font-medium text-foreground">{OUTCOME_LABELS[d.outcome] || d.outcome}</span>
                        {' '}{d.name}{d.year ? ` ${d.year}` : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : undefined
          }
        />
      )}
      {hasIndie && (
        <EnrichmentBadge
          type="indie"
          size={size}
          icon={book.indie_type === 'selfpublisher'
            ? <PenLine className={iconSize} />
            : <Bird className={iconSize} />}
          tooltipContent={
            <div>
              <p className="text-xs font-semibold text-foreground">
                {book.indie_type === 'selfpublisher' ? 'Selfpublisher' : 'Indie-Verlag'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {book.indie_type === 'selfpublisher'
                  ? 'Dieses Buch wurde unabhängig veröffentlicht.'
                  : 'Erschienen bei einem unabhängigen Verlag.'}
              </p>
            </div>
          }
        />
      )}
    </>
  );
}
