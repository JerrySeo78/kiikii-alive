import { getOshi, getTickets, hasCheeredToday, markCheeredToday, addTickets,
         hasReceivedCardToday, markCardReceivedToday, addCollectedCard,
         getCollectedCards, getStreak, getAttendedDates,
         markAttendanceToday, getStreakMilestoneBonus } from '../state.js';
import { drawRandomCard, GRADE_LABELS } from '../data/cards.js';
import { showTicketToast, showToast } from '../components/toast.js';
import { getMemberById } from '../data/members.js';
import { t, getLang } from '../i18n.js';
import { navigate } from '../router.js';
import { openCardbookOverlay } from './cardbook.js';
import { openTicketOverlay } from '../components/ticketOverlay.js';

// ── Stat icons ────────────────────────────────────────────────────────────────
const ICON_CALENDAR = `
<svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="44" height="44" rx="12" fill="#1D2ECC"/>
  <rect x="11" y="18" width="22" height="15" rx="2.5" fill="white" opacity="0.95"/>
  <rect x="11" y="18" width="22" height="7" rx="2.5" fill="white"/>
  <rect x="16.5" y="12" width="2.5" height="8" rx="1.25" fill="white" opacity="0.85"/>
  <rect x="25" y="12" width="2.5" height="8" rx="1.25" fill="white" opacity="0.85"/>
  <circle cx="17.5" cy="28" r="1.5" fill="#1D2ECC" opacity="0.45"/>
  <circle cx="22"   cy="28" r="1.5" fill="#1D2ECC" opacity="0.45"/>
  <circle cx="26.5" cy="28" r="1.5" fill="#1D2ECC" opacity="0.45"/>
</svg>`;

const ICON_CARD = `
<svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M30 9H14Q9 9 9 14V18.5A4.5 4.5 0 0 1 9 25.5V30Q9 35 14 35H30Q35 35 35 30V25.5A4.5 4.5 0 0 1 35 18.5V14Q35 9 30 9Z" fill="#7B8CF5"/>
  <path d="M22 15L23.6 19.4L28 22L23.6 24.6L22 29L20.4 24.6L16 22L20.4 19.4Z" fill="white" opacity="0.92"/>
</svg>`;

const ICON_TICKET = `
<svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M30 9H14Q9 9 9 14V18.5A4.5 4.5 0 0 1 9 25.5V30Q9 35 14 35H30Q35 35 35 30V25.5A4.5 4.5 0 0 1 35 18.5V14Q35 9 30 9Z" fill="#F07B6A"/>
  <path d="M22 15L23.6 19.4L28 22L23.6 24.6L22 29L20.4 24.6L16 22L20.4 19.4Z" fill="white" opacity="0.92"/>
</svg>`;

