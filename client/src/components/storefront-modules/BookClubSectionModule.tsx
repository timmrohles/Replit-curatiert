import { Calendar, Users, Book } from 'lucide-react';
import { Button } from '../ui/button';
import { ImageWithFallback } from '../figma/ImageWithFallback';

interface BookClubSectionModuleProps {
  authorName: string;
  currentBook: {
    cover: string;
    title: string;
    author: string;
  };
  nextMeetingDate: string;
  nextMeetingTime?: string;
  memberCount?: number;
  backgroundColor?: string;
  onJoinBookClub?: () => void;
}

export function BookClubSectionModule({ 
  authorName,
  currentBook,
  nextMeetingDate,
  nextMeetingTime = '19:00 Uhr',
  memberCount = 45,
  backgroundColor = '#F5F5F5',
  onJoinBookClub
}: BookClubSectionModuleProps) {
  
  return (
    <section 
      className="py-16 px-4 md:px-8"
      style={{ backgroundColor }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Mini Header */}
        <div className="mb-8 text-center">
          <h2 
            className="mb-2"
            style={{ 
              fontFamily: 'Fjalla One',
              color: '#3A3A3A'
            }}
          >
            Buchclub mit {authorName}
          </h2>
          <p style={{ color: '#666666' }}>
            Gemeinsam lesen, diskutieren und die Geschichten erleben
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl p-8 md:p-12" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Current Book */}
            <div className="flex flex-col items-center md:items-start">
              <div className="mb-4 text-sm" style={{ color: '#999999' }}>
                AKTUELLES BUCH
              </div>
              <div className="flex gap-6 mb-6">
                <div className="w-32 flex-shrink-0">
                  <ImageWithFallback
                    src={currentBook.cover}
                    alt={currentBook.title}
                    className="w-full rounded-lg shadow-lg"
                  />
                </div>
                <div className="flex flex-col justify-center">
                  <h3 
                    className="mb-1"
                    style={{ 
                      fontFamily: 'Fjalla One',
                      color: '#3A3A3A'
                    }}
                  >
                    {currentBook.title}
                  </h3>
                  <p style={{ color: '#666666' }}>
                    {currentBook.author}
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="flex gap-6 mb-6">
                <div className="flex items-center gap-2" style={{ color: '#666666' }}>
                  <Users className="w-5 h-5 text-[#247ba0]" />
                  <span>{memberCount} Teilnehmer:innen</span>
                </div>
              </div>
            </div>

            {/* Right: Next Meeting */}
            <div>
              <div className="bg-gradient-to-br from-[#247ba0] to-[#70c1b3] rounded-xl p-8 text-white">
                <div className="flex items-center gap-3 mb-6">
                  <Calendar className="w-6 h-6" />
                  <div>
                    <div className="text-sm opacity-90">NÄCHSTER TERMIN</div>
                    <div 
                      className="mt-1"
                      style={{ 
                        fontFamily: 'Fjalla One',
                        fontSize: '24px'
                      }}
                    >
                      {nextMeetingDate}
                    </div>
                    <div className="text-sm opacity-90">{nextMeetingTime}</div>
                  </div>
                </div>

                <div className="space-y-3 mb-6 text-sm">
                  <div className="flex items-start gap-2">
                    <Book className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Live-Diskussion mit {authorName}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Book className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Exklusive Q&A Session</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Book className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Austausch mit anderen Leser:innen</span>
                  </div>
                </div>

                <Button
                  onClick={onJoinBookClub}
                  className="w-full bg-white text-[#247ba0] hover:bg-gray-100"
                  style={{ borderRadius: '8px' }}
                >
                  Am Buchclub teilnehmen
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
