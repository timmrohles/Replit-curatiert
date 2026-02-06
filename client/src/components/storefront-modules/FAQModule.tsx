import { ChevronDown, HelpCircle } from 'lucide-react';
import { useState } from 'react';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQModuleProps {
  authorName: string;
  backgroundColor?: string;
}

export function FAQModule({ 
  authorName,
  backgroundColor = '#F5F5F5'
}: FAQModuleProps) {
  
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs: FAQItem[] = [
    {
      question: 'Wie werde ich Mitglied der Community?',
      answer: `Um Mitglied der Community von ${authorName} zu werden, klicke einfach auf "Mitglied werden" und wähle eine Mitgliedschaftsoption. Du erhältst sofort Zugang zu allen exklusiven Inhalten und Community-Features.`
    },
    {
      question: 'Welche Inhalte erhalte ich als Mitglied?',
      answer: 'Als Mitglied erhältst du Zugang zu exklusiven Bonusinhalten, Q&A Sessions, Community-Diskussionen, Early Access zu neuen Kapiteln und vieles mehr. Die genauen Vorteile findest du im Bereich "Mitglied werden".'
    },
    {
      question: 'Wie funktioniert der Buchclub?',
      answer: `Der Buchclub trifft sich regelmäßig online, um gemeinsam Bücher zu lesen und zu diskutieren. ${authorName} nimmt persönlich an den Treffen teil. Termine und Details findest du im Buchclub-Bereich.`
    },
    {
      question: 'Kann ich meine Mitgliedschaft jederzeit kündigen?',
      answer: 'Ja, du kannst deine Mitgliedschaft jederzeit kündigen. Es gibt keine Mindestlaufzeit oder versteckte Gebühren. Nach der Kündigung hast du noch bis zum Ende des bezahlten Zeitraums Zugang zu allen Inhalten.'
    },
    {
      question: 'Wie kann ich den Newsletter abbestellen?',
      answer: 'In jeder Newsletter-Mail findest du am Ende einen Abmelde-Link. Ein Klick genügt und du wirst sofort aus dem Verteiler entfernt. Alternativ kannst du dich auch in deinen Kontoeinstellungen abmelden.'
    }
  ];

  return (
    <section 
      className="py-16 px-4 md:px-8"
      style={{ backgroundColor }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block p-4 bg-[#247ba0]/10 rounded-full mb-4">
            <HelpCircle className="w-8 h-8 text-[#247ba0]" />
          </div>
          <h2 
            className="mb-3"
            style={{ 
              fontFamily: 'Fjalla One',
              color: '#3A3A3A'
            }}
          >
            Häufig gestellte Fragen
          </h2>
          <p style={{ color: '#666666' }}>
            Hier findest du Antworten auf die wichtigsten Fragen
          </p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div 
              key={index}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden transition-all"
              style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
              >
                <span 
                  style={{ 
                    fontFamily: 'Fjalla One',
                    color: '#3A3A3A',
                    fontSize: '18px'
                  }}
                >
                  {faq.question}
                </span>
                <ChevronDown 
                  className={`w-5 h-5 text-[#247ba0] transition-transform flex-shrink-0 ml-4 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>
              
              {openIndex === index && (
                <div 
                  className="px-6 pb-4 border-t border-gray-100"
                  style={{ 
                    color: '#666666',
                    lineHeight: '1.6'
                  }}
                >
                  <p className="pt-4">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Additional Help */}
        <div className="text-center mt-8">
          <p style={{ color: '#999999' }}>
            Weitere Fragen? Schreib uns an{' '}
            <a 
              href="mailto:support@coratiert.de" 
              className="text-[#247ba0] hover:underline"
            >
              support@coratiert.de
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