export function renderHome(): void {
  const container = document.getElementById('screen-container');
  if (!container) return;

  const oshi = getOshi();
  if (!oshi) return;

  const cheered      = hasCheeredToday();
  const cardReceived = hasReceivedCardToday();
  const tickets      = getTickets();
  const streak       = getStreak();
  const cardCount    = getCollectedCards().length;
  const lang         = getLang();
  const dailyMsg     = oshi.dailyMessage[lang];

  container.innerHTML = `
    <div class="screen screen--home">

      <!-- 히어로: 오시 + 오늘의 톡 -->
      <div class="home__hero">
        <div class="home__hero-text">
          <div class="home__hero-name">${oshi.nameKo} <span class="home__hero-heart">♥</span></div>
          <div class="home__hero-message">${dailyMsg}</div>
        </div>
        <div class="home__hero-chibi">
          <img src="${oshi.image}" alt="${oshi.nameKo}" />
        </div>
      </div>

      <!-- 오늘의 미션 2열 -->
      <div class="home__section">
        <div class="home__section-title">${t('todayTasks') as string}</div>
        <div class="home__missions">

          <!-- 응원 -->
          <button id="cheer-btn" class="home__mission-card ${cheered ? 'home__mission-card--done' : ''}">
            <div class="home__mission-title">${t('cheerNow') as string}</div>
            <div class="home__cheer-heart ${cheered ? 'home__cheer-heart--done' : ''}">
              <span class="home__cheer-heart-plus">+1</span>
            </div>
            <div class="home__mission-btn ${cheered ? 'home__mission-btn--done' : ''}">
              ${cheered ? `✅ ${t('cheered') as string}` : `${oshi.nameKo} ${t('cheerNow') as string}`}
            </div>
            ${!cheered ? `<div class="home__mission-reward">${t('plusTicket') as string}</div>` : ''}
          </button>

          <!-- 카드 -->
          <button id="card-btn" class="home__mission-card ${cardReceived ? 'home__mission-card--done' : ''}">
            <div class="home__mission-title">${t('getCard') as string}</div>
            <div class="home__mission-card-art">
              <div class="home__mission-card-face">
                <span class="home__mission-card-logo">KiiKii</span>
              </div>
            </div>
            <div class="home__mission-btn ${cardReceived ? 'home__mission-btn--done' : ''}">
              ${cardReceived ? `✅ ${t('cardReceived') as string}` : t('getCard') as string}
            </div>
            ${!cardReceived ? `<div class="home__mission-reward">${t('plusTicket') as string}</div>` : ''}
          </button>

        </div>
      </div>

      <!-- 내 기록 -->
      <div class="home__section">
        <div class="home__section-title">${t('myRecords') as string}</div>
        <div class="home__stats">
          <div class="home__stat home__stat--tappable" id="home-streak-stat">
            <div class="home__stat-icon">${ICON_CALENDAR}</div>
            <div class="home__stat-value">${streak}<span class="home__stat-unit">${t('statStreakUnit') as string}</span></div>
            <div class="home__stat-label">${t('statStreak') as string}</div>
          </div>
          <div class="home__stat-divider"></div>
          <div class="home__stat home__stat--tappable" id="home-cards-stat">
            <div class="home__stat-icon">${ICON_CARD}</div>
            <div class="home__stat-value">${cardCount}<span class="home__stat-unit">${t('statCardsUnit') as string}</span></div>
            <div class="home__stat-label">${t('statCards') as string}</div>
          </div>
          <div class="home__stat-divider"></div>
          <div class="home__stat home__stat--tappable" id="home-tickets-stat">
            <div class="home__stat-icon">${ICON_TICKET}</div>
            <div class="home__stat-value">${tickets}<span class="home__stat-unit">${t('statTicketsUnit') as string}</span></div>
            <div class="home__stat-label">${t('statTickets') as string}</div>
          </div>
        </div>
      </div>

      <!-- 진행중인 이벤트 -->
      <div class="home__section" style="padding-bottom: 24px;">
        <div class="home__section-title">${t('currentEvent') as string}</div>
        <div class="home__event-card" id="home-event-banner">
          <div class="home__event-tag">${t('liveNow') as string}</div>
          <div class="home__event-name">${t('eventBannerTitle') as string}</div>
          <div class="home__event-desc">${t('eventBannerDesc') as string}</div>
          <div class="home__event-cta">${t('useTicketsCta') as string}</div>
        </div>
      </div>

      <!-- 카드 획득 오버레이 -->
      <div id="card-reveal-overlay" class="card-reveal-overlay hidden">
        <div class="card-reveal-inner">
          <div class="card-flip" id="card-flip">
            <div class="card-flip__front">
              <div class="card-flip__back-design"><span>?</span></div>
            </div>
            <div class="card-flip__back" id="card-flip-back"></div>
          </div>
          <button id="card-close-btn" class="card-reveal-close hidden">${t('done') as string}</button>
        </div>
        <div class="card-reveal-bg"></div>
      </div>

      <!-- 응원 애니메이션 오버레이 -->
      <div id="cheer-overlay" class="cheer-overlay hidden">
        <div class="cheer-overlay__heart">
          <span class="cheer-overlay__plus">+1</span>
        </div>
      </div>

      <div id="cheer-particles" class="cheer-particles"></div>
    </div>
  `;

  // 응원
  const cheerBtn = document.getElementById('cheer-btn');
  if (cheerBtn && !cheered) {
    cheerBtn.addEventListener('click', () => {
      showCheerAnimation(() => {
        markCheeredToday();
        const newStreak  = markAttendanceToday();
        const bonus      = getStreakMilestoneBonus(newStreak);
        const newCount   = addTickets(1 + bonus);

        cheerBtn.classList.add('home__mission-card--done');
        const btnEl = cheerBtn.querySelector('.home__mission-btn')!;
        btnEl.textContent = `✅ ${t('cheered') as string}`;
        const heartEl = cheerBtn.querySelector('.home__cheer-heart');
        if (heartEl) heartEl.classList.add('home__cheer-heart--done');
        cheerBtn.querySelector('.home__mission-reward')?.remove();

        const statEls = document.querySelectorAll('.home__stat-value');
        if (statEls[0]) statEls[0].innerHTML = `${newStreak}<span class="home__stat-unit">${t('statStreakUnit') as string}</span>`;
        if (statEls[2]) statEls[2].innerHTML = `${newCount}<span class="home__stat-unit">${t('statTicketsUnit') as string}</span>`;

        showTicketToast(1 + bonus);
        if (bonus > 0) {
          const msgs: Record<number, string> = { 1: '3일 연속! 🎉 보너스 +1', 3: '7일 달성! 🌟 보너스 +3', 5: '30일 개근! 💎 보너스 +5' };
          setTimeout(() => showToast(msgs[bonus] ?? `보너스 +${bonus}`, 3000), 1600);
        }
        spawnCheerParticles();
      });
    });
  }

  document.getElementById('home-streak-stat')?.addEventListener('click', openAttendanceCalendar);
  document.getElementById('home-cards-stat')?.addEventListener('click', () => openCardbookOverlay());
  document.getElementById('home-tickets-stat')?.addEventListener('click', () => openTicketOverlay());

  // 카드
  const cardBtn = document.getElementById('card-btn');
  if (cardBtn && !cardReceived) {
    cardBtn.addEventListener('click', () => showCardReveal());
  }

  // 이벤트 배너
  document.getElementById('home-event-banner')?.addEventListener('click', () => navigate('event'));
}

