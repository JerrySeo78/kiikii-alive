import { getMemberById, type Member } from './data/members.js';

// ── In-memory state (resets on refresh — mockup only) ──
let oshiId:        string | null = localStorage.getItem('kiikii_oshi');
let tickets:       number = 3;
let cheeredToday:  boolean = false;
let cardToday:     boolean = false;
// mockup: 각 멤버별 노말 3장 + 지유 레어 1장 미리 수집
let collectedCards: string[] = [
  'jiyu_1', 'jiyu_3', 'jiyu_5', 'jiyu_13',
  'jiwoo_2', 'jiwoo_4',
  'subin_1',
  'sumin_2',
  'haeum_1', 'haeum_3',
];
let streak:        number = 6;
let attendedDates: Set<string> = new Set([
  '2026-05-01', '2026-05-02', '2026-05-03',
  '2026-05-04', '2026-05-05', '2026-05-06',
]);

// --- Oshi ---
export function getOshi(): Member | null {
  return oshiId ? (getMemberById(oshiId) ?? null) : null;
}

export function setOshi(memberId: string): void {
  oshiId = memberId;
  localStorage.setItem('kiikii_oshi', memberId); // onboarding 선택은 유지
  applyOshiTheme(memberId);
}

export function applyOshiTheme(memberId: string): void {
  const member = getMemberById(memberId);
  if (member) {
    document.documentElement.style.setProperty('--oshi-color', member.color);
    document.documentElement.style.setProperty('--oshi-color-light', member.color + '33');
    document.documentElement.style.setProperty('--oshi-color-mid', member.color + '88');
  }
}

// --- Tickets ---
export interface TicketRecord {
  id:     string;
  type:   'earned' | 'spent';
  reason: string;
  amount: number;
  date:   string;
}

let ticketHistory: TicketRecord[] = [
  { id: 'tk_001', type: 'spent',  reason: '팬미팅 초청 이벤트 응모',   amount: 3, date: '2026.05.01' },
  { id: 'tk_002', type: 'earned', reason: '7일 연속 출석 보너스',       amount: 3, date: '2026.04.30' },
  { id: 'tk_003', type: 'earned', reason: '응원하기',                   amount: 1, date: '2026.04.30' },
  { id: 'tk_004', type: 'earned', reason: 'Today 카드 수령',            amount: 1, date: '2026.04.29' },
  { id: 'tk_005', type: 'earned', reason: '응원하기',                   amount: 1, date: '2026.04.29' },
  { id: 'tk_006', type: 'spent',  reason: '스페셜 디지털 카드 이벤트 응모', amount: 2, date: '2026.04.28' },
  { id: 'tk_007', type: 'earned', reason: 'Today 카드 수령',            amount: 1, date: '2026.04.28' },
  { id: 'tk_008', type: 'earned', reason: '응원하기',                   amount: 1, date: '2026.04.28' },
  { id: 'tk_009', type: 'earned', reason: '3일 연속 출석 보너스',       amount: 1, date: '2026.04.27' },
  { id: 'tk_010', type: 'earned', reason: '응원하기',                   amount: 1, date: '2026.04.27' },
  { id: 'tk_011', type: 'earned', reason: 'Today 카드 수령',            amount: 1, date: '2026.04.26' },
  { id: 'tk_012', type: 'earned', reason: '응원하기',                   amount: 1, date: '2026.04.26' },
];

export function getTickets(): number { return tickets; }

export function getTicketHistory(): TicketRecord[] { return ticketHistory; }

