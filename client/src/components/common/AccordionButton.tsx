/**
 * AccordionButton Component
 * Wiederverwendbarer Accordion-Header für die BookDetailPage
 * Folgt dem coratiert.de Design System
 */

import { ChevronDown } from "lucide-react";
import { Heading } from "./ui/typography";

interface AccordionButtonProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}

export function AccordionButton({ 
  title, 
  isOpen, 
  onToggle,
  className = ""
}: AccordionButtonProps) {
  return (
    <button
      type="button"
      className={`flex items-center justify-between w-full cursor-pointer mb-4 transition-opacity hover:opacity-80 ${className}`}
      onClick={onToggle}
      aria-expanded={isOpen}
      aria-label={`${title} ${isOpen ? 'zuklappen' : 'aufklappen'}`}
    >
      <Heading 
        as="h2"
        variant="h2"
        className="text-center flex-1 text-shadow-sm text-white"
      >
        {title}
      </Heading>
      <ChevronDown 
        className={`text-white transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        size={24}
        aria-hidden="true"
      />
    </button>
  );
}
