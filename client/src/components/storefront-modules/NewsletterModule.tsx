import { Mail, Send, CheckCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { useState } from 'react';

interface NewsletterModuleProps {
  authorName: string;
  backgroundColor?: string;
  onSubscribe?: (email: string) => void;
}

export function NewsletterModule({ 
  authorName,
  backgroundColor = '#FFFFFF',
  onSubscribe
}: NewsletterModuleProps) {
  
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      onSubscribe?.(email);
      setIsSubscribed(true);
      setTimeout(() => {
        setIsSubscribed(false);
        setEmail('');
      }, 3000);
    }
  };

  const newsletterFeatures = [
    'Exklusive Updates zu neuen Projekten',
    'Behind-the-Scenes Einblicke',
    'Leseempfehlungen & Buchankündigungen',
    'Einladungen zu Veranstaltungen'
  ];

  return (
    <section 
      className="py-16 px-4 md:px-8"
      style={{ backgroundColor }}
    >
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl p-8 md:p-12 border border-gray-200" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <div className="text-center mb-8">
            <div className="inline-block p-4 bg-[#247ba0]/10 rounded-full mb-4">
              <Mail className="w-8 h-8 text-[#247ba0]" />
            </div>
            <h2 
              className="mb-3"
              style={{ 
                fontFamily: 'Fjalla One',
                color: '#3A3A3A'
              }}
            >
              Newsletter von {authorName}
            </h2>
            <p style={{ color: '#666666' }}>
              Bleibe auf dem Laufenden und verpasse keine Neuigkeiten
            </p>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-2 gap-3 mb-8">
            {newsletterFeatures.map((feature, index) => (
              <div 
                key={index}
                className="flex items-start gap-2"
              >
                <CheckCircle className="w-5 h-5 text-[#70c1b3] flex-shrink-0 mt-0.5" />
                <span style={{ color: '#666666' }}>{feature}</span>
              </div>
            ))}
          </div>

          {/* Subscription Form */}
          {!isSubscribed ? (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Deine E-Mail-Adresse"
                required
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#247ba0] transition-colors"
                style={{ color: '#3A3A3A' }}
              />
              <Button
                type="submit"
                style={{
                  backgroundColor: '#247ba0',
                  color: '#FFFFFF',
                  borderRadius: '8px',
                  padding: '12px 32px'
                }}
                className="hover:opacity-90 transition-opacity"
              >
                <Send className="w-4 h-4 mr-2" />
                Anmelden
              </Button>
            </form>
          ) : (
            <div className="text-center py-6 bg-[#70c1b3]/10 rounded-lg">
              <CheckCircle className="w-12 h-12 text-[#70c1b3] mx-auto mb-3" />
              <p 
                style={{ 
                  color: '#3A3A3A',
                  fontFamily: 'Fjalla One',
                  fontSize: '18px'
                }}
              >
                Vielen Dank für deine Anmeldung!
              </p>
              <p className="text-sm mt-1" style={{ color: '#666666' }}>
                Du erhältst in Kürze eine Bestätigungsmail
              </p>
            </div>
          )}

          {/* Privacy Note */}
          <p className="text-xs text-center mt-4" style={{ color: '#999999' }}>
            Wir respektieren deine Privatsphäre. Abmeldung jederzeit möglich.
          </p>
        </div>
      </div>
    </section>
  );
}
