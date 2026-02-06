/**
 * RATING LABELS - Sprachliche Verdichtung von 0-100 Werten
 * 
 * Konvertiert numerische Skalen-Werte in journalistische Beschreibungen
 * für Feuilleton-Style Darstellung (keine Zahlen im Frontend)
 */

import { BOOK_WORLD_SCALES, type BookWorldForRating } from './api';

/**
 * Interpretiert einen 0-100 Wert basierend auf der Skala
 * Berücksichtigt die Pole (labelLeft = niedrig, labelRight = hoch)
 * 
 * Neue 5-Segment-Logik:
 * - 0-20: Stark Links
 * - 21-40: Leicht Links  
 * - 41-60: Neutral
 * - 61-80: Leicht Rechts
 * - 81-100: Stark Rechts
 */
export function scaleValueToLabel(
  scaleId: string, 
  value: number,
  bookWorld: BookWorldForRating,
  intensity: 'strong' | 'moderate' | 'slight' = 'moderate'
): string {
  const scales = BOOK_WORLD_SCALES[bookWorld];
  const scale = scales.find(s => s.id === scaleId);
  
  if (!scale) {
    return '';
  }

  // Intensitäts-Präfixe basierend auf Streuung/Varianz
  const prefix = {
    strong: 'sehr',
    moderate: 'überwiegend',
    slight: 'eher'
  }[intensity];

  // Richtung bestimmen (angepasst an 5-Segment-System)
  if (value >= 81) {
    // Stark RIGHT
    return `sehr ${scale.labelRight.toLowerCase()}`;
  } else if (value >= 61) {
    // Leicht RIGHT
    return `${prefix} ${scale.labelRight.toLowerCase()}`;
  } else if (value >= 41) {
    // Neutral (Mitte)
    return `ausgewogen zwischen ${scale.labelLeft.toLowerCase()} und ${scale.labelRight.toLowerCase()}`;
  } else if (value >= 21) {
    // Leicht LEFT
    return `${prefix} ${scale.labelLeft.toLowerCase()}`;
  } else {
    // Stark LEFT
    return `sehr ${scale.labelLeft.toLowerCase()}`;
  }
}

/**
 * Berechnet die Intensität basierend auf Varianz/Streuung
 * Hohe Übereinstimmung = "sehr", moderate = "überwiegend", niedrig = "eher"
 */
export function calculateIntensity(variance: number): 'strong' | 'moderate' | 'slight' {
  if (variance < 150) return 'strong';      // Sehr einheitliche Meinung
  if (variance < 300) return 'moderate';    // Mehrheitsmeinung
  return 'slight';                          // Geteilte Meinungen
}

/**
 * Generiert sprachliche Zusammenfassung aus Aggregate-Daten
 * 
 * Output-Format:
 * [
 *   "überwiegend sprachlich anspruchsvoll",
 *   "ruhiges Erzähltempo", 
 *   "eher melancholische Grundstimmung"
 * ]
 */
export function aggregateToTextBullets(
  aggregateScales: Record<string, { average: number; count: number }>,
  bookWorld: BookWorldForRating,
  minRatings: number = 3
): string[] {
  const bullets: string[] = [];
  const scales = BOOK_WORLD_SCALES[bookWorld];

  for (const scale of scales) {
    const data = aggregateScales[scale.id];
    
    // Skip wenn nicht genug Bewertungen
    if (!data || data.count < minRatings) {
      continue;
    }

    // Varianz-Simulation (in production würde das vom Backend kommen)
    const estimatedVariance = 200; // Placeholder
    const intensity = calculateIntensity(estimatedVariance);
    
    const label = scaleValueToLabel(scale.id, data.average, bookWorld, intensity);
    
    if (label) {
      bullets.push(label);
    }
  }

  return bullets;
}

/**
 * Generiert User-Profil als Fließtext
 * 
 * Output-Beispiel:
 * "Du bevorzugst ruhiges Erzähltempo, sprachlich anspruchsvolle Texte und eher melancholische Grundstimmung."
 */
