import { useParams } from 'react-router-dom';
import { useSafeNavigate } from '../utils/routing';
import React, { useEffect, useState } from 'react';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { BookCard } from '../components/book/BookCard';
import { Youtube, Instagram, Twitter, Linkedin, Globe, Heart, Share2 } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

// Mock data - In a real app, this would come from an API
const MAURICE_AVATAR = 'https://images.unsplash.com/photo-1731983568664-9c1d8a87e7a2?w=800';
const MAURICE_BANNER = 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1600';

interface Book {
  id: string;
  cover: string;
  title: string;
  author: string;
  price: string;
  publisher: string;
  year: string;
  category: string;
  tags: string[];
  followCount: number;
  awards: number;
  reviewCount: number;
}

const CREATOR_DATA: Record<string, {
  name: string;
  focus: string;
  bio: string;
  avatar: string;
  banner: string;
  books: Book[];
  socialMedia?: {
    youtube?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
    website?: string;
  };
}> = {
  'maurice-oekonomius': {
    name: 'Maurice Ökonomius',
    focus: 'Politik & Wirtschaft',
    bio: 'Moderne Geldtheorie, Wirtschaftspolitik und progressive Ökonomie. Ich kuratiere Bücher, die komplexe wirtschaftliche Zusammenhänge verständlich machen und neue Perspektiven auf gesellschaftliche Herausforderungen eröffnen.',
    avatar: MAURICE_AVATAR,
    banner: MAURICE_BANNER,
    socialMedia: {
      youtube: 'https://youtube.com/@mauriceoekonomius',
      instagram: 'https://instagram.com/mauriceoekonomius',
      twitter: 'https://twitter.com/mauriceoekonomius',
      website: 'https://mauriceoekonomius.de'
    },
    books: [
      {
        id: 'eine-frage-der-chemie',
        cover: 'https://i.ibb.co/1J0wsVyT/Eine-Frage-der-Chemie.jpg',
        title: 'Eine Frage der Chemie',
        author: 'Bonnie Garmus',
        price: '€12,00',
        publisher: 'Piper',
        year: '2023',
        category: 'Roman',
        tags: ['Feminismus', 'Science', 'Coming-of-Age'],
        followCount: 2847,
        awards: 3,
        reviewCount: 156
      },
      {
        id: 'kairos',
        cover: 'https://i.ibb.co/KcbQr6wq/Kairos.jpg',
        title: 'Kairos',
        author: 'Jenny Erpenbeck',
        price: '€25,00',
        publisher: 'Penguin',
        year: '2024',
        category: 'Roman',
        tags: ['Liebe', 'DDR', 'Geschichte'],
        followCount: 1923,
        awards: 5,
        reviewCount: 89
      },
      {
        id: 'eurotrash',
        cover: 'https://i.ibb.co/qFm72tNw/Eurotrash.jpg',
        title: 'Eurotrash',
        author: 'Christian Kracht',
        price: '€22,00',
        publisher: 'Kiepenheuer & Witsch',
        year: '2021',
        category: 'Roman',
        tags: ['Satire', 'Europa', 'Familie'],
        followCount: 1456,
        awards: 2,
        reviewCount: 67
      },
      {
        id: 'identitti',
        cover: 'https://i.ibb.co/s9FJ7VNb/Identitti.jpg',
        title: 'Identitti',
        author: 'Mithu Sanyal',
        price: '€14,00',
        publisher: 'Hanser',
        year: '2021',
        category: 'Roman',
        tags: ['Identität', 'Rassismus', 'Social Media'],
        followCount: 2156,
        awards: 4,
        reviewCount: 103
      }
    ]
  }
};

export default function CreatorStorefront() {
  const { creatorId } = useParams<{ creatorId: string }>();
  const navigate = useSafeNavigate();
  const [creatorData, setCreatorData] = useState<typeof CREATOR_DATA[string] | null>(null);
  const [activeTab, setActiveTab] = useState<'bücher' | 'über'>('bücher');

  useEffect(() => {
    if (creatorId && CREATOR_DATA[creatorId]) {
      setCreatorData(CREATOR_DATA[creatorId]);
    } else {
      // If creator not found, redirect to homepage
      navigate('/');
    }
  }, [creatorId, navigate]);

  if (!creatorData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Lädt...</p>
      </div>
    );
  }

  const socialIcons = [
    { icon: Youtube, url: creatorData.socialMedia?.youtube, label: 'YouTube' },
    { icon: Instagram, url: creatorData.socialMedia?.instagram, label: 'Instagram' },
    { icon: Twitter, url: creatorData.socialMedia?.twitter, label: 'Twitter' },
    { icon: Linkedin, url: creatorData.socialMedia?.linkedin, label: 'LinkedIn' },
    { icon: Globe, url: creatorData.socialMedia?.website, label: 'Website' }
  ].filter(item => item.url);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-background-primary)]">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <div className="relative h-[400px] overflow-hidden">
          {/* Banner Image */}
          <div className="absolute inset-0">
            <ImageWithFallback
              src={creatorData.banner}
              alt={`${creatorData.name} Banner`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
          </div>

          {/* Hero Content */}
          <div className="relative h-full max-w-7xl mx-auto px-6 flex flex-col justify-end pb-12">
            <div className="flex items-end gap-6">
              {/* Avatar */}
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg flex-shrink-0">
                <ImageWithFallback
                  src={creatorData.avatar}
                  alt={creatorData.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Info */}
              <div className="flex-1 pb-2">
                <h1 className="text-4xl font-bold text-white mb-2">{creatorData.name}</h1>
                <p className="text-xl text-white/90 mb-4">{creatorData.focus}</p>
                
                {/* Social Media */}
                {socialIcons.length > 0 && (
                  <div className="flex gap-3">
                    {socialIcons.map(({ icon: Icon, url, label }) => (
                      <a
                        key={label}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                        aria-label={label}
                      >
                        <Icon className="w-5 h-5" />
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pb-2">
                <button className="px-6 py-3 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 transition-opacity font-medium">
                  Folgen
                </button>
                <button className="w-12 h-12 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-[var(--color-border-subtle)]">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex gap-8">
              <button
                onClick={() => setActiveTab('bücher')}
                className={`py-4 px-2 border-b-2 transition-colors font-medium ${
                  activeTab === 'bücher'
                    ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                    : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                Bücher ({creatorData.books.length})
              </button>
              <button
                onClick={() => setActiveTab('über')}
                className={`py-4 px-2 border-b-2 transition-colors font-medium ${
                  activeTab === 'über'
                    ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                    : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                Über
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-6 py-12">
          {activeTab === 'bücher' ? (
            <div>
              <h2 className="text-2xl font-bold mb-6">Kuratierte Bücher</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {creatorData.books.map((book) => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl">
              <h2 className="text-2xl font-bold mb-6">Über {creatorData.name}</h2>
              <p className="text-lg text-[var(--color-text-secondary)] leading-relaxed">
                {creatorData.bio}
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}