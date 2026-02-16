import { useDashboardFeed, type FeedSectionType } from './DashboardFeedContext';
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  BookOpen,
  Heart,
  PenTool,
  Users,
  Building2,
  Tag,
  Hash,
  Star,
  Sparkles,
  Pencil,
  Check,
  RotateCcw,
  GripVertical,
  Eye,
  EyeOff,
  Globe,
  Lock,
} from 'lucide-react';
import type { FeedSectionConfig } from './DashboardFeedContext';

const SECTION_ICONS: Record<string, typeof BookOpen> = {
  BookOpen: BookOpen,
  Heart: Heart,
  PenTool: PenTool,
  Users: Users,
  Building2: Building2,
  Tag: Tag,
  Hash: Hash,
  Star: Star,
  Sparkles: Sparkles,
};

const SECTION_EMPTY: Record<FeedSectionType, { text: string; icon: typeof BookOpen }> = {
  reading_list: { text: 'Du hast noch keine Bücher auf deiner Leseliste', icon: BookOpen },
  favorites: { text: 'Du hast noch keine Favoriten', icon: Heart },
  followed_authors: { text: 'Du folgst noch keinen Autor:innen', icon: PenTool },
  followed_curators: { text: 'Du folgst noch keinen Kurator:innen', icon: Users },
  followed_publishers: { text: 'Du folgst noch keinen Verlagen', icon: Building2 },
  followed_categories: { text: 'Du folgst noch keinen Kategorien', icon: Tag },
  followed_tags: { text: 'Du folgst noch keinen Themen', icon: Hash },
  recent_ratings: { text: 'Du hast noch keine Bewertungen abgegeben', icon: Star },
  recommendations: { text: 'Empfehlungen basierend auf deinen Interessen', icon: Sparkles },
};

function SectionPlaceholder({ sectionId }: { sectionId: FeedSectionType }) {
  const config = SECTION_EMPTY[sectionId];
  const Icon = config.icon;

  return (
    <div
      className="flex flex-col items-center justify-center rounded-lg py-8 px-4"
      style={{ backgroundColor: '#F3F4F6' }}
      data-testid={`placeholder-${sectionId}`}
    >
      <Icon className="w-8 h-8 mb-2" style={{ color: '#9CA3AF' }} />
      <p className="text-sm text-center" style={{ color: '#6B7280' }}>
        {config.text}
      </p>
    </div>
  );
}

function FeedSectionCard({
  section,
  isEditMode,
  onToggleVisibility,
  onTogglePublic,
}: {
  section: FeedSectionConfig;
  isEditMode: boolean;
  onToggleVisibility: () => void;
  onTogglePublic: () => void;
}) {
  const SectionIcon = SECTION_ICONS[section.icon] || BookOpen;

  return (
    <div
      className="rounded-lg border p-4"
      style={{
        backgroundColor: '#FFFFFF',
        borderColor: '#E5E7EB',
        opacity: !section.visible && isEditMode ? 0.5 : 1,
      }}
      data-testid={`feed-section-${section.id}`}
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <SectionIcon className="w-5 h-5 flex-shrink-0" style={{ color: '#247ba0' }} />
          <h3
            className="text-base truncate"
            style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}
          >
            {section.label}
          </h3>
          <span className="text-xs flex-shrink-0" style={{ color: '#9CA3AF' }}>
            0 Einträge
          </span>
        </div>

        {isEditMode && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={onToggleVisibility}
              data-testid={`toggle-visibility-${section.id}`}
              className="p-1.5 rounded-md"
              style={{ color: section.visible ? '#247ba0' : '#9CA3AF' }}
            >
              {section.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
            <button
              onClick={onTogglePublic}
              data-testid={`toggle-public-${section.id}`}
              className="p-1.5 rounded-md"
              style={{ color: section.isPublic ? '#247ba0' : '#9CA3AF' }}
            >
              {section.isPublic ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            </button>
          </div>
        )}
      </div>

      <SectionPlaceholder sectionId={section.id} />
    </div>
  );
}

function SortableFeedSection({
  section,
  isEditMode,
  onToggleVisibility,
  onTogglePublic,
}: {
  section: FeedSectionConfig;
  isEditMode: boolean;
  onToggleVisibility: () => void;
  onTogglePublic: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id, disabled: !isEditMode });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    position: 'relative' as const,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div className="flex gap-2">
        {isEditMode && (
          <div
            className="flex items-start pt-5 cursor-grab"
            style={{ color: '#9CA3AF' }}
            {...attributes}
            {...listeners}
            data-testid={`drag-handle-${section.id}`}
          >
            <GripVertical className="w-5 h-5" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <FeedSectionCard
            section={section}
            isEditMode={isEditMode}
            onToggleVisibility={onToggleVisibility}
            onTogglePublic={onTogglePublic}
          />
        </div>
      </div>
    </div>
  );
}

export function DashboardFeed() {
  const {
    sections,
    reorderSections,
    toggleVisibility,
    togglePublic,
    isEditMode,
    setEditMode,
    resetToDefaults,
  } = useDashboardFeed();

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorderSections(active.id as string, over.id as string);
    }
  };

  const visibleSections = isEditMode
    ? sections
    : sections.filter((s) => s.visible);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2
          className="text-lg"
          style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}
          data-testid="text-feed-heading"
        >
          Mein Feed
        </h2>
        <div className="flex items-center gap-2">
          {isEditMode && (
            <button
              onClick={resetToDefaults}
              data-testid="button-reset-feed"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border"
              style={{ color: '#6B7280', borderColor: '#E5E7EB' }}
            >
              <RotateCcw className="w-4 h-4" />
              Zurücksetzen
            </button>
          )}
          <button
            onClick={() => setEditMode(!isEditMode)}
            data-testid="button-toggle-edit-mode"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm"
            style={{
              backgroundColor: isEditMode ? '#247ba0' : 'transparent',
              color: isEditMode ? '#FFFFFF' : '#247ba0',
              border: isEditMode ? 'none' : '1px solid #E5E7EB',
            }}
          >
            {isEditMode ? (
              <>
                <Check className="w-4 h-4" />
                Fertig
              </>
            ) : (
              <>
                <Pencil className="w-4 h-4" />
                Anpassen
              </>
            )}
          </button>
        </div>
      </div>

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={visibleSections.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-4">
            {visibleSections.map((section) => (
              <SortableFeedSection
                key={section.id}
                section={section}
                isEditMode={isEditMode}
                onToggleVisibility={() => toggleVisibility(section.id)}
                onTogglePublic={() => togglePublic(section.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
