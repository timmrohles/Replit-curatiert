import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ListPlus, List, CheckCircle, BookOpen, Bookmark } from 'lucide-react';
import { Button } from '../ui/button';
import { Text } from '../ui/typography';
import { useReadingList, type ReadingListStatus } from './ReadingListContext';

interface ReadingListButtonProps {
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  bookCover?: string;
  size?: 'sm' | 'md';
  iconColor?: string;
}

const STATUS_OPTIONS: { status: ReadingListStatus; label: string; icon: typeof CheckCircle }[] = [
  { status: 'gelesen', label: 'Habe ich gelesen', icon: CheckCircle },
  { status: 'lese_ich', label: 'Lese ich zurzeit', icon: BookOpen },
  { status: 'möchte_lesen', label: 'Möchte ich lesen', icon: Bookmark },
];

export function ReadingListButton({
  bookId,
  bookTitle,
  bookAuthor,
  bookCover,
  size = 'md',
  iconColor = '#3A3A3A',
}: ReadingListButtonProps) {
  const { getStatus, setStatus } = useReadingList();
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number } | null>(null);

  const currentEntry = getStatus(bookId);
  const hasStatus = currentEntry !== null;

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setPopoverPos({
      top: rect.top + window.scrollY,
      left: rect.left + rect.width / 2 + window.scrollX,
    });
  }, []);

  const handleToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOpen) {
      updatePosition();
    }
    setIsOpen(prev => !prev);
  }, [isOpen, updatePosition]);

  const handleSelect = useCallback((selectedStatus: ReadingListStatus) => {
    const isActive = currentEntry?.status === selectedStatus;
    setStatus(
      bookId,
      isActive ? null : selectedStatus,
      { title: bookTitle, author: bookAuthor, coverImage: bookCover }
    );
    setIsOpen(false);
  }, [bookId, bookTitle, bookAuthor, bookCover, currentEntry, setStatus]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleScroll = () => setIsOpen(false);

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen]);

  const IconComponent = hasStatus ? List : ListPlus;

  return (
    <>
      <Button
        ref={buttonRef}
        variant="ghost"
        size="icon"
        className={`${size === 'sm' ? 'h-8 w-8 md:h-9 md:w-9' : 'h-10 w-10 md:h-11 md:w-11'} shadow-none`}
        onClick={handleToggle}
        title="Leseliste"
        data-testid={`button-reading-list-${bookId}`}
      >
        <IconComponent
          className={size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'}
          style={{ strokeWidth: 1.5, color: hasStatus ? '#247ba0' : iconColor }}
        />
      </Button>

      {isOpen && popoverPos && createPortal(
        <div
          ref={popoverRef}
          className="fixed bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-[9999]"
          style={{
            top: popoverPos.top - 8,
            left: popoverPos.left,
            transform: 'translate(-50%, -100%)',
            minWidth: '200px',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {STATUS_OPTIONS.map(({ status, label, icon: StatusIcon }) => {
            const isActive = currentEntry?.status === status;
            return (
              <button
                key={status}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelect(status);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:opacity-80 transition-opacity"
                style={{
                  backgroundColor: isActive ? 'rgba(36, 123, 160, 0.1)' : 'transparent',
                  color: isActive ? '#247ba0' : '#3A3A3A',
                }}
                data-testid={`button-reading-status-${status}`}
              >
                <StatusIcon
                  className="w-4 h-4 flex-shrink-0"
                  style={{ color: isActive ? '#247ba0' : '#6B7280' }}
                />
                <Text
                  as="span"
                  variant="small"
                  className="!normal-case !tracking-normal whitespace-nowrap"
                  style={{ color: isActive ? '#247ba0' : '#3A3A3A' }}
                >
                  {label}
                </Text>
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </>
  );
}