export function addTickets(n: number, reason?: string): number {
  tickets += n;
  if (reason) {
    ticketHistory = [{
      id:     `tk_live_${Date.now()}`,
      type:   'earned',
      reason,
      amount: n,
      date:   (() => { const d = new Date(); return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`; })(),
    }, ...ticketHistory];
  }
  return tickets;
}

export function recordTicketSpend(amount: number, reason: string): void {
  ticketHistory = [{
    id:     `tk_live_${Date.now()}`,
    type:   'spent',
    reason,
    amount,
    date:   (() => { const d = new Date(); return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`; })(),
  }, ...ticketHistory];
}

export function spendTickets(n: number): boolean {
  if (tickets < n) return false;
  tickets -= n;
  return true;
}

// --- Daily Cheer ---
export function hasCheeredToday(): boolean { return cheeredToday; }
export function markCheeredToday(): void   { cheeredToday = true; }

// --- Daily Card ---
export function hasReceivedCardToday(): boolean { return cardToday; }
export function markCardReceivedToday(): void   { cardToday = true; }

// --- Collected Cards ---
export function getCollectedCards(): string[] { return collectedCards; }

export function addCollectedCard(cardId: string): void {
  if (!collectedCards.includes(cardId)) collectedCards.push(cardId);
}

export function isCardCollected(cardId: string): boolean {
  return collectedCards.includes(cardId);
}

// --- Streak ---
export function getStreak(): number { return streak; }
export function getAttendedDates(): string[] { return Array.from(attendedDates); }

export function markAttendanceToday(): number {
  const now = new Date();
  const key = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  if (!attendedDates.has(key)) {
    attendedDates.add(key);
    streak += 1;
  }
  return streak;
}

export function getStreakMilestoneBonus(newStreak: number): number {
  if (newStreak === 3)  return 1;
  if (newStreak === 7)  return 3;
  if (newStreak === 30) return 5;
  return 0;
}

// --- Vouchers ---
export interface VoucherRecord {
  id:          string;
  title:       string;
  description: string;
  issuedAt:    string;
  expiresAt?:  string;
  usedAt?:     string;
  status:      'available' | 'used';
}

let vouchers: VoucherRecord[] = [
  {
    id:          'vchr_fanmeeting',
    title:       '팬미팅 초청권',
    description: '도쿄 팬미팅 2026.07 · 1인 입장권',
    issuedAt:    '2026.04.20',
    expiresAt:   '2026.07.31',
    status:      'available',
  },
  {
    id:          'vchr_emoji',
    title:       'oshi 이모티콘 팩 코드',
    description: 'LINE 이모티콘 교환 코드 (30종)',
    issuedAt:    '2026.03.18',
    usedAt:      '2026.03.20',
    status:      'used',
  },
];

export function getVouchers(): VoucherRecord[] { return vouchers; }

export function addVoucher(v: VoucherRecord): void {
  vouchers = [v, ...vouchers];
}

export function useVoucher(id: string): boolean {
  const v = vouchers.find(v => v.id === id);
  if (!v || v.status !== 'available') return false;
  const now = new Date();
  v.usedAt = `${now.getFullYear()}.${String(now.getMonth()+1).padStart(2,'0')}.${String(now.getDate()).padStart(2,'0')}`;
  v.status = 'used';
  return true;
}

// --- Entry history ---
export interface EntryRecord {
  eventId:    string;
  eventTitle: string;
  enteredAt:  string;
  status:     'pending' | 'won' | 'missed';
}

let entryHistory: EntryRecord[] = [
  {
    eventId:    'ev_fanmeeting',
    eventTitle: '팬미팅 초청 이벤트',
    enteredAt:  '2026.05.01',
    status:     'pending',
  },
  {
    eventId:    'ev_fanmeeting',
    eventTitle: '팬미팅 초청 이벤트',
    enteredAt:  '2026.04.15',
    status:     'won',
  },
  {
    eventId:    'ev_special_card',
    eventTitle: '스페셜 디지털 카드',
    enteredAt:  '2026.03.31',
    status:     'missed',
  },
  {
    eventId:    'ev_emoji_pack',
    eventTitle: 'oshi 이모티콘 팩',
    enteredAt:  '2026.03.12',
    status:     'won',
  },
];

export function getEntryHistory(): EntryRecord[] { return entryHistory; }

export function addEntry(record: EntryRecord): void {
  entryHistory = [record, ...entryHistory];
}

export function resolveEntry(eventId: string, won: boolean): void {
  const entry = entryHistory.find(e => e.eventId === eventId && e.status === 'pending');
  if (!entry) return;
  entry.status = won ? 'won' : 'missed';
}

// --- Reset ---
export function resetAllState(): void {
  oshiId        = null;
  tickets       = 3;
  cheeredToday  = false;
  cardToday     = false;
  collectedCards = [];
  streak        = 0;
  streak        = 0;
  attendedDates = new Set();
  entryHistory  = [];
  vouchers      = [];
  localStorage.removeItem('kiikii_oshi');
}