function showCardReveal(): void {
  const oshi = getOshi();
  if (!oshi) return;

  const overlay  = document.getElementById('card-reveal-overlay');
  const flip     = document.getElementById('card-flip');
  const flipBack = document.getElementById('card-flip-back');
  const closeBtn = document.getElementById('card-close-btn');
  if (!overlay || !flip || !flipBack || !closeBtn) return;

  overlay.classList.remove('hidden');

  const card        = drawRandomCard(oshi.id);
  const member      = getMemberById(card.memberId);
  const gradeLabel  = GRADE_LABELS[card.grade];
  const gradeCls    = ['', 'card--normal', 'card--rare', 'card--special'][card.grade];
  const memberColor = member?.color ?? '#1D2ECC';

  flipBack.innerHTML = `
    <div class="card-reveal-card ${gradeCls}" style="--card-color: ${memberColor}">
      <div class="card-reveal-card__grade">${gradeLabel}</div>
      <div class="card-reveal-card__img-wrap">
        <img src="${member?.image ?? ''}" alt="${member?.nameKo ?? ''}" />
      </div>
      <div class="card-reveal-card__title">${card.title}</div>
      <div class="card-reveal-card__member">${member?.nameKo ?? ''}</div>
      <div class="card-reveal-card__message">${card.message}</div>
      <div class="card-reveal-card__ticket">${t('cardTicketReward') as string}</div>
    </div>
  `;

  setTimeout(() => {
    flip.classList.add('flipped');
    setTimeout(() => closeBtn.classList.remove('hidden'), 600);
  }, 400);

  closeBtn.addEventListener('click', () => {
    markCardReceivedToday();
    markAttendanceToday();
    addCollectedCard(card.id);
    const newCount = addTickets(1);

    overlay.classList.add('hidden');
    flip.classList.remove('flipped');
    closeBtn.classList.add('hidden');

    const cardBtn = document.getElementById('card-btn');
    if (cardBtn) {
      cardBtn.classList.add('home__mission-card--done');
      cardBtn.querySelector('.home__mission-btn')!.textContent = `✅ ${t('cardReceived') as string}`;
      cardBtn.querySelector('.home__mission-reward')?.remove();
    }

    const ticketEls = document.querySelectorAll('.home__stat-value');
    if (ticketEls[2]) ticketEls[2].innerHTML = `${newCount}<span class="home__stat-unit">${t('statTicketsUnit') as string}</span>`;

    const newCards = getCollectedCards().length;
    if (ticketEls[1]) ticketEls[1].innerHTML = `${newCards}<span class="home__stat-unit">${t('statCardsUnit') as string}</span>`;

    showTicketToast(1);
  }, { once: true });
}

