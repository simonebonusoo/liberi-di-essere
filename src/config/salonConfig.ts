/**
 * =============================================================================
 * CONFIG MODULARE DEL SALONE
 * -----------------------------------------------------------------------------
 * Per riadattare TUTTO il sito a un altro parrucchiere modifica (quasi) solo
 * questo file: nome, colori, contatti, orari, testi, immagini.
 * I servizi/staff "reali" vivono nel database Supabase (gestibili da admin);
 * quelli qui sotto servono come vetrina statica + fallback.
 * =============================================================================
 */

export interface WeeklyHours {
  /** 0 = Domenica ... 6 = Sabato */
  day: number;
  label: string;
  open: string | null; // "09:00" oppure null se chiuso
  close: string | null;
}

export interface SalonConfig {
  name: string;
  logoText: string;
  tagline: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
  aboutTitle: string;
  aboutText: string;

  contact: {
    address: string;
    postalCode: string;
    city: string;
    phone: string;
    email: string;
    instagram: string;
    mapEmbedUrl: string;
  };

  /** Palette in HEX; convertita in CSS variables da applyThemeFromConfig(). */
  colors: {
    brand: string; // colore principale
    accent: string; // colore CTA / accento
  };

  hours: WeeklyHours[];

  booking: {
    /** Passo di generazione slot in minuti (es. 15). */
    slotIntervalMinutes: number;
    /** Buffer tra un appuntamento e il successivo (minuti). */
    bufferMinutes: number;
    /** Ore minime di preavviso per cancellare un appuntamento. */
    cancellationThresholdHours: number;
    /** Quanti giorni in avanti si può prenotare. */
    maxAdvanceDays: number;
    cancellationPolicyText: string;
    demoBookingMessage: string;
  };

  /** Vetrina statica (il DB resta la fonte reale). */
  showcaseServices: { name: string; description: string; price: number; duration: number }[];
  whyChooseUs: { title: string; text: string; icon: string }[];
  gallery: string[];
  team: { name: string; role: string; photo: string }[];
  locations: {
    id: string;
    name: string;
    address: string;
    info: string;
    seasonal: boolean;
  }[];
}

