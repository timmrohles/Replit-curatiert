import { useTranslation } from 'react-i18next';
import { DashboardPageHeader } from '../../components/dashboard/DashboardPageHeader';
import { useReadingList, type ReadingListStatus } from '../../components/reading-list/ReadingListContext';
import { ImageWithFallback } from '../../components/figma/ImageWithFallback';
import { Text } from '../../components/ui/typography';
import { BookOpen, BookMarked, BookOpenCheck, ChevronRight, Trash2 } from 'lucide-react';
import { useSafeNavigate } from '../../utils/routing';
import { getBookUrl } from '../../utils/bookUrlHelper';

function ReadingListSection({ title, icon: Icon, status, iconColor, iconBg }: {
  title: string;
  icon: typeof BookOpen;
  status: ReadingListStatus;
  iconColor: string;
  iconBg: string;
}) {
  const { getEntriesByStatus, setStatus } = useReadingList();
  const navigate = useSafeNavigate();
  const entries = getEntriesByStatus(status);

  const handleRemove = (bookId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setStatus(bookId, null, { title: '', author: '' });
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4" style={{ color: iconColor }} />
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <span className="text-xs text-muted-foreground">({entries.length})</span>
      </div>

      {entries.length > 0 ? (
        <div className="space-y-2">
          {entries.map(entry => (
            <button
              key={entry.bookId}
              onClick={() => {
                const url = getBookUrl({ id: parseInt(entry.bookId), title: entry.title });
                if (url) navigate(url);
              }}
              className="w-full flex items-center gap-3 p-3 rounded-lg border bg-card text-left hover:border-[#247ba0]/30 transition-colors group"
              data-testid={`reading-list-${status}-${entry.bookId}`}
            >
              {entry.coverImage ? (
                <ImageWithFallback
                  src={entry.coverImage}
                  alt={entry.title}
                  className="w-10 h-14 rounded object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-14 rounded flex items-center justify-center flex-shrink-0" style={{ backgroundColor: iconBg }}>
                  <BookOpen className="w-5 h-5" style={{ color: iconColor }} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <Text variant="small" className="font-medium text-foreground truncate">{entry.title}</Text>
                {entry.author && <Text variant="xs" className="text-muted-foreground truncate">{entry.author}</Text>}
              </div>
              <button
                onClick={(e) => handleRemove(entry.bookId, e)}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-destructive/10 transition-all"
                title="Entfernen"
                data-testid={`reading-list-remove-${entry.bookId}`}
              >
                <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
              </button>
            </button>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-muted-foreground/20 bg-muted/30 px-4 py-5 text-center" data-testid={`reading-list-empty-${status}`}>
          <Text variant="small" className="text-muted-foreground">
            {status === 'gelesen' && 'Noch keine gelesenen Bücher. Markiere Bücher als gelesen, um sie hier zu sehen.'}
            {status === 'lese_ich' && 'Du liest gerade kein Buch. Markiere ein Buch als "Lese ich zurzeit".'}
            {status === 'möchte_lesen' && 'Keine Bücher auf deiner Wunschliste. Entdecke Bücher und merke sie dir!'}
          </Text>
          <button
            onClick={() => navigate('/buecher')}
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[#247ba0] hover:underline"
            data-testid={`reading-list-discover-${status}`}
          >
            Bücher entdecken
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      )}
    </section>
  );
}

export function DashboardReadingLists() {
  const { t } = useTranslation();

  return (
    <div className="space-y-8">
      <DashboardPageHeader
        title={t('dashboardPages.readingListsTitle', 'Meine Leselisten')}
        description={t('dashboardPages.readingListsDesc', 'Behalte den Überblick über deine gelesenen, aktuellen und gewünschten Bücher.')}
      />

      <ReadingListSection
        title={t('dashboardPages.readingListRead', 'Habe ich gelesen')}
        icon={BookOpenCheck}
        status="gelesen"
        iconColor="#16a34a"
        iconBg="rgba(22, 163, 74, 0.1)"
      />

      <ReadingListSection
        title={t('dashboardPages.readingListReading', 'Lese ich zurzeit')}
        icon={BookOpen}
        status="lese_ich"
        iconColor="#247ba0"
        iconBg="rgba(36, 123, 160, 0.1)"
      />

      <ReadingListSection
        title={t('dashboardPages.readingListWant', 'Möchte ich lesen')}
        icon={BookMarked}
        status="möchte_lesen"
        iconColor="#d97706"
        iconBg="rgba(217, 119, 6, 0.1)"
      />
    </div>
  );
}