function openAttendanceCalendar(): void {
  const oshi        = getOshi();
  const streak      = getStreak();
  const attended    = new Set(getAttendedDates());
  const now         = new Date();
  const year        = now.getFullYear();
  const month       = now.getMonth();
  const todayStr    = `${year}-${String(month+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  const firstDay    = new Date(year, month, 1).getDay(); // 0=일
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const color       = oshi?.color ?? 'var(--accent)';

  const MILESTONES = [
    { day: 3,  bonus: '+1',  label: '3일' },
    { day: 7,  bonus: '+3',  label: '7일' },
    { day: 30, bonus: '+5',  label: '30일' },
  ];

  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

  const cells: string[] = [];
  for (let i = 0; i < firstDay; i++) cells.push('<div class="cal__day cal__day--empty"></div>');
  for (let d = 1; d <= daysInMonth; d++) {
    const key    = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const isHit  = attended.has(key);
    const isToday = key === todayStr;
    cells.push(`
      <div class="cal__day ${isHit ? 'cal__day--hit' : ''} ${isToday ? 'cal__day--today' : ''}">
        <span class="cal__day-num" style="${isHit ? `color:${color}` : ''}">${d}</span>
        ${isHit ? `<span class="cal__day-heart" style="color:${color}">♥</span>` : ''}
      </div>`);
  }

  const overlay = document.createElement('div');
  overlay.className = 'cal-overlay';
  overlay.innerHTML = `
    <div class="cal-sheet">
      <div class="cal-sheet__header">
        <div class="cal-sheet__title">${year}년 ${month+1}월 출석</div>
        <button class="cal-sheet__close" id="cal-close">✕</button>
      </div>

      <div class="cal-streak-row">
        <div class="cal-streak-num" style="color:${color}">${streak}</div>
        <div class="cal-streak-label">일 연속 출석 중</div>
      </div>

      <div class="cal__grid-head">
        ${dayNames.map(d => `<div class="cal__head">${d}</div>`).join('')}
      </div>
      <div class="cal__grid">${cells.join('')}</div>

      <div class="cal-milestones">
        ${MILESTONES.map(m => {
          const reached = streak >= m.day;
          return `
            <div class="cal-milestone ${reached ? 'cal-milestone--reached' : ''}">
              <span class="cal-milestone__label">${m.label}</span>
              <span class="cal-milestone__bonus">응모권 ${m.bonus}</span>
              <span class="cal-milestone__check">${reached ? '✓' : ''}</span>
            </div>`;
        }).join('')}
      </div>
    </div>
  `;

  (document.getElementById('app') ?? document.body).appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('cal-overlay--open'));

  const close = () => {
    overlay.classList.remove('cal-overlay--open');
    overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
  };
  overlay.querySelector('#cal-close')?.addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
}

function showCheerAnimation(onComplete: () => void): void {
  const overlay = document.getElementById('cheer-overlay');
  if (!overlay) { onComplete(); return; }

  overlay.classList.remove('hidden');
  // 다음 프레임에 애니메이션 클래스 추가 (reflow 보장)
  requestAnimationFrame(() => {
    overlay.classList.add('cheer-overlay--active');
  });

  // 1.4s 후 오버레이 닫고 완료 처리
  setTimeout(() => {
    overlay.classList.add('cheer-overlay--out');
    setTimeout(() => {
      overlay.classList.add('hidden');
      overlay.classList.remove('cheer-overlay--active', 'cheer-overlay--out');
      onComplete();
    }, 300);
  }, 1400);
}

function spawnCheerParticles(): void {
  const container = document.getElementById('cheer-particles');
  if (!container) return;
  const emojis = ['💕', '✨', '⭐', '🌸', '💫', '🎉'];
  for (let i = 0; i < 12; i++) {
    const el = document.createElement('span');
    el.className = 'cheer-particle';
    el.textContent = emojis[i % emojis.length]!;
    el.style.left = `${Math.random() * 100}%`;
    el.style.animationDelay = `${Math.random() * 0.5}s`;
    el.style.fontSize = `${1 + Math.random() * 1.2}rem`;
    container.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
  }
}