export const salonConfig: SalonConfig = {
  name: 'Liberi di Essere',
  logoText: 'Liberi di Essere',
  tagline: 'Salone femminile',
  heroTitle: 'Liberi di Essere',
  heroSubtitle:
    'Demo professionale per prenotare taglio, piega, colore e trattamenti in un ambiente accogliente. Testi, immagini e dati sono provvisori e modificabili dalla dashboard.',
  heroImage:
    'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1800&q=82',
  aboutTitle: 'Una demo elegante, semplice da gestire',
  aboutText:
    'Il sistema mostra un salone femminile con due sedi, operatori, servizi e disponibilità configurabili. Le informazioni non confermate restano dati demo fino alla validazione del cliente.',

  contact: {
    address: 'Via Madonna delle Grazie 102',
    postalCode: '73043',
    city: 'Copertino (LE)',
    phone: '+39 000 0000000',
    email: 'demo@liberidiessere.bnsstudio.it',
    instagram: 'https://instagram.com/liberidiessere_demo',
    mapEmbedUrl:
      'https://www.google.com/maps?q=Via+Madonna+delle+Grazie+102+73043+Copertino+LE&output=embed',
  },

  colors: {
    brand: '#2f665f',
    accent: '#d8a48f',
  },

  hours: [
    { day: 1, label: 'Lunedì', open: null, close: null },
    { day: 2, label: 'Martedì', open: '08:30-13:00', close: '15:30-19:30' },
    { day: 3, label: 'Mercoledì', open: '08:30-13:00', close: '15:30-19:30' },
    { day: 4, label: 'Giovedì', open: '08:30-13:00', close: '15:30-19:30' },
    { day: 5, label: 'Venerdì', open: '08:30-13:00', close: '15:30-19:30' },
    { day: 6, label: 'Sabato', open: '08:30-13:00', close: '15:30-19:30' },
    { day: 0, label: 'Domenica', open: null, close: null },
  ],

  booking: {
    slotIntervalMinutes: 15,
    bufferMinutes: 10,
    cancellationThresholdHours: 24,
    maxAdvanceDays: 60,
    cancellationPolicyText:
      'In demo la cancellazione cliente è consentita fino a 24 ore prima. La policy definitiva deve essere confermata dal salone.',
    demoBookingMessage:
      'Ambiente demo: la prenotazione viene salvata nel sistema dimostrativo e non rappresenta un appuntamento reale presso il salone.',
  },

  showcaseServices: [
    { name: 'Taglio e piega', description: 'Consulenza, taglio e styling finale.', price: 42, duration: 75 },
    { name: 'Piega con onde', description: 'Styling morbido per capelli medi o lunghi.', price: 28, duration: 45 },
    { name: 'Colore ricrescita', description: 'Servizio colore con prezzo indicativo da verificare.', price: 45, duration: 90 },
    { name: 'Balayage', description: 'Schiariture personalizzate, prezzo a partire da.', price: 85, duration: 150 },
  ],

  whyChooseUs: [
    { title: 'Dati modificabili', text: 'Servizi, operatori, sedi e orari si gestiscono dalla dashboard.', icon: 'sparkles' },
    { title: 'Operatori compatibili', text: 'La prenotazione propone solo disponibilità coerenti.', icon: 'scissors' },
    { title: 'Multi-sede', text: 'Copertino e Sant’Isidoro sono configurate separatamente.', icon: 'calendar' },
    { title: 'Demo sicura', text: 'Gli appuntamenti demo sono riconoscibili e ripristinabili.', icon: 'heart' },
  ],

  gallery: [
    'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=900&q=82',
    'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?auto=format&fit=crop&w=900&q=82',
    'https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=900&q=82',
    'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=900&q=82',
    'https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=900&q=82',
    'https://images.unsplash.com/photo-1605497788044-5a32c7078486?auto=format&fit=crop&w=900&q=82',
  ],

  team: [
    { name: 'Stefania', role: 'Operatrice principale', photo: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=700&q=82' },
    { name: 'Davide', role: 'Hair stylist demo', photo: 'https://images.unsplash.com/photo-1582893561942-d61adcb2e534?auto=format&fit=crop&w=700&q=82' },
    { name: 'Giulia', role: 'Colorist demo', photo: 'https://images.unsplash.com/photo-1595152772835-219674b2a8a6?auto=format&fit=crop&w=700&q=82' },
  ],

  locations: [
    {
      id: '33333333-3333-3333-3333-333333333301',
      name: 'Liberi di Essere - Copertino',
      address: 'Via Madonna delle Grazie 102, 73043 Copertino LE',
      info: 'Sede principale demo. Verificare telefono, email e orari ufficiali con il cliente.',
      seasonal: false,
    },
    {
      id: '33333333-3333-3333-3333-333333333302',
      name: 'Liberi di Essere - Sant’Isidoro',
      address: 'Sant’Isidoro, vicino al Bar Orange',
      info: 'Sede stagionale con indirizzo provvisorio. Non è prenotabile quando non attiva.',
      seasonal: true,
    },
  ],
};

// -----------------------------------------------------------------------------
// Helpers palette: HEX -> "r g b" e generazione scala colori a runtime.
// -----------------------------------------------------------------------------
function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const num = parseInt(full, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function mix([r, g, b]: [number, number, number], target: number, amount: number): [number, number, number] {
  return [
    Math.round(r + (target - r) * amount),
    Math.round(g + (target - g) * amount),
    Math.round(b + (target - b) * amount),
  ];
}

/** Applica la palette del config come CSS variables sul :root. */
export function applyThemeFromConfig(config: SalonConfig = salonConfig): void {
  const root = document.documentElement;
  const brand = hexToRgb(config.colors.brand);
  const accent = hexToRgb(config.colors.accent);

  const brandScale: Record<number, [number, number, number]> = {
    50: mix(brand, 255, 0.92),
    100: mix(brand, 255, 0.84),
    200: mix(brand, 255, 0.68),
    300: mix(brand, 255, 0.48),
    400: mix(brand, 255, 0.24),
    500: brand,
    600: mix(brand, 0, 0.16),
    700: mix(brand, 0, 0.34),
    800: mix(brand, 0, 0.52),
    900: mix(brand, 0, 0.68),
  };

  Object.entries(brandScale).forEach(([k, rgb]) => {
    root.style.setProperty(`--brand-${k}`, rgb.join(' '));
  });
  root.style.setProperty('--accent-400', mix(accent, 255, 0.2).join(' '));
  root.style.setProperty('--accent-500', accent.join(' '));
  root.style.setProperty('--accent-600', mix(accent, 0, 0.16).join(' '));
}
