/** Seed iniziale della modalità demo (persistito in localStorage). */

function iso(dayOffset: number, hour: number, min = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, min, 0, 0);
  return d.toISOString();
}

function isoEnd(startIso: string, minutes: number): string {
  return new Date(new Date(startIso).getTime() + minutes * 60000).toISOString();
}

const nowIso = () => new Date().toISOString();

export interface DemoUser {
  id: string;
  email: string;
  password: string;
}

export const demoUsers: DemoUser[] = [
  { id: 'demo-super-admin', email: 'superadmin@demo.it', password: 'super1234' },
  { id: 'demo-admin', email: 'admin@demo.it', password: 'admin1234' },
  { id: 'demo-client', email: 'cliente@demo.it', password: 'demo1234' },
  { id: 'demo-client-2', email: 'giulia@demo.it', password: 'demo1234' },
];

export const LOC = {
  copertino: '33333333-3333-3333-3333-333333333301',
  santIsidoro: '33333333-3333-3333-3333-333333333302',
};

const ST = {
  stefania: '22222222-2222-2222-2222-222222222201',
  davide: '22222222-2222-2222-2222-222222222202',
  giulia: '22222222-2222-2222-2222-222222222203',
};

const SV = {
  taglioDonna: '11111111-1111-1111-1111-111111111101',
  taglioPiega: '11111111-1111-1111-1111-111111111102',
  frangia: '11111111-1111-1111-1111-111111111103',
  restyling: '11111111-1111-1111-1111-111111111104',
  piegaCorti: '11111111-1111-1111-1111-111111111105',
  piegaMedi: '11111111-1111-1111-1111-111111111106',
  piegaLunghi: '11111111-1111-1111-1111-111111111107',
  piegaOnde: '11111111-1111-1111-1111-111111111108',
  piegaLiscia: '11111111-1111-1111-1111-111111111109',
  ricrescita: '11111111-1111-1111-1111-111111111110',
  coloreCompleto: '11111111-1111-1111-1111-111111111111',
  tonalizzante: '11111111-1111-1111-1111-111111111112',
  gloss: '11111111-1111-1111-1111-111111111113',
  bagnoColore: '11111111-1111-1111-1111-111111111114',
  meches: '11111111-1111-1111-1111-111111111115',
  balayage: '11111111-1111-1111-1111-111111111116',
  degrade: '11111111-1111-1111-1111-111111111117',
  schiariture: '11111111-1111-1111-1111-111111111118',
  nutriente: '11111111-1111-1111-1111-111111111119',
  ristrutturante: '11111111-1111-1111-1111-111111111120',
  anticrespo: '11111111-1111-1111-1111-111111111121',
  cute: '11111111-1111-1111-1111-111111111122',
  luminosita: '11111111-1111-1111-1111-111111111123',
  acconciaturaSemplice: '11111111-1111-1111-1111-111111111124',
  evento: '11111111-1111-1111-1111-111111111125',
  raccolto: '11111111-1111-1111-1111-111111111126',
  sposa: '11111111-1111-1111-1111-111111111127',
};

const serviceImages = {
  taglio: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=900&q=82',
  piega: 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=900&q=82',
  colore: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=900&q=82',
  schiaritura: 'https://images.unsplash.com/photo-1600948836101-f9ffda59d250?auto=format&fit=crop&w=900&q=82',
  trattamento: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=900&q=82',
  acconciatura: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=900&q=82',
};

function service(
  id: string,
  category: string,
  name: string,
  duration: number,
  price: number,
  image_url: string,
  sort_order: number,
  staff_ids = [ST.stefania, ST.davide, ST.giulia],
  location_ids = [LOC.copertino, LOC.santIsidoro],
  price_from = true
) {
  return {
    id,
    name,
    description:
      'Servizio demo con prezzo e durata indicativi. Verificare listino, tempi tecnici e note operative con il salone.',
    category,
    duration_minutes: duration,
    buffer_minutes: 10,
    price,
    price_from,
    image_url,
    location_ids,
    staff_ids,
    preliminary_questions: [],
    public_visible: true,
    notes: 'Dati demo da confermare con il cliente.',
    active: true,
    sort_order,
    created_at: nowIso(),
    updated_at: nowIso(),
  };
}