export function profileToText(
  profile: Record<string, number>,
  bookWorld: BookWorldForRating
): string {
  const scales = BOOK_WORLD_SCALES[bookWorld];
  const preferences: string[] = [];

  for (const scale of scales) {
    const value = profile[scale.id];
    
    if (value === undefined) continue;

    // Nur ausgeprägte Präferenzen erwähnen (nicht die Mitte)
    if (value < 40 || value > 60) {
      const label = scaleValueToLabel(scale.id, value, bookWorld, 'moderate');
      preferences.push(label);
    }
  }

  if (preferences.length === 0) {
    return 'Dein Leseprofil ist noch nicht ausgeprägt genug für eine Einschätzung.';
  }

  // Zusammenbau als Fließtext
  if (preferences.length === 1) {
    return `Du bevorzugst ${preferences[0]}.`;
  } else if (preferences.length === 2) {
    return `Du bevorzugst ${preferences[0]} und ${preferences[1]}.`;
  } else {
    const last = preferences.pop();
    return `Du bevorzugst ${preferences.join(', ')} und ${last}.`;
  }
}

/**
 * Generiert eine einzelne Buchbewertung als Text
 * 
 * Output-Beispiel:
 * "ruhig / kontemplativ, sprachlich anspruchsvoll, melancholische Grundstimmung"
 */
export function ratingToText(
  scales: Record<string, number>,
  bookWorld: BookWorldForRating
): string {
  const scaleDefinitions = BOOK_WORLD_SCALES[bookWorld];
  const descriptions: string[] = [];

  for (const scale of scaleDefinitions) {
    const value = scales[scale.id];
    
    if (value === undefined) continue;

    // Kompakte Form basierend auf 5-Segment-System
    let desc = '';
    
    if (value >= 81) {
      desc = `sehr ${scale.labelRight.toLowerCase()}`;
    } else if (value >= 61) {
      desc = scale.labelRight.toLowerCase();
    } else if (value >= 41) {
      desc = 'ausgewogen';
    } else if (value >= 21) {
      desc = scale.labelLeft.toLowerCase();
    } else {
      desc = `sehr ${scale.labelLeft.toLowerCase()}`;
    }

    descriptions.push(desc);
  }

  return descriptions.join(', ');
}

/**
 * Gibt Empfehlungs-Text basierend auf Profil-Match
 * 
 * Output-Beispiel:
 * "Bücher mit vergleichbarer sprachlicher Dichte und ruhigem Tempo"
 */
export function matchReasonToText(
  matchPercentage: number,
  sharedCharacteristics: string[]
): string {
  if (matchPercentage >= 90) {
    return `Sehr ähnlich zu deinem Leseprofil: ${sharedCharacteristics.join(', ')}`;
  } else if (matchPercentage >= 75) {
    return `Bücher mit vergleichbarer ${sharedCharacteristics.join(' und ')}`;
  } else if (matchPercentage >= 60) {
    return `Ähnlich in Bezug auf ${sharedCharacteristics.join(' und ')}`;
  } else {
    return 'Könnte eine interessante Abwechslung sein';
  }
}

/**
 * Formatiert einen Wert als Richtungsbeschreibung
 * Nützlich für Vergleiche zwischen User und Community
 */
export function getDirection(value: number): string {
  if (value >= 67) return 'hoch';
  if (value <= 33) return 'niedrig';
  return 'mittel';
}

/**
 * Vergleicht User-Wert mit Community-Durchschnitt und gibt Kontext
 * 
 * Output-Beispiel:
 * "Du empfandest das Tempo dynamischer als die meisten Leser"
 */
export function compareWithCommunity(
  scaleName: string,
  userValue: number,
  communityAverage: number
): string {
  const diff = userValue - communityAverage;
  
  if (Math.abs(diff) < 15) {
    return `Deine Einschätzung entspricht dem Community-Durchschnitt`;
  }
  
  const direction = diff > 0 ? 'höher' : 'niedriger';
  const intensity = Math.abs(diff) > 30 ? 'deutlich' : 'etwas';
  
  return `Du bewertest ${scaleName} ${intensity} ${direction} als die meisten Leser`;
}