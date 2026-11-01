/**
 * Everything the deck says, in one place. Edit the words here; the slides only
 * lay them out. Numbers come from the app itself (prices, plans, features) or
 * from our market research doc (sources listed next to each one).
 *
 * Things marked TODO are yours to fill in (team names, real tester notes).
 */

export const brand = {
  name: 'yazılnow',
  tagline: 'Find a free time with Baku’s barbers and salons — and book it in one tap.',
  taglineAz: 'Ustanı tap, vaxtını tut.',
  website: 'yazilnow.az',
  email: 'support@yazilnow.az',
  course: 'Introduction to Entrepreneurship · Group Project 1',
};

export const problem = {
  kicker: 'The problem',
  title: 'In Baku, booking a haircut still means a DM — and a wait.',
  points: [
    {
      figure: '6 / 10',
      text: 'salons take bookings through WhatsApp, Instagram DMs or phone calls.',
      source: 'Our field check of 37 top-rated Baku salons (Google reviews, Instagram), Oct 2026',
    },
    {
      figure: '0',
      text: 'apps show free times across the whole city. Salon tools like DIKIDI or Rezneed each show one salon.',
      source: 'Competitor review: DIKIDI, Arnica, Rezneed, Altegio, YCLIENTS, Fresha, Booksy',
    },
    {
      figure: '20%',
      text: 'of a new client’s bill goes to Fresha. Booksy adds $20 a month for every extra master.',
      source: 'Fresha pricing (CostBench), Booksy pricing (Koalendar)',
    },
  ],
  /** The chat the motion graphic plays. */
  chat: [
    { from: 'client', text: 'Salam! Sabah saat 6-da yer var?' },
    { from: 'salon', text: 'Salam, baxıb yazaram 🙏' },
    { from: 'time', text: '2 saat sonra' },
    { from: 'client', text: 'Bəs?' },
    { from: 'salon', text: 'Bağışlayın, artıq dolmuşuq' },
  ],
};

export const solution = {
  kicker: 'Our solution',
  title: 'Every free time in the city, on one map.',
  pillars: [
    {
      title: 'For clients',
      lines: ['Live free times across Baku', 'Compare salons side by side', 'Book in four steps, no calls'],
    },
    {
      title: 'For salons',
      lines: ['One flat monthly price', 'Unlimited masters, 0% commission', 'Clients find them on the map'],
    },
    {
      title: 'Trust',
      lines: ['Reviews only after a real visit', 'One-time QR codes at the chair', 'Azerbaijani, Russian, English'],
    },
  ],
  unique:
    'City-wide free-time search and side-by-side comparison: none of the nine booking tools we checked in Baku offer them.',
};

export const productClients = {
  kicker: 'Product · for clients',
  title: 'Find, compare, book.',
  features: [
    { title: 'Free times today', text: 'The nearest open slots in the city, for the service you want.' },
    { title: 'Map and filters', text: 'Price range, rating, distance, women-only salons, English-speaking masters.' },
    { title: 'Compare', text: 'Up to three salons: price, rating, distance and next free time.' },
    { title: 'Book', text: 'Services, master, day, time. Reminders 24 h and 2 h before.' },
  ],
};

export const productSalons = {
  kicker: 'Product · for salons',
  title: 'A salon panel, not a CRM to learn.',
  features: [
    'Calendar, walk-ins and time off',
    'Masters and services — no per-seat fees',
    'One-time QR codes for reviews',
    'Statistics and a monthly click report',
    'Branches and manager roles (Pro)',
    'Deposits and a waitlist (Pro)',
  ],
  note: 'Runs in the app and in any browser.',
};

/**
 * TODO: these are placeholder notes. Replace them with what your testers
 * actually said. Testers stay anonymous: only a number and their role.
 */
export const testers = {
  kicker: 'Beta test',
  title: '5 people used it on our test server.',
  subtitle: 'Anonymous. Three clients, one salon owner, one barber.',
  notes: [
    { who: 'Tester 1 · client', text: 'I saw three free times at once instead of messaging three salons.' },
    {
      who: 'Tester 2 · client',
      text: 'Comparing prices side by side made the choice quick. I’d like more photos of the work.',
    },
    {
      who: 'Tester 3 · salon owner',
      text: 'Adding masters and hours took a few minutes. I want reminders to go out on WhatsApp.',
    },
    { who: 'Tester 4 · barber', text: 'The QR review is easy — clients did it before leaving the chair.' },
    { who: 'Tester 5 · client', text: 'Booking in Azerbaijani felt natural. The reminder before the visit helped.' },
  ],
};

export const market = {
  kicker: 'Market',
  title: 'Baku’s salons have tools for themselves. Clients have nothing.',
  who: [
    {
      label: 'Where',
      text: 'Baku first — about 2.3 million people',
      source: 'State Statistics Committee of Azerbaijan',
    },
    { label: 'Salons', text: 'Barbershops, hair and beauty salons, nail and brow studios, spa, makeup' },
    { label: 'Clients', text: 'People who book by DM today, and visitors who need English and clear prices' },
  ],
  /** Monthly price for a salon with 5 masters, in AZN ($1 = 1.70 ₼). */
  chartTitle: 'What a salon with 5 masters pays a month',
  chart: [
    { name: 'Booksy', value: 187, note: '$29.99 + $20 per extra master' },
    { name: 'Fresha', value: 127, note: '$14.95 per master + 20% of new clients' },
    { name: 'yazılnow Pro', value: 49, note: 'flat, branches and deposits included', ours: true },
    { name: 'yazılnow Start', value: 29, note: 'flat, unlimited masters', ours: true },
  ],
  chartSource: 'Fresha (CostBench), Booksy (Koalendar); our prices from the app',
  trend: 'The market already moved booking online — into messengers. The client side is still empty.',
};

export const model = {
  kicker: 'Business model',
  title: 'A flat monthly plan. No commission.',
  plans: [
    {
      name: 'Sadə',
      price: 10,
      lines: ['On the map', 'QR reviews and replies', '“Book” button to the salon’s own page', 'Monthly click report'],
    },
    {
      name: 'Start',
      price: 29,
      lines: ['Everything in Sadə', 'Online booking and calendar', 'Unlimited masters', 'Reminders for clients'],
    },
    {
      name: 'Pro',
      price: 49,
      lines: [
        'Everything in Start',
        '3 branches included, +15 ₼ each extra',
        'Manager roles, combined reports',
        'Deposits, waitlist, statistics',
      ],
      recommended: true,
    },
  ],
  extras: ['30 days free, no card', 'A year costs 10 months', 'WhatsApp pack: 10 ₼ / 300 messages'],
};

export const built = {
  kicker: 'Where we are',
  title: 'Built and working — before launch.',
  done: [
    'Mobile app for iOS and Android, plus the web',
    'Salon panel in the browser',
    'Server, admin panel and website',
    'Three languages: Azerbaijani, Russian, English',
    '114 automated server tests passing',
  ],
  next: ['Connect a payment provider', 'Host the server on yazilnow.az', 'Sign the first founding salons'],
};

/** TODO: your names, roles and one-line bios. */
export const team = {
  kicker: 'Team',
  title: 'The people behind yazılnow.',
  people: [
    { name: 'Name Surname', role: 'Product & design', bio: 'One line about what you do and why it fits.' },
    { name: 'Name Surname', role: 'Engineering', bio: 'One line about what you do and why it fits.' },
    { name: 'Name Surname', role: 'Salons & growth', bio: 'One line about what you do and why it fits.' },
  ],
};

export const thanks = {
  title: 'Thank you.',
  line: 'Ustanı tap, vaxtını tut.',
};
