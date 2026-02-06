import { useState } from 'react';
import { Target, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { recipientCategories } from '../RecipientCategoryGrid';

// Books with curator reviews for each category
export const booksByCategory: Record<string, any[]> = {
  sportbegeisterte: [
    {
      id: 'sport1',
      cover: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400',
      title: 'Atomic Habits',
      author: 'James Clear',
      publisher: 'Goldmann',
      year: '2020',
      price: '16,99 €',
      availability: 'Auf Lager',
      category: 'Sachbuch',
      tags: ['Motivation', 'Gewohnheiten'],
      review: {
        curatorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
        curatorName: 'Max Bergmann',
        curatorFocus: 'Outdoor & Abenteuer',
        reviewTitle: 'Perfekt für Sportler:innen',
        reviewText: 'Dieses Buch hat meine Trainingsroutine komplett verändert. Clear zeigt, wie kleine Gewohnheiten zu großen Erfolgen führen – egal ob beim Sport oder im Leben. Ein Muss für alle, die sich nachhaltig verbessern wollen! Die wissenschaftlichen Erkenntnisse werden so praxisnah vermittelt, dass man sofort anfangen möchte, neue Routinen aufzubauen. Besonders beeindruckend finde ich das Konzept der "Atomic Habits" – winzige Veränderungen, die sich exponentiell auswirken. Clear kombiniert Psychologie, Neurowissenschaft und persönliche Anekdoten zu einem unglaublich motivierenden Leseerlebnis. Jedes Kapitel bietet konkrete Strategien, die man direkt umsetzen kann. Für Sportler:innen ist es Gold wert, weil es zeigt, wie mentale Gewohnheiten genauso wichtig sind wie körperliches Training.'
      }
    },
    {
      id: 'sport2',
      cover: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400',
      title: 'Born to Run',
      author: 'Christopher McDougall',
      publisher: 'Fischer',
      year: '2011',
      price: '14,99 €',
      availability: 'Auf Lager',
      category: 'Sachbuch',
      tags: ['Laufen', 'Abenteuer'],
      review: {
        curatorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
        curatorName: 'Max Bergmann',
        curatorFocus: 'Outdoor & Abenteuer',
        reviewTitle: 'Die Bibel des Laufens',
        reviewText: 'Eine faszinierende Geschichte über die Tarahumara-Indianer und die Kunst des Barfußlaufens. McDougall verbindet Wissenschaft, Abenteuer und persönliche Erfahrung zu einem mitreißenden Leseerlebnis. Er stellt gängige Weisheiten über moderne Laufschuhe in Frage und zeigt, wie eine indigene Gemeinschaft in den Kupfer-Schluchten Mexikos die Geheimnisse des natürlichen Laufens bewahrt hat. Das Buch liest sich wie ein Thriller, gespickt mit faszinierenden Charakteren – von Ultra-Läufern bis zu exzentrischen Forschern. McDougall nimmt uns mit auf eine Reise, die unser Verständnis von Ausdauer, Schmerz und menschlichem Potenzial grundlegend verändert. Ein absolutes Must-Read für alle, die Laufen lieben oder verstehen wollen, warum Menschen dafür geboren sind.'
      }
    },
    {
      id: 'sport3',
      cover: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400',
      title: 'What I Talk About When I Talk About Running',
      author: 'Haruki Murakami',
      publisher: 'Vintage',
      year: '2009',
      price: '12,99 €',
      availability: 'Auf Lager',
      category: 'Memoir',
      tags: ['Laufen', 'Kreativität'],
      review: {
        curatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
        curatorName: 'Sarah Klein',
        curatorFocus: 'Leichte Einstiege',
        reviewTitle: 'Poetisch und inspirierend',
        reviewText: 'Murakami reflektiert über die Parallelen zwischen Laufen und Schreiben. Eine meditative, poetische Lektüre für alle, die Sport als Lebensphilosophie verstehen.'
      }
    },
    {
      id: 'sport4',
      cover: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400',
      title: 'Endure',
      author: 'Alex Hutchinson',
      publisher: 'Harper',
      year: '2018',
      price: '18,99 €',
      availability: 'Auf Lager',
      category: 'Sachbuch',
      tags: ['Wissenschaft', 'Ausdauer'],
      review: {
        curatorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
        curatorName: 'Max Bergmann',
        curatorFocus: 'Outdoor & Abenteuer',
        reviewTitle: 'Die Wissenschaft der Ausdauer',
        reviewText: 'Hutchinson erforscht die Grenzen menschlicher Leistungsfähigkeit. Basierend auf neuester Forschung zeigt er, dass unser Geist oft die größere Hürde ist als unser Körper.'
      }
    }
  ],
  politikinteressierte: [
    {
      id: 'pol1',
      cover: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400',
      title: 'Das Kapital im 21. Jahrhundert',
      author: 'Thomas Piketty',
      publisher: 'C.H.Beck',
      year: '2014',
      price: '29,95 €',
      availability: 'Auf Lager',
      category: 'Sachbuch',
      tags: ['Wirtschaft', 'Ungleichheit'],
      review: {
        curatorAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
        curatorName: 'Lisa Weber',
        curatorFocus: 'Feministische Literatur',
        reviewTitle: 'Unverzichtbar für politisch Interessierte',
        reviewText: 'Piketty liefert eine fundierte Analyse der wachsenden Ungleichheit. Ein Werk, das die Debatte über Kapitalismus und Gerechtigkeit neu definiert hat. Pflichtlektüre!'
      }
    },
    {
      id: 'pol2',
      cover: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400',
      title: 'Unsichtbare Frauen',
      author: 'Caroline Criado-Perez',
      publisher: 'btb',
      year: '2020',
      price: '18,00 €',
      availability: 'Auf Lager',
      category: 'Sachbuch',
      tags: ['Feminismus', 'Daten'],
      review: {
        curatorAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
        curatorName: 'Lisa Weber',
        curatorFocus: 'Feministische Literatur',
        reviewTitle: 'Augenöffnend',
        reviewText: 'Criado-Perez zeigt, wie unsere Welt für Männer konzipiert ist – von Stadtplanung bis Medizin. Ein wichtiges Buch, das den Blick auf alltägliche Diskriminierung schärft.'
      }
    },
    {
      id: 'pol3',
      cover: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400',
      title: 'Exit Racism',
      author: 'Tupoka Ogette',
      publisher: 'Unrast',
      year: '2020',
      price: '16,00 €',
      availability: 'Auf Lager',
      category: 'Sachbuch',
      tags: ['Rassismus', 'Bildung'],
      review: {
        curatorAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
        curatorName: 'Lisa Weber',
        curatorFocus: 'Feministische Literatur',
        reviewTitle: 'Rassismuskritisch denken lernen',
        reviewText: 'Ein zugänglicher Einstieg in die Rassismuskritik. Ogette nimmt uns an die Hand und zeigt, wie wir unsere eigenen Denkmuster hinterfragen können.'
      }
    },
    {
      id: 'pol4',
      cover: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400',
      title: 'The Hate U Give',
      author: 'Angie Thomas',
      publisher: 'cbt',
      year: '2017',
      price: '14,99 €',
      availability: 'Auf Lager',
      category: 'Roman',
      tags: ['Rassismus', 'Identität'],
      review: {
        curatorAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
        curatorName: 'Lisa Weber',
        curatorFocus: 'Feministische Literatur',
        reviewTitle: 'Kraftvoll und bewegend',
        reviewText: 'Thomas erzählt die Geschichte einer jungen Schwarzen Frau, die ihre Stimme findet. Ein Roman über Rassismus, der unter die Haut geht und zum Handeln aufruft.'
      }
    }
  ],
  lesemuffel: [
    {
      id: 'les1',
      cover: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400',
      title: 'Die Mitternachtsbibliothek',
      author: 'Matt Haig',
      publisher: 'Droemer',
      year: '2021',
      price: '20,00 €',
      availability: 'Auf Lager',
      category: 'Roman',
      tags: ['Leicht', 'Inspirierend'],
      review: {
        curatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
        curatorName: 'Sarah Klein',
        curatorFocus: 'Leichte Einstiege',
        reviewTitle: 'Perfekter Einstieg',
        reviewText: 'Ein magischer Roman, der sich leicht lesen lässt, aber tief berührt. Haig erzählt von unendlichen Möglichkeiten und der Schönheit des Lebens. Ideal für Leseanfänger:innen!'
      }
    },
    {
      id: 'les2',
      cover: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400',
      title: 'Der Alchemist',
      author: 'Paulo Coelho',
      publisher: 'Diogenes',
      year: '2017',
      price: '12,00 €',
      availability: 'Auf Lager',
      category: 'Roman',
      tags: ['Inspiration', 'Kurz'],
      review: {
        curatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
        curatorName: 'Sarah Klein',
        curatorFocus: 'Leichte Einstiege',
        reviewTitle: 'Zeitlose Parabel',
        reviewText: 'Eine kurze, poetische Geschichte über Träume und Bestimmung. Coelho schreibt einfach und dennoch tief – perfekt für Menschen, die nicht viel Zeit haben.'
      }
    },
    {
      id: 'les3',
      cover: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400',
      title: 'Der Gesang der Flusskrebse',
      author: 'Delia Owens',
      publisher: 'Hanserblau',
      year: '2019',
      price: '22,00 €',
      availability: 'Auf Lager',
      category: 'Roman',
      tags: ['Natur', 'Spannend'],
      review: {
        curatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
        curatorName: 'Sarah Klein',
        curatorFocus: 'Leichte Einstiege',
        reviewTitle: 'Fesselnd und atmosphärisch',
        reviewText: 'Ein Roman, der einen von der ersten Seite an packt. Owens verbindet Natur, Spannung und Emotion zu einem unwiderstehlichen Leseerlebnis.'
      }
    },
    {
      id: 'les4',
      cover: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400',
      title: 'Qualityland',
      author: 'Marc-Uwe Kling',
      publisher: 'Ullstein',
      year: '2017',
      price: '14,99 €',
      availability: 'Auf Lager',
      category: 'Satire',
      tags: ['Humorvoll', 'Sci-Fi'],
      review: {
        curatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
        curatorName: 'Sarah Klein',
        curatorFocus: 'Leichte Einstiege',
        reviewTitle: 'Witzig und klug',
        reviewText: 'Kling erschafft eine absurde Zukunftsvision, die zum Lachen und Nachdenken anregt. Schnell zu lesen, voller Sprachwitz und überraschender Wendungen.'
      }
    }
  ],
  selbstfuersorge: [
    {
      id: 'self1',
      cover: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400',
      title: 'Atomic Habits',
      author: 'James Clear',
      publisher: 'Goldmann',
      year: '2020',
      price: '16,99 €',
      availability: 'Auf Lager',
      category: 'Sachbuch',
      tags: ['Gewohnheiten', 'Psychologie'],
      review: {
        curatorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
        curatorName: 'Marie Schmidt',
        curatorFocus: 'Mentale Gesundheit',
        reviewTitle: 'Transformativ',
        reviewText: 'Clear zeigt, wie wir durch kleine Veränderungen große Fortschritte machen können. Ein praktischer Ratgeber für alle, die nachhaltig an sich arbeiten wollen.'
      }
    },
    {
      id: 'self2',
      cover: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400',
      title: 'Der Körper vergisst nicht',
      author: 'Bessel van der Kolk',
      publisher: 'Probst',
      year: '2015',
      price: '24,00 €',
      availability: 'Auf Lager',
      category: 'Sachbuch',
      tags: ['Trauma', 'Heilung'],
      review: {
        curatorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
        curatorName: 'Marie Schmidt',
        curatorFocus: 'Mentale Gesundheit',
        reviewTitle: 'Bahnbrechend',
        reviewText: 'Van der Kolk erklärt, wie Trauma im Körper gespeichert wird und wie Heilung möglich ist. Ein Muss für alle, die sich mit psychischer Gesundheit beschäftigen.'
      }
    },
    {
      id: 'self3',
      cover: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400',
      title: 'Die Gabe der Hochsensibilität',
      author: 'Elaine N. Aron',
      publisher: 'mvg',
      year: '2014',
      price: '16,99 €',
      availability: 'Auf Lager',
      category: 'Sachbuch',
      tags: ['Sensibilität', 'Selbsterkenntnis'],
      review: {
        curatorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
        curatorName: 'Marie Schmidt',
        curatorFocus: 'Mentale Gesundheit',
        reviewTitle: 'Selbstverständnis fördernd',
        reviewText: 'Aron hilft hochsensiblen Menschen, ihre Gabe zu verstehen und zu nutzen. Ein wertvolles Buch für alle, die intensiv fühlen und wahrnehmen.'
      }
    },
    {
      id: 'self4',
      cover: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400',
      title: 'Das Café am Rande der Welt',
      author: 'John Strelecky',
      publisher: 'dtv',
      year: '2007',
      price: '9,90 €',
      availability: 'Auf Lager',
      category: 'Roman',
      tags: ['Sinnsuche', 'Leicht'],
      review: {
        curatorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
        curatorName: 'Marie Schmidt',
        curatorFocus: 'Mentale Gesundheit',
        reviewTitle: 'Leicht und tiefgründig',
        reviewText: 'Eine einfache Geschichte mit großer Wirkung. Strelecky lädt zum Nachdenken über Lebenssinn und Prioritäten ein – ohne zu schwer zu sein.'
      }
    }
  ],
  naturliebhaber: [
    {
      id: 'nat1',
      cover: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400',
      title: 'Wild',
      author: 'Cheryl Strayed',
      publisher: 'Knaus',
      year: '2013',
      price: '14,99 €',
      availability: 'Auf Lager',
      category: 'Memoir',
      tags: ['Outdoor', 'Selbstfindung'],
      review: {
        curatorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
        curatorName: 'Max Bergmann',
        curatorFocus: 'Outdoor & Abenteuer',
        reviewTitle: 'Bewegend und inspirierend',
        reviewText: 'Strayeds Geschichte über ihre Solo-Wanderung auf dem Pacific Crest Trail ist ein kraftvolles Zeugnis über Heilung und die transformative Kraft der Natur.'
      }
    },
    {
      id: 'nat2',
      cover: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400',
      title: 'Das geheime Leben der Bäume',
      author: 'Peter Wohlleben',
      publisher: 'Ludwig',
      year: '2015',
      price: '19,99 €',
      availability: 'Auf Lager',
      category: 'Sachbuch',
      tags: ['Natur', 'Wissen'],
      review: {
        curatorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
        curatorName: 'Max Bergmann',
        curatorFocus: 'Outdoor & Abenteuer',
        reviewTitle: 'Augenöffnend',
        reviewText: 'Wohlleben zeigt uns den Wald mit völlig neuen Augen. Ein faszinierendes Buch über die verborgene Welt der Bäume, das unsere Beziehung zur Natur verändert.'
      }
    },
    {
      id: 'nat3',
      cover: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400',
      title: 'Into the Wild',
      author: 'Jon Krakauer',
      publisher: 'Piper',
      year: '2007',
      price: '12,00 €',
      availability: 'Auf Lager',
      category: 'Sachbuch',
      tags: ['Abenteuer', 'Freiheit'],
      review: {
        curatorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
        curatorName: 'Max Bergmann',
        curatorFocus: 'Outdoor & Abenteuer',
        reviewTitle: 'Packend und nachdenklich',
        reviewText: 'Die wahre Geschichte von Christopher McCandless, der alles aufgab, um in der Wildnis Alaskas zu leben. Ein Buch über Freiheit, Idealismus und die Grenzen der Selbstverwirklichung.'
      }
    },
    {
      id: 'nat4',
      cover: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400',
      title: 'Braiding Sweetgrass',
      author: 'Robin Wall Kimmerer',
      publisher: 'Penguin',
      year: '2020',
      price: '16,99 €',
      availability: 'Auf Lager',
      category: 'Sachbuch',
      tags: ['Indigenes Wissen', 'Ökologie'],
      review: {
        curatorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
        curatorName: 'Max Bergmann',
        curatorFocus: 'Outdoor & Abenteuer',
        reviewTitle: 'Poetisch und lehrreich',
        reviewText: 'Kimmerer verbindet indigenes Wissen mit moderner Botanik. Ein Buch, das uns lehrt, die Natur nicht nur zu schützen, sondern mit ihr in Beziehung zu treten.'
      }
    }
  ],
  kreative: [
    {
      id: 'kre1',
      cover: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400',
      title: 'Big Magic',
      author: 'Elizabeth Gilbert',
      publisher: 'Fischer',
      year: '2016',
      price: '14,99 €',
      availability: 'Auf Lager',
      category: 'Sachbuch',
      tags: ['Kreativität', 'Inspiration'],
      review: {
        curatorAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400',
        curatorName: 'Jonas Bauer',
        curatorFocus: 'Kreative Köpfe',
        reviewTitle: 'Befreiend',
        reviewText: 'Gilbert ermutigt uns, unsere Kreativität ohne Angst zu leben. Ein inspirierendes Buch über den kreativen Prozess, das Mut macht, den eigenen künstlerischen Weg zu gehen.'
      }
    },
    {
      id: 'kre2',
      cover: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400',
      title: 'Steal Like an Artist',
      author: 'Austin Kleon',
      publisher: 'Mosaik',
      year: '2013',
      price: '12,99 €',
      availability: 'Auf Lager',
      category: 'Sachbuch',
      tags: ['Kreativität', 'Praxis'],
      review: {
        curatorAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400',
        curatorName: 'Jonas Bauer',
        curatorFocus: 'Kreative Köpfe',
        reviewTitle: 'Erfrischend praktisch',
        reviewText: 'Kleon zeigt, dass Kreativität kein Geheimnis ist, sondern eine Praxis. Voller konkreter Tipps und visueller Inspiration – perfekt für kreative Menschen!'
      }
    },
    {
      id: 'kre3',
      cover: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400',
      title: 'The War of Art',
      author: 'Steven Pressfield',
      publisher: 'Black Irish',
      year: '2012',
      price: '15,99 €',
      availability: 'Auf Lager',
      category: 'Sachbuch',
      tags: ['Widerstand', 'Disziplin'],
      review: {
        curatorAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400',
        curatorName: 'Jonas Bauer',
        curatorFocus: 'Kreative Köpfe',
        reviewTitle: 'Schonungslos ehrlich',
        reviewText: 'Pressfield benennt den inneren Widerstand, der uns vom Schaffen abhält. Ein kompromissloses, motivierendes Buch für alle, die ihre kreative Arbeit ernst nehmen.'
      }
    },
    {
      id: 'kre4',
      cover: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400',
      title: 'The Artist\'s Way',
      author: 'Julia Cameron',
      publisher: 'Tarcher',
      year: '2016',
      price: '18,99 €',
      availability: 'Auf Lager',
      category: 'Sachbuch',
      tags: ['Kreativität', 'Selbstfindung'],
      review: {
        curatorAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400',
        curatorName: 'Jonas Bauer',
        curatorFocus: 'Kreative Köpfe',
        reviewTitle: 'Transformativ',
        reviewText: 'Camerons 12-Wochen-Programm hat Millionen geholfen, ihre Kreativität wiederzuentdecken. Mit den Morgenseiten und Artist Dates zu mehr kreativer Freiheit.'
      }
    }
  ],
  feministinnen: [
    {
      id: 'fem1',
      cover: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400',
      title: 'Unsichtbare Frauen',
      author: 'Caroline Criado-Perez',
      publisher: 'btb',
      year: '2020',
      price: '18,00 €',
      availability: 'Auf Lager',
      category: 'Sachbuch',
      tags: ['Feminismus', 'Daten'],
      review: {
        curatorAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
        curatorName: 'Lisa Weber',
        curatorFocus: 'Feministische Literatur',
        reviewTitle: 'Augenöffnend',
        reviewText: 'Criado-Perez zeigt, wie unsere Welt für Männer konzipiert ist – von Stadtplanung bis Medizin. Ein wichtiges Buch, das den Blick auf alltägliche Diskriminierung schärft.'
      }
    },
    {
      id: 'fem2',
      cover: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400',
      title: 'Wir sollten alle Feministinnen sein',
      author: 'Chimamanda Ngozi Adichie',
      publisher: 'Fischer',
      year: '2015',
      price: '8,00 €',
      availability: 'Auf Lager',
      category: 'Essay',
      tags: ['Feminismus', 'Einführung'],
      review: {
        curatorAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
        curatorName: 'Lisa Weber',
        curatorFocus: 'Feministische Literatur',
        reviewTitle: 'Zugänglich und kraftvoll',
        reviewText: 'Adichies Essay ist eine perfekte Einführung in den Feminismus. Klar, persönlich und überzeugend – ein Muss für alle, die verstehen wollen, warum Feminismus wichtig ist.'
      }
    },
    {
      id: 'fem3',
      cover: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400',
      title: 'Die Argonauten',
      author: 'Maggie Nelson',
      publisher: 'Hanser',
      year: '2017',
      price: '22,00 €',
      availability: 'Auf Lager',
      category: 'Memoir',
      tags: ['Queer', 'Familie'],
      review: {
        curatorAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
        curatorName: 'Lisa Weber',
        curatorFocus: 'Feministische Literatur',
        reviewTitle: 'Radikal und zärtlich',
        reviewText: 'Nelson erzählt von Liebe, Familie und Identität jenseits binärer Kategorien. Ein intellektuell anspruchsvolles, zutiefst persönliches Werk über queeres Leben.'
      }
    },
    {
      id: 'fem4',
      cover: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400',
      title: 'King Kong Theorie',
      author: 'Virginie Despentes',
      publisher: 'Kiepenheuer & Witsch',
      year: '2007',
      price: '14,00 €',
      availability: 'Auf Lager',
      category: 'Essay',
      tags: ['Feminismus', 'Provokant'],
      review: {
        curatorAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
        curatorName: 'Lisa Weber',
        curatorFocus: 'Feministische Literatur',
        reviewTitle: 'Kompromisslos',
        reviewText: 'Despentes schreibt schonungslos über Weiblichkeit, Sexarbeit und Gewalt. Ein wütender, befreiender Text, der feministische Theorie radikal neu denkt.'
      }
    }
  ],
  techbegeisterte: [
    {
      id: 'tech1',
      cover: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400',
      title: 'Homo Deus',
      author: 'Yuval Noah Harari',
      publisher: 'C.H.Beck',
      year: '2017',
      price: '24,95 €',
      availability: 'Auf Lager',
      category: 'Sachbuch',
      tags: ['Zukunft', 'KI'],
      review: {
        curatorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
        curatorName: 'Tom Fischer',
        curatorFocus: 'Tech & Zukunft',
        reviewTitle: 'Visionär',
        reviewText: 'Harari wirft einen Blick in die Zukunft der Menschheit im Zeitalter von KI und Biotechnologie. Ein faszinierendes, zum Nachdenken anregendes Werk ber unsere Zukunft.'
      }
    },
    {
      id: 'tech2',
      cover: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400',
      title: 'Life 3.0',
      author: 'Max Tegmark',
      publisher: 'Penguin',
      year: '2017',
      price: '16,99 €',
      availability: 'Auf Lager',
      category: 'Sachbuch',
      tags: ['KI', 'Zukunft'],
      review: {
        curatorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
        curatorName: 'Tom Fischer',
        curatorFocus: 'Tech & Zukunft',
        reviewTitle: 'Fundiert und zugänglich',
        reviewText: 'Tegmark erklärt, wie künstliche Intelligenz unsere Zukunft prägen wird. Wissenschaftlich fundiert, aber verständlich geschrieben – essenziell für Tech-Interessierte.'
      }
    },
    {
      id: 'tech3',
      cover: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400',
      title: 'The Innovators',
      author: 'Walter Isaacson',
      publisher: 'Simon & Schuster',
      year: '2015',
      price: '18,99 €',
      availability: 'Auf Lager',
      category: 'Sachbuch',
      tags: ['Tech-Geschichte', 'Innovation'],
      review: {
        curatorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
        curatorName: 'Tom Fischer',
        curatorFocus: 'Tech & Zukunft',
        reviewTitle: 'Meisterhaft erzählt',
        reviewText: 'Isaacson zeichnet die Geschichte der digitalen Revolution nach – von Ada Lovelace bis zu den Gründern von Google. Spannend wie ein Roman, lehrreich wie ein Geschichtsbuch.'
      }
    },
    {
      id: 'tech4',
      cover: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400',
      title: 'The Code Breaker',
      author: 'Walter Isaacson',
      publisher: 'Simon & Schuster',
      year: '2021',
      price: '28,00 €',
      availability: 'Auf Lager',
      category: 'Biographie',
      tags: ['CRISPR', 'Biotechnologie'],
      review: {
        curatorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
        curatorName: 'Tom Fischer',
        curatorFocus: 'Tech & Zukunft',
        reviewTitle: 'Aktuell und wichtig',
        reviewText: 'Die Geschichte von Jennifer Doudna und der CRISPR-Revolution. Isaacson erklärt die Technologie, die unser Verständnis von Leben verändert – fesselnd und verständlich.'
      }
    }
  ]
};

interface RecipientFinderProps {
  onRecipientSelect?: (recipientId: string) => void;
}

export function RecipientFinder({ onRecipientSelect }: RecipientFinderProps) {
  const [selectedRecipient, setSelectedRecipient] = useState<string | null>(null);

  const handleRecipientClick = (recipientId: string) => {
    setSelectedRecipient(recipientId);
    onRecipientSelect?.(recipientId);
  };

  const selectedCategory = recipientCategories.find((r) => r.id === selectedRecipient);
  const selectedBooks = selectedRecipient ? booksByCategory[selectedRecipient] || [] : [];

  return (
    <div>
      {/* Selection Section */}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {recipientCategories.map((recipient) => (
              <motion.button
                key={recipient.id}
                onClick={() => handleRecipientClick(recipient.id)}
                className="relative overflow-hidden rounded-lg text-left transition-all duration-300 h-64"
                style={{
                  border: selectedRecipient === recipient.id ? `3px solid ${recipient.color}` : '3px solid transparent',
                  cursor: 'pointer'
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
                    background: selectedRecipient === recipient.id 
                      ? 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 100%)'
                      : 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 100%)'
                  }}
                />

                {/* Content */}
                <div className="absolute inset-0 p-6 flex flex-col justify-end">
                  <h3
                    style={{
                      fontFamily: 'Fjalla One',
                      fontSize: '1.5rem',
                      color: '#FFFFFF',
                      marginBottom: '0.5rem',
                      textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                    }}
                  >
                    {recipient.label}
                  </h3>
                  <p style={{ 
                    color: '#FFFFFF', 
                    fontSize: '0.875rem', 
                    lineHeight: '1.4',
                    textShadow: '0 1px 3px rgba(0,0,0,0.5)'
                  }}>
                    {recipient.description}
                  </p>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Algorithm Documentation Box */}
          <div
            className="mt-12 p-6 rounded-lg"
            style={{
              backgroundColor: 'rgba(112, 193, 179, 0.15)',
              border: '2px solid #70c1b3'
            }}
          >
            <div className="flex items-start gap-3">
              <Sparkles size={24} style={{ color: '#70c1b3', flexShrink: 0 }} />
              <div>
                <h3
                  style={{
                    fontFamily: 'Fjalla One',
                    fontSize: '1.25rem',
                    color: '#3A3A3A',
                    marginBottom: '0.5rem'
                  }}
                >
                  💡 Algorithmus: Kurator:innen & Buch-Matching
                </h3>
                <p style={{ color: '#3A3A3A', lineHeight: '1.6', marginBottom: '1rem' }}>
                  Das System nutzt folgende Signale, um perfekte Empfehlungen zu finden:
                </p>
                <ul style={{ color: '#3A3A3A', lineHeight: '1.8', paddingLeft: '1.5rem', marginBottom: '1.5rem' }}>
                  <li><strong>1. Tag-Schnittmenge:</strong> Wie viele Tags der Zielgruppe deckt ein:e Kurator:in ab?</li>
                  <li><strong>2. Anzahl relevanter Kurationen:</strong> Je mehr Listen ein:e Kurator:in zu diesem Thema erstellt hat, desto höher der Score.</li>
                  <li><strong>3. Interaktionsstärke:</strong> Klicks, Saves, Bewertungen der passenden Listen wirken als Qualitätsindikatoren.</li>
                  <li><strong>4. Buchpassung:</strong> Wenn ein:e Kurator:in genau die Art Bücher empfiehlt, die gesucht wird, ist das ein starkes Match.</li>
                  <li><strong>5. Lesemotive:</strong> Das System berücksichtigt die 10 Lesemotive (z.B. "Eintauchen", "Nervenkitzeln", "Verstehen"), um Bücher zu finden, die das emotionale Bedürfnis der Zielgruppe erfüllen.</li>
                  <li><strong>6. Redaktionsflaggen (optional):</strong> Manuell gesetzte Expert:innen-Flags wie „Expert:in für Politik" oder „Expert:in für Outdoor" können den Score boosten.</li>
                </ul>

                {/* Lesemotive Section */}
                <div
                  className="mt-4 p-4 rounded"
                  style={{
                    backgroundColor: 'rgba(255, 224, 102, 0.15)',
                    border: '1px solid #ffe066'
                  }}
                >
                  <h4
                    style={{
                      fontFamily: 'Fjalla One',
                      fontSize: '1.1rem',
                      color: '#3A3A3A',
                      marginBottom: '0.75rem'
                    }}
                  >
                    📚 Die 10 Lesemotive im Detail
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3" style={{ fontSize: '0.875rem', lineHeight: '1.5' }}>
                    <div>
                      <strong style={{ color: '#3A3A3A' }}>01. Auseinandersetzen:</strong>
                      <span style={{ color: '#666' }}> Gesellschaftskritische und provokative Inhalte, die ein Statement setzen</span>
                    </div>
                    <div>
                      <strong style={{ color: '#3A3A3A' }}>02. Eintauchen:</strong>
                      <span style={{ color: '#666' }}> In andere Welten eintauchen und dem Alltag entfliehen</span>
                    </div>
                    <div>
                      <strong style={{ color: '#3A3A3A' }}>03. Entdecken:</strong>
                      <span style={{ color: '#666' }}> Unbekanntes entdecken, das inspiriert und Lust auf Neues macht</span>
                    </div>
                    <div>
                      <strong style={{ color: '#3A3A3A' }}>04. Entspannen:</strong>
                      <span style={{ color: '#666' }}> Rückzug zur Ruhe und Zufriedenheit finden</span>
                    </div>
                    <div>
                      <strong style={{ color: '#3A3A3A' }}>05. Lachen:</strong>
                      <span style={{ color: '#666' }}> Heiterkeit vom Schmunzeln bis zu Spaß pur erleben</span>
                    </div>
                    <div>
                      <strong style={{ color: '#3A3A3A' }}>06. Leichtlesen:</strong>
                      <span style={{ color: '#666' }}> Unbeschwerte Lektüre mit einfacher Sprache genießen</span>
                    </div>
                    <div>
                      <strong style={{ color: '#3A3A3A' }}>07. Nervenkitzeln:</strong>
                      <span style={{ color: '#666' }}> Spannung erleben, die einen mitfiebern lässt</span>
                    </div>
                    <div>
                      <strong style={{ color: '#3A3A3A' }}>08. Optimieren:</strong>
                      <span style={{ color: '#666' }}> Leistungsverbesserung für persönlichen Erfolg anstreben</span>
                    </div>
                    <div>
                      <strong style={{ color: '#3A3A3A' }}>09. Orientieren:</strong>
                      <span style={{ color: '#666' }}> Sicherheit durch vertrauenswürdiges Wissen gewinnen</span>
                    </div>
                    <div>
                      <strong style={{ color: '#3A3A3A' }}>10. Verstehen:</strong>
                      <span style={{ color: '#666' }}> Zusammenhänge begreifen und Klarheit verschaffen</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}