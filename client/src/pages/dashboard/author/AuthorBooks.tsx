import { BookOpen, Plus, Edit } from 'lucide-react';

export function AuthorBooks() {
  const books = [
    {
      id: '1',
      title: 'Mein erstes Buch',
      status: 'published',
      publishDate: '2024',
      sales: 245,
      rating: 4.5
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl mb-2" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
            Meine Bücher
          </h1>
          <p className="text-sm" style={{ color: '#6B7280' }}>
            Verwalte deine veröffentlichten Werke
          </p>
        </div>
        <button className="px-4 py-2 rounded-lg text-sm" style={{ backgroundColor: '#F59E0B', color: '#92400e' }}>
          <Plus className="w-4 h-4 inline mr-2" />
          Neues Buch
        </button>
      </div>

      <div className="space-y-4">
        {books.map((book) => (
          <div key={book.id} className="rounded-lg p-6 shadow-sm border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg mb-2" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
                  {book.title}
                </h3>
                <div className="flex flex-wrap gap-4 text-sm" style={{ color: '#6B7280' }}>
                  <div>Veröffentlicht: {book.publishDate}</div>
                  <div>Verkäufe: {book.sales}</div>
                  <div>Bewertung: {book.rating}★</div>
                </div>
              </div>
              <button className="p-2 rounded-lg" style={{ backgroundColor: '#F3F4F6' }}>
                <Edit className="w-4 h-4" style={{ color: '#6B7280' }} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
