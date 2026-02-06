import { Target } from 'lucide-react';
import { motion } from 'motion/react';
import { ImageWithFallback } from '../figma/ImageWithFallback';

// Recipient categories
export const recipientCategories = [
  {
    id: 'sportbegeisterte',
    label: 'Sportbegeisterte',
    emoji: '⚽',
    description: 'Für Menschen, die Sport und Bewegung lieben',
    tags: ['sport', 'gesundheit', 'aktiv', 'motivation', 'körper'],
    color: '#247ba0',
    image: 'https://images.unsplash.com/photo-1622214628506-f55f72b92b46?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcG9ydHMlMjBmaXRuZXNzfGVufDF8fHx8MTc2NTM0NDE5NHww&ixlib=rb-4.1.0&q=80&w=1080'
  },
  {
    id: 'lesemuffel',
    label: 'Lesemuffel',
    emoji: '📱',
    description: 'Für Menschen, die nicht viel lesen, aber anfangen möchten',
    tags: ['leicht', 'kurz', 'unterhaltsam', 'einstieg', 'zugänglich'],
    color: '#70c1b3',
    image: 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZWFkaW5nJTIwYm9va3xlbnwxfHx8fDE3NjUzODU3NDZ8MA&ixlib=rb-4.1.0&q=80&w=1080'
  },
  {
    id: 'politikinteressierte',
    label: 'Politikinteressierte',
    emoji: '🗳️',
    description: 'Für Menschen, die sich mit Gesellschaft und Politik beschäftigen',
    tags: ['politik', 'gesellschaft', 'nachdenklich', 'aufgeklärt', 'kritisch'],
    color: '#f25f5c',
    image: 'https://images.unsplash.com/photo-1760823259093-4afe89fab881?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm90ZXN0JTIwYWN0aXZpc218ZW58MXx8fHwxNzY1NDQ4NTIxfDA&ixlib=rb-4.1.0&q=80&w=1080'
  },
  {
    id: 'naturliebhaber',
    label: 'Naturliebhaber',
    emoji: '🌿',
    description: 'Für Menschen, die die Natur und Outdoor-Aktivitäten lieben',
    tags: ['natur', 'outdoor', 'reisen', 'abenteuer', 'umwelt'],
    color: '#70c1b3',
    image: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuYXR1cmUlMjBmb3Jlc3R8ZW58MXx8fHwxNzY1MzQ5MTQyfDA&ixlib=rb-4.1.0&q=80&w=1080'
  },
  {
    id: 'kreative',
    label: 'Kreative Köpfe',
    emoji: '🎨',
    description: 'Für Menschen, die sich künstlerisch ausdrücken',
    tags: ['kunst', 'kreativ', 'kultur', 'design', 'innovation'],
    color: '#ffe066',
    image: 'https://images.unsplash.com/flagged/photo-1572392640988-ba48d1a74457?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcnQlMjBwYWludGluZ3xlbnwxfHx8fDE3NjU0MDE2MjJ8MA&ixlib=rb-4.1.0&q=80&w=1080'
  },
  {
    id: 'feministinnen',
    label: 'Feminist:innen',
    emoji: '✊',
    description: 'Für Menschen, die sich für Gleichberechtigung einsetzen',
    tags: ['feminismus', 'diversität', 'gesellschaft', 'emanzipation', 'gender'],
    color: '#f25f5c',
    image: 'https://images.unsplash.com/photo-1495837174058-628aafc7d610?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21lbiUyMGVtcG93ZXJtZW50fGVufDF8fHx8MTc2NTM3MjY5Mnww&ixlib=rb-4.1.0&q=80&w=1080'
  },
  {
    id: 'techbegeisterte',
    label: 'Tech-Begeisterte',
    emoji: '💻',
    description: 'Für Menschen, die sich für Technologie interessieren',
    tags: ['tech', 'wissenschaft', 'zukunft', 'innovation', 'digital'],
    color: '#247ba0',
    image: 'https://images.unsplash.com/photo-1665936653831-211c14d123ea?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWNobm9sb2d5JTIwY29tcHV0ZXJ8ZW58MXx8fHwxNzY1MzU2MDIyfDA&ixlib=rb-4.1.0&q=80&w=1080'
  },
  {
    id: 'selbstfuersorge',
    label: 'Selbstfürsorge-Suchende',
    emoji: '🧘',
    description: 'Für Menschen, die auf ihre mentale Gesundheit achten',
    tags: ['selbstfürsorge', 'mental_health', 'achtsamkeit', 'ruhe', 'psychologie'],
    color: '#70c1b3',
    image: 'https://images.unsplash.com/photo-1695795910772-6336b0beba36?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpdGF0aW9uJTIwd2VsbG5lc3N8ZW58MXx8fHwxNzY1MzI4Njg4fDA&ixlib=rb-4.1.0&q=80&w=1080'
  }
];

interface RecipientCategoryGridProps {
  onCategoryClick?: (categoryId: string) => void;
}

export function RecipientCategoryGrid({ onCategoryClick }: RecipientCategoryGridProps) {
  return (
    <section className="py-16 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div
            className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full"
            style={{ backgroundColor: 'rgba(255, 224, 102, 0.2)' }}
          >
            <Target size={20} style={{ color: '#3A3A3A' }} />
            <span style={{ color: '#3A3A3A' }}>Zielgruppen-Finder</span>
          </div>
          <h2
            style={{
              fontFamily: 'Fjalla One',
              fontSize: '2.5rem',
              color: '#3A3A3A',
              lineHeight: '1.2',
              marginBottom: '1rem'
            }}
          >
            Ich suche etwas für...
          </h2>
          <p
            style={{
              color: '#3A3A3A',
              fontSize: '1.125rem',
              lineHeight: '1.6',
              maxWidth: '42rem',
              margin: '0 auto'
            }}
          >
            Wähle eine Zielgruppe und entdecke kuratierte Empfehlungen mit persönlichen Rezensionen
          </p>
        </div>

        {/* Recipient Selection Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {recipientCategories.map((recipient) => (
            <motion.button
              key={recipient.id}
              onClick={() => onCategoryClick?.(recipient.id)}
              className="relative overflow-hidden rounded-lg text-left transition-all duration-300"
              style={{
                border: '3px solid transparent',
                cursor: 'pointer',
                aspectRatio: '2/3', // 2:3 Format für alle Bildschirmgrößen
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Background Image */}
              <div className="absolute inset-0">
                <ImageWithFallback
                  src={recipient.image}
                  alt={recipient.label}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Overlay */}
              <div 
                className="absolute inset-0 transition-all duration-300"
                style={{
                  background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 100%)'
                }}
              />

              {/* Content */}
              <div className="absolute inset-0 p-3 md:p-4 flex flex-col justify-end">
                <h3
                  style={{
                    fontFamily: 'Fjalla One',
                    fontSize: 'clamp(1rem, 2.5vw, 1.25rem)', // Responsive font size
                    color: '#FFFFFF',
                    marginBottom: '0.25rem',
                    textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                  }}
                >
                  {recipient.label}
                </h3>
                <p style={{ 
                  color: '#FFFFFF', 
                  fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)', // Responsive font size
                  lineHeight: '1.3',
                  textShadow: '0 1px 3px rgba(0,0,0,0.5)'
                }}>
                  {recipient.description}
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
}