export function buildDemoDb() {
  const windows = [
    [2, '08:30:00', '13:00:00'],
    [2, '15:30:00', '19:30:00'],
    [3, '08:30:00', '13:00:00'],
    [3, '15:30:00', '19:30:00'],
    [4, '08:30:00', '13:00:00'],
    [4, '15:30:00', '19:30:00'],
    [5, '08:30:00', '13:00:00'],
    [5, '15:30:00', '19:30:00'],
    [6, '08:30:00', '13:00:00'],
    [6, '15:30:00', '19:30:00'],
  ] as const;

  const availability = Object.values(ST).flatMap((staffId) =>
    windows.map(([weekday, start_time, end_time], i) => ({
      id: `av-${staffId}-${i}`,
      staff_id: staffId,
      location_id: LOC.copertino,
      weekday,
      start_time,
      end_time,
      created_at: nowIso(),
    }))
  ).concat(
    [ST.stefania, ST.giulia].flatMap((staffId) =>
      windows.slice(0, 6).map(([weekday, start_time, end_time], i) => ({
        id: `av-si-${staffId}-${i}`,
        staff_id: staffId,
        location_id: LOC.santIsidoro,
        weekday,
        start_time,
        end_time,
        created_at: nowIso(),
      }))
    )
  );

  const mkAppt = (
    id: string,
    client_id: string,
    staff_id: string,
    service_id: string,
    location_id: string,
    startIso: string,
    duration: number,
    price: number,
    status: string,
    notes = ''
  ) => ({
    id,
    client_id,
    staff_id,
    service_id,
    location_id,
    starts_at: startIso,
    ends_at: isoEnd(startIso, duration),
    status,
    price,
    notes,
    created_by: client_id,
    created_at: nowIso(),
    updated_at: nowIso(),
  });

  return {
    profiles: [
      { id: 'demo-super-admin', full_name: 'BNS Studio Demo', email: 'superadmin@demo.it', phone: '+39 333 0000000', role: 'super_admin', created_at: iso(-180, 9), updated_at: nowIso() },
      { id: 'demo-admin', full_name: 'Responsabile Salone', email: 'admin@demo.it', phone: '+39 333 0000001', role: 'salon_admin', created_at: iso(-120, 9), updated_at: nowIso() },
      { id: 'demo-client', full_name: 'Cliente Demo', email: 'cliente@demo.it', phone: '+39 333 1234567', role: 'client', created_at: iso(-40, 9), updated_at: nowIso() },
      { id: 'demo-client-2', full_name: 'Giulia Neri', email: 'giulia@demo.it', phone: '+39 333 7654321', role: 'client', created_at: iso(-20, 9), updated_at: nowIso() },
      { id: 'demo-client-3', full_name: 'Laura Bianchi', email: 'laura@demo.it', phone: '+39 333 2223334', role: 'client', created_at: iso(-10, 9), updated_at: nowIso() },
    ],
    locations: [
      {
        id: LOC.copertino,
        name: 'Liberi di Essere - Copertino',
        address: 'Via Madonna delle Grazie 102, 73043 Copertino LE',
        directions: 'Sede principale. CAP demo verificato: 73043.',
        phone: '+39 000 0000000',
        email: 'demo@liberidiessere.bnsstudio.it',
        map_url: 'https://www.google.com/maps?q=Via+Madonna+delle+Grazie+102+73043+Copertino+LE',
        image_url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=900&q=82',
        active: true,
        seasonal: false,
        show_when_inactive: true,
        season_start: null,
        season_end: null,
        max_simultaneous_appointments: 3,
        info_message: 'Sede principale demo. Telefono, email e orari ufficiali da confermare.',
        sort_order: 1,
        created_at: nowIso(),
        updated_at: nowIso(),
      },
      {
        id: LOC.santIsidoro,
        name: 'Liberi di Essere - Sant’Isidoro',
        address: 'Sant’Isidoro, vicino al Bar Orange',
        directions: 'Indirizzo provvisorio: non inventare via e civico finché non forniti.',
        phone: '+39 000 0000000',
        email: 'demo@liberidiessere.bnsstudio.it',
        map_url: null,
        image_url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=900&q=82',
        active: false,
        seasonal: true,
        show_when_inactive: true,
        season_start: '2026-06-15',
        season_end: '2026-09-15',
        max_simultaneous_appointments: 2,
        info_message: 'Sede stagionale demo. Il periodo di apertura deve essere confermato.',
        sort_order: 2,
        created_at: nowIso(),
        updated_at: nowIso(),
      },
    ],
    services: [
      service(SV.taglioDonna, 'Taglio', 'Taglio donna', 45, 32, serviceImages.taglio, 1, [ST.stefania, ST.davide]),
      service(SV.taglioPiega, 'Taglio', 'Taglio e piega', 75, 42, serviceImages.taglio, 2, [ST.stefania, ST.davide]),
      service(SV.frangia, 'Taglio', 'Regolazione frangia', 20, 12, serviceImages.taglio, 3, [ST.stefania, ST.davide], [LOC.copertino], false),
      service(SV.restyling, 'Taglio', 'Restyling completo', 110, 68, serviceImages.taglio, 4, [ST.stefania]),
      service(SV.piegaCorti, 'Piega', 'Piega capelli corti', 30, 20, serviceImages.piega, 5, [ST.stefania, ST.davide, ST.giulia], [LOC.copertino, LOC.santIsidoro], false),
      service(SV.piegaMedi, 'Piega', 'Piega capelli medi', 40, 24, serviceImages.piega, 6, [ST.stefania, ST.davide, ST.giulia]),
      service(SV.piegaLunghi, 'Piega', 'Piega capelli lunghi', 50, 30, serviceImages.piega, 7, [ST.stefania, ST.giulia]),
      service(SV.piegaOnde, 'Piega', 'Piega con onde', 50, 32, serviceImages.piega, 8, [ST.stefania, ST.giulia]),
      service(SV.piegaLiscia, 'Piega', 'Piega liscia', 40, 26, serviceImages.piega, 9),
      service(SV.ricrescita, 'Colore', 'Colore ricrescita', 90, 45, serviceImages.colore, 10, [ST.stefania, ST.giulia]),
      service(SV.coloreCompleto, 'Colore', 'Colore completo', 120, 62, serviceImages.colore, 11, [ST.stefania, ST.giulia]),
      service(SV.tonalizzante, 'Colore', 'Tonalizzante', 60, 35, serviceImages.colore, 12, [ST.stefania, ST.giulia]),
      service(SV.gloss, 'Colore', 'Gloss', 45, 28, serviceImages.colore, 13, [ST.stefania, ST.giulia]),
      service(SV.bagnoColore, 'Colore', 'Bagno di colore', 70, 38, serviceImages.colore, 14, [ST.stefania, ST.giulia]),
      service(SV.meches, 'Tecniche di schiaritura', 'Meches', 150, 80, serviceImages.schiaritura, 15, [ST.stefania, ST.giulia]),
      service(SV.balayage, 'Tecniche di schiaritura', 'Balayage', 170, 95, serviceImages.schiaritura, 16, [ST.stefania, ST.giulia]),
      service(SV.degrade, 'Tecniche di schiaritura', 'Degradé', 180, 110, serviceImages.schiaritura, 17, [ST.stefania]),
      service(SV.schiariture, 'Tecniche di schiaritura', 'Schiariture personalizzate', 150, 90, serviceImages.schiaritura, 18, [ST.stefania, ST.giulia]),
      service(SV.nutriente, 'Trattamenti', 'Trattamento nutriente', 35, 25, serviceImages.trattamento, 19),
      service(SV.ristrutturante, 'Trattamenti', 'Trattamento ristrutturante', 45, 34, serviceImages.trattamento, 20),
      service(SV.anticrespo, 'Trattamenti', 'Trattamento anticrespo', 70, 58, serviceImages.trattamento, 21, [ST.stefania, ST.giulia]),
      service(SV.cute, 'Trattamenti', 'Trattamento cute', 40, 30, serviceImages.trattamento, 22, [ST.stefania]),
      service(SV.luminosita, 'Trattamenti', 'Trattamento luminosità', 40, 30, serviceImages.trattamento, 23),
      service(SV.acconciaturaSemplice, 'Acconciature', 'Acconciatura semplice', 60, 45, serviceImages.acconciatura, 24, [ST.stefania, ST.giulia]),
      service(SV.evento, 'Acconciature', 'Acconciatura evento', 90, 70, serviceImages.acconciatura, 25, [ST.stefania, ST.giulia]),
      service(SV.raccolto, 'Acconciature', 'Raccolto', 80, 60, serviceImages.acconciatura, 26, [ST.stefania, ST.giulia]),
      service(SV.sposa, 'Acconciature', 'Prova acconciatura sposa', 120, 90, serviceImages.acconciatura, 27, [ST.stefania], [LOC.copertino]),
    ],
    staff_members: [
      {
        id: ST.stefania,
        full_name: 'Stefania',
        role_title: 'Operatrice principale',
        bio: 'Operatrice principale reale indicata dal cliente. Bio e foto ufficiali da confermare.',
        avatar_url: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=700&q=82',
        skills: ['Taglio', 'Piega', 'Colore', 'Schiariture', 'Acconciature'],
        location_ids: [LOC.copertino, LOC.santIsidoro],
        service_ids: Object.values(SV),
        active: true,
        sort_order: 1,
        created_at: nowIso(),
        updated_at: nowIso(),
      },
      {
        id: ST.davide,
        full_name: 'Davide',
        role_title: 'Hair stylist demo',
        bio: 'Dato dimostrativo modificabile o eliminabile dalla dashboard.',
        avatar_url: 'https://images.unsplash.com/photo-1582893561942-d61adcb2e534?auto=format&fit=crop&w=700&q=82',
        skills: ['Taglio', 'Piega', 'Trattamenti'],
        location_ids: [LOC.copertino],
        service_ids: [SV.taglioDonna, SV.taglioPiega, SV.frangia, SV.piegaCorti, SV.piegaMedi, SV.piegaLiscia, SV.nutriente, SV.ristrutturante, SV.luminosita],
        active: true,
        sort_order: 2,
        created_at: nowIso(),
        updated_at: nowIso(),
      },
      {
        id: ST.giulia,
        full_name: 'Giulia',
        role_title: 'Colorist demo',
        bio: 'Dato dimostrativo per colore, schiariture, pieghe e acconciature.',
        avatar_url: 'https://images.unsplash.com/photo-1595152772835-219674b2a8a6?auto=format&fit=crop&w=700&q=82',
        skills: ['Piega', 'Colore', 'Schiariture', 'Acconciature'],
        location_ids: [LOC.copertino, LOC.santIsidoro],
        service_ids: [SV.piegaCorti, SV.piegaMedi, SV.piegaLunghi, SV.piegaOnde, SV.ricrescita, SV.coloreCompleto, SV.tonalizzante, SV.gloss, SV.bagnoColore, SV.meches, SV.balayage, SV.schiariture, SV.acconciaturaSemplice, SV.evento, SV.raccolto],
        active: true,
        sort_order: 3,
        created_at: nowIso(),
        updated_at: nowIso(),
      },
    ],
    staff_availability: availability,
    salon_closures: [
      {
        id: 'cl-demo-1',
        staff_id: null,
        location_id: LOC.copertino,
        start_date: '2026-08-15',
        end_date: '2026-08-15',
        reason: 'Ferragosto - chiusura demo',
        created_at: nowIso(),
      },
      {
        id: 'cl-demo-2',
        staff_id: ST.giulia,
        location_id: null,
        start_date: '2026-07-28',
        end_date: '2026-07-29',
        reason: 'Assenza demo Giulia',
        created_at: nowIso(),
      },
    ],
    appointments: [
      mkAppt('ap-1', 'demo-client', ST.stefania, SV.taglioPiega, LOC.copertino, iso(2, 10), 75, 42, 'confirmed', 'Prenotazione demo confermata'),
      mkAppt('ap-2', 'demo-client', ST.giulia, SV.ricrescita, LOC.copertino, iso(5, 15, 30), 90, 45, 'confirmed'),
      mkAppt('ap-3', 'demo-client', ST.davide, SV.piegaMedi, LOC.copertino, iso(-7, 11), 40, 24, 'completed'),
      mkAppt('ap-4', 'demo-client-2', ST.stefania, SV.balayage, LOC.copertino, iso(1, 8, 30), 170, 95, 'confirmed'),
      mkAppt('ap-5', 'demo-client-3', ST.giulia, SV.piegaOnde, LOC.copertino, iso(-3, 16), 50, 32, 'cancelled'),
    ],
    notifications: [
      { id: 'nt-1', user_id: 'demo-client', title: 'Prenotazione confermata', message: 'Taglio e piega è confermato in ambiente demo.', type: 'booking_created', entity_type: 'appointment', entity_id: 'ap-1', route: '/dashboard/appuntamenti?appointment=ap-1', action_url: null, metadata: {}, delivery_status: 'demo_simulated', read: false, read_at: null, appointment_id: 'ap-1', created_at: iso(-1, 9) },
      { id: 'nt-2', user_id: 'demo-admin', title: 'Nuova prenotazione demo', message: 'Cliente Demo ha prenotato Taglio e piega.', type: 'booking_created', entity_type: 'appointment', entity_id: 'ap-1', route: '/admin/calendario?appointment=ap-1', action_url: null, metadata: {}, delivery_status: 'demo_simulated', read: false, read_at: null, appointment_id: 'ap-1', created_at: iso(-1, 9) },
      { id: 'nt-3', user_id: 'demo-super-admin', title: 'Ambiente demo attivo', message: 'Le notifiche sono simulate: nessuna email/SMS/WhatsApp reale viene inviata.', type: 'system', entity_type: 'settings', entity_id: null, route: '/admin/impostazioni', action_url: null, metadata: {}, delivery_status: 'demo_simulated', read: false, read_at: null, appointment_id: null, created_at: iso(-2, 12) },
    ],
    settings: [
      {
        key: 'brand',
        value: {
          salon_name: 'Liberi di Essere',
          logo_text: 'Liberi di Essere',
          logo_url: null,
          favicon_url: '/favicon.svg',
          primary_color: '#2f665f',
          accent_color: '#d8a48f',
          booking_message:
            'Ambiente demo: le prenotazioni non rappresentano appuntamenti reali presso il salone.',
        },
        updated_at: nowIso(),
      },
    ],
    content_sections: [],
    media: [],
    audit_logs: [],
  };
}

export type DemoDb = ReturnType<typeof buildDemoDb>;
