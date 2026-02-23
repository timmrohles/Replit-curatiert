import { HorizontalBookRow } from '../carousel/HorizontalBookRow';
import { HorizontalRowSectionProps } from './HorizontalRowSection.schema';
import { Section } from '../ui/section';
import { Container } from '../ui/container';

export function HorizontalRowSection({ section, books = [], className = '' }: HorizontalRowSectionProps) {
  const sectionAny = section as any;
  const title = section.title || sectionAny.config?.title || '';
  const description = section.content?.description || sectionAny.config?.description || '';

  return (
    <Section variant="compact" className={className}>
      <Container>
        {title && (
          <div className="mb-[var(--space-6)]">
            <h2 className="text-fluid-h2 font-headline uppercase text-foreground mb-[var(--space-2)]">
              {title}
            </h2>
            {description && (
              <p className="text-fluid-body text-muted-foreground">
                {description}
              </p>
            )}
          </div>
        )}

        {books.length > 0 ? (
          <HorizontalBookRow books={books as any} />
        ) : (
          <div className="text-center py-[var(--space-8)] border-2 border-dashed rounded-lg border-border">
            <p className="text-muted-foreground">
              Keine Bücher in dieser Sektion
            </p>
          </div>
        )}
      </Container>
    </Section>
  );
}
