import { Trophy, Medal, Award as AwardIcon } from "lucide-react";
import { useState } from "react";
import { Text } from "../ui/typography";
import { DSBadge } from "../design-system/DSBadge";

export interface Award {
  status: "winner" | "shortlist" | "longlist";
  name: string;
  year: string;
}

export interface BookAward {
  award_id: number;
  award_name: string;
  award_logo_url?: string;
  edition_year: number;
  edition_label?: string;
  outcome_type: 'winner' | 'shortlist' | 'longlist' | 'nominee' | 'finalist' | 'special';
  outcome_title?: string;
  role?: string;
  notes?: string;
}

interface AwardBadgeProps {
  awards?: Award[];
  bookAwards?: BookAward[];
}

export function AwardBadge({ awards, bookAwards }: AwardBadgeProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const displayAwards: Award[] = bookAwards 
    ? bookAwards.map(ba => ({
        status: ba.outcome_type === 'winner' 
          ? 'winner' 
          : ba.outcome_type === 'shortlist' || ba.outcome_type === 'finalist'
            ? 'shortlist' 
            : 'longlist',
        name: ba.award_name,
        year: ba.edition_year.toString()
      }))
    : awards || [];

  if (!displayAwards || displayAwards.length === 0) return null;

  const sortedAwards = [...displayAwards].sort((a, b) => {
    const priorityMap = { 'winner': 1, 'shortlist': 2, 'longlist': 3 };
    return priorityMap[a.status] - priorityMap[b.status];
  });

  const visibleAwards = sortedAwards.slice(0, 3);

  return (
    <div className="absolute bottom-2 left-2 flex flex-col-reverse gap-1" style={{ zIndex: 52 }}>
      {visibleAwards.map((award, index) => {
        const isWinner = award.status === "winner";
        const isShortlist = award.status === "shortlist";
        
        const bgColor = isWinner 
          ? "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)"
          : isShortlist
            ? "linear-gradient(135deg, #C0C0C0 0%, #A8A8A8 100%)"
            : "linear-gradient(135deg, #CD7F32 0%, #B8860B 100%)";
        
        const iconColor = "#2a2a2a";
        
        const label = award.status === "winner" 
          ? `Gewinner ${award.year}` 
          : award.status === "shortlist" 
            ? `Shortlist ${award.year}` 
            : `Longlist ${award.year}`;

        const shadow = isWinner 
          ? "0 4px 12px rgba(255, 215, 0, 0.4)" 
          : isShortlist
            ? "0 4px 12px rgba(192, 192, 192, 0.4)"
            : "0 4px 12px rgba(205, 127, 50, 0.4)";

        const Icon = isWinner ? Trophy : isShortlist ? Medal : AwardIcon;

        return (
          <div 
            key={index}
            className="relative"
            style={{ 
              transform: `translateY(${-index * 4}px)`,
              zIndex: visibleAwards.length - index
            }}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            data-testid={`badge-award-${index}`}
          >
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg cursor-pointer transition-transform hover:scale-110"
              style={{ 
                background: bgColor,
                boxShadow: shadow
              }}
            >
              <Icon className="w-5 h-5" style={{ color: iconColor, strokeWidth: 2 }} />
            </div>

            {hoveredIndex === index && (
              <div 
                className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-2 rounded-lg shadow-xl whitespace-nowrap z-50 animate-in fade-in slide-in-from-left-2 duration-200"
                style={{
                  backgroundColor: "var(--color-charcoal)",
                  color: "white",
                  minWidth: "180px"
                }}
              >
                <DSBadge variant="award" size="small" data-testid={`badge-award-label-${index}`}>
                  {label}
                </DSBadge>
                <Text variant="xs" className="text-white opacity-90 mt-1">
                  {award.name}
                </Text>
                
                <div 
                  className="absolute right-full top-1/2 -translate-y-1/2"
                  style={{
                    width: 0,
                    height: 0,
                    borderTop: "6px solid transparent",
                    borderBottom: "6px solid transparent",
                    borderRight: `6px solid var(--color-charcoal)`
                  }}
                />
              </div>
            )}
          </div>
        );
      })}
      
      {sortedAwards.length > 3 && (
        <div 
          className="relative"
          style={{ 
            transform: `translateY(${-3 * 4}px)`,
            zIndex: 0
          }}
        >
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg cursor-pointer transition-transform hover:scale-110"
            style={{ 
              background: "linear-gradient(135deg, #888 0%, #666 100%)",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)"
            }}
          >
            <Text variant="xs" className="font-bold text-white">
              +{sortedAwards.length - 3}
            </Text>
          </div>
        </div>
      )}
    </div>
  );
}

export function convertBookAwardToLegacy(bookAward: BookAward): Award {
  return {
    status: bookAward.outcome_type === 'winner' 
      ? 'winner' 
      : bookAward.outcome_type === 'shortlist' || bookAward.outcome_type === 'finalist'
        ? 'shortlist' 
        : 'longlist',
    name: bookAward.award_name,
    year: bookAward.edition_year.toString()
  };
}
