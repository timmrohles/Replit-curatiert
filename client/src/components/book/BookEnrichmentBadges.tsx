import { useState, useEffect, useRef } from 'react';
import { Gem, Bird, PenLine, Quote, Award, X } from 'lucide-react';

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

const WIN_OUTCOMES = new Set(['winner', 'special']);

interface AwardDetail {
  name: string;
  outcome: string;
  year?: number | string;
}

interface ReviewDetail {
  source: string;
  quote: string;
}

export interface BookEnrichmentData {
  award_count?: number;
  nomination_count?: number;
  is_hidden_gem?: boolean;
  is_indie?: boolean;
  indie_type?: string | null;
  award_details?: AwardDetail[];
  reviews?: string | ReviewDetail[] | null;
}

interface BookEnrichmentBadgesProps {
  book: BookEnrichmentData;
  size?: 'sm' | 'md';
}

function BadgeModal({
  open,
  onClose,
  title,
  icon,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      className="absolute top-0 right-full mr-2 z-[200] w-[280px] bg-card border border-border rounded-xl shadow-xl text-left animate-in fade-in slide-in-from-right-2 duration-200"
      onClick={(e) => e.stopPropagation()}
      data-testid="badge-modal"
    >
      <div className="flex items-center justify-between gap-2 px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="p-1 rounded-md hover:bg-muted transition-colors"
          data-testid="badge-modal-close"
        >
          <X className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>
      <div className="px-4 pb-4">
        {children}
      </div>
    </div>
  );
}

function EnrichmentBadge({
  type,
  icon,
  modalTitle,
  modalIcon,
  modalContent,
  size = 'md',
}: {
  type: string;
  icon: React.ReactNode;
  modalTitle?: string;
  modalIcon?: React.ReactNode;
  modalContent?: React.ReactNode;
  size?: 'sm' | 'md';
}) {
  const [open, setOpen] = useState(false);

  const sizeClass = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10';

  return (
    <div className="relative inline-flex">
      <button
        className={`${sizeClass} rounded-full flex items-center justify-center shadow-md transition-transform hover:scale-110 text-white`}
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)' }}
        data-testid={`badge-${type}`}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
      >
        {icon}
      </button>
      {modalContent && modalTitle && (
        <BadgeModal
          open={open}
          onClose={() => setOpen(false)}
          title={modalTitle}
          icon={modalIcon || icon}
        >
          {modalContent}
        </BadgeModal>
      )}
    </div>
  );
}

export function BookEnrichmentBadges({ book, size = 'md' }: BookEnrichmentBadgesProps) {
  const hasAwards = book.award_details && book.award_details.length > 0;
  const wins = hasAwards ? book.award_details!.filter(d => WIN_OUTCOMES.has(d.outcome)) : [];
  const nominations = hasAwards ? book.award_details!.filter(d => !WIN_OUTCOMES.has(d.outcome)) : [];
  const hasWins = wins.length > 0;
  const hasNominations = nominations.length > 0;
  const hasIndie = book.is_indie;

  const hasHiddenGem = !!book.is_hidden_gem;
  const hasReviews = !!book.reviews && (
    typeof book.reviews === 'string'
      ? book.reviews.length > 0
      : book.reviews.length > 0
  );

  const showAnything = hasWins || hasNominations || hasIndie || hasHiddenGem || hasReviews;
  if (!showAnything) return null;

  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';
  const modalIconSize = 'w-4 h-4';

  return (
    <>
      {hasWins && (
        <EnrichmentBadge
          type="award"
          size={size}
          icon={<LaurelWreathIcon className={iconSize} />}
          modalTitle={`Auszeichnung${wins.length > 1 ? 'en' : ''}`}
          modalIcon={<LaurelWreathIcon className={`${modalIconSize} text-foreground`} />}
          modalContent={
            <div className="space-y-3">
              <ul className="space-y-2">
                {wins.map((d, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}>
                      <LaurelWreathIcon className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-foreground">
                        {OUTCOME_LABELS[d.outcome] || d.outcome}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {d.name}{d.year ? ` ${d.year}` : ''}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
              {hasNominations && (
                <>
                  <div className="border-t border-border" />
                  <p className="text-xs font-medium text-muted-foreground">Weitere Nominierungen</p>
                  <ul className="space-y-2">
                    {nominations.map((d, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 bg-muted">
                          <Gem className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-foreground">
                            {OUTCOME_LABELS[d.outcome] || d.outcome}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {d.name}{d.year ? ` ${d.year}` : ''}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          }
        />
      )}
      {hasNominations && !hasWins && (
        <EnrichmentBadge
          type="hidden-gem"
          size={size}
          icon={<Gem className={iconSize} />}
          modalTitle={`Nominierung${nominations.length > 1 ? 'en' : ''}`}
          modalIcon={<Gem className={`${modalIconSize} text-foreground`} />}
          modalContent={
            <ul className="space-y-2">
              {nominations.map((d, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 bg-muted">
                    <Gem className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground">
                      {OUTCOME_LABELS[d.outcome] || d.outcome}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {d.name}{d.year ? ` ${d.year}` : ''}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
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
          modalTitle={book.indie_type === 'selfpublisher' ? 'Selfpublisher' : 'Indie-Verlag'}
          modalIcon={book.indie_type === 'selfpublisher'
            ? <PenLine className={`${modalIconSize} text-foreground`} />
            : <Bird className={`${modalIconSize} text-foreground`} />}
          modalContent={
            <p className="text-xs text-muted-foreground">
              {book.indie_type === 'selfpublisher'
                ? 'Dieses Buch wurde unabhängig veröffentlicht — ohne Verlag, direkt von der Autorin oder dem Autor.'
                : 'Erschienen bei einem unabhängigen Verlag. Indie-Verlage stehen für besondere Vielfalt und individuelle Buchkultur.'}
            </p>
          }
        />
      )}
      {hasHiddenGem && (
        <EnrichmentBadge
          type="geheimtipp"
          size={size}
          icon={<Gem className={iconSize} />}
          modalTitle="Geheimtipp"
          modalIcon={<Gem className={`${modalIconSize} text-foreground`} />}
          modalContent={
            <p className="text-xs text-muted-foreground">
              Dieses Buch ist ein Geheimtipp — ein besonderes Werk, das noch nicht die breite Aufmerksamkeit erhalten hat, die es verdient.
            </p>
          }
        />
      )}
      {hasReviews && (
        <EnrichmentBadge
          type="pressestimmen"
          size={size}
          icon={<Quote className={iconSize} />}
          modalTitle="Pressestimmen"
          modalIcon={<Quote className={`${modalIconSize} text-foreground`} />}
          modalContent={
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {typeof book.reviews === 'string' ? (
                <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                  {book.reviews}
                </p>
              ) : (
                (book.reviews as ReviewDetail[]).map((r, i) => (
                  <div key={i} className="flex flex-col gap-1">
                    <p className="text-xs text-muted-foreground leading-relaxed italic">
                      &bdquo;{r.quote}&ldquo;
                    </p>
                    <p className="text-xs font-medium text-foreground">
                      — {r.source}
                    </p>
                    {i < (book.reviews as ReviewDetail[]).length - 1 && (
                      <div className="border-t border-border mt-1" />
                    )}
                  </div>
                ))
              )}
            </div>
          }
        />
      )}
    </>
  );
}
