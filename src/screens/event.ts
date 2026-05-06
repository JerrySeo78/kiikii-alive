import { getTickets, spendTickets, addEntry } from '../state.js';
import { showToast } from '../components/toast.js';
import { t } from '../i18n.js';

const ICON_TICKET_SM = `
<svg width="22" height="22" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M30 9H14Q9 9 9 14V18.5A4.5 4.5 0 0 1 9 25.5V30Q9 35 14 35H30Q35 35 35 30V25.5A4.5 4.5 0 0 1 35 18.5V14Q35 9 30 9Z" fill="#F07B6A"/>
  <path d="M22 15L23.6 19.4L28 22L23.6 24.6L22 29L20.4 24.6L16 22L20.4 19.4Z" fill="white" opacity="0.92"/>
</svg>`;

const ICON_TICKET_MD = `
<svg width="36" height="36" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M30 9H14Q9 9 9 14V18.5A4.5 4.5 0 0 1 9 25.5V30Q9 35 14 35H30Q35 35 35 30V25.5A4.5 4.5 0 0 1 35 18.5V14Q35 9 30 9Z" fill="#F07B6A"/>
  <path d="M22 15L23.6 19.4L28 22L23.6 24.6L22 29L20.4 24.6L16 22L20.4 19.4Z" fill="white" opacity="0.92"/>
</svg>`;

interface EventItem {
  id: string;
  title: string;
  description: string;
  cost: number;
  badge: string;
  track: 'always' | 'special';
  deadline: string;
}

function getEvents(): EventItem[] {
  return [
    {
      id: 'ev_fanmeeting',
      title: t('ev1Title') as string,
      description: t('ev1Desc') as string,
      cost: 5,
      badge: t('ev1Badge') as string,
      track: 'special',
      deadline: t('ev1Deadline') as string,
    },
    {
      id: 'ev_special_card',
      title: t('ev2Title') as string,
      description: t('ev2Desc') as string,
      cost: 3,
      badge: t('ev2Badge') as string,
      track: 'always',
      deadline: t('ev2Deadline') as string,
    },
    {
      id: 'ev_emoji_pack',
      title: t('ev3Title') as string,
      description: t('ev3Desc') as string,
      cost: 2,
      badge: t('ev3Badge') as string,
      track: 'always',
      deadline: t('ev3Deadline') as string,
    },
  ];
}

export function renderEvent(): void {
  const container = document.getElementById('screen-container');
  if (!container) return;

  const tickets = getTickets();
  const EVENTS = getEvents();

  container.innerHTML = `
    <div class="screen screen--event">
      <div class="event__header">
        <h1 class="event__title">${t('eventsTitle') as string}</h1>
        <div class="event__ticket-display">
          <span class="event__ticket-icon">${ICON_TICKET_SM}</span>
          <span class="event__ticket-count" id="event-ticket-count">${tickets}</span>
          <span class="event__ticket-label">${t('ticketsLabel') as string}</span>
        </div>
      </div>

      <div class="event__list">
        ${EVENTS.map((ev) => renderEventCard(ev, tickets)).join('')}
      </div>

      <div class="event__note">
        <p>${t('earnNote') as string}</p>
        <p>${t('lineNote') as string}</p>
      </div>
    </div>

    <!-- Confirmation Modal -->
    <div id="event-modal" class="event-modal hidden">
      <div class="event-modal__backdrop"></div>
      <div class="event-modal__box">
        <div class="event-modal__icon">${ICON_TICKET_MD}</div>
        <h2 class="event-modal__title" id="modal-title"></h2>
        <p class="event-modal__desc" id="modal-desc"></p>
        <div class="event-modal__actions">
          <button id="modal-cancel" class="event-modal__btn event-modal__btn--cancel">${t('cancel') as string}</button>
          <button id="modal-confirm" class="event-modal__btn event-modal__btn--confirm">${t('enter') as string}</button>
        </div>
      </div>
    </div>
  `;

  container.querySelectorAll('.event__apply-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const evId = (btn as HTMLElement).dataset['event'];
      const ev = getEvents().find((e) => e.id === evId);
      if (!ev) return;
      openModal(ev);
    });
  });
}

function renderEventCard(ev: EventItem, tickets: number): string {
  const canApply = tickets >= ev.cost;
  return `
    <div class="event__card ${ev.track === 'special' ? 'event__card--special' : ''}">
      <div class="event__card-header">
        <span class="event__card-badge">${ev.badge}</span>
        <span class="event__card-deadline">${ev.deadline}</span>
      </div>
      <h2 class="event__card-title">${ev.title}</h2>
      <p class="event__card-desc">${ev.description.replace(/\n/g, '<br/>')}</p>
      <div class="event__card-footer">
        <div class="event__card-cost">
          <span class="event__card-cost-icon">${ICON_TICKET_SM}</span>
          <span class="event__card-cost-value">${(t('ticketsNeeded') as (n: number) => string)(ev.cost)}</span>
        </div>
        <button
          class="event__apply-btn ${canApply ? '' : 'event__apply-btn--disabled'}"
          data-event="${ev.id}"
          ${canApply ? '' : 'disabled'}
        >
          ${canApply ? t('enterEvent') as string : t('notEnough') as string}
        </button>
      </div>
    </div>
  `;
}

function openModal(ev: EventItem): void {
  const modal = document.getElementById('event-modal');
  const title = document.getElementById('modal-title');
  const desc = document.getElementById('modal-desc');
  const cancel = document.getElementById('modal-cancel');
  const confirm = document.getElementById('modal-confirm');
  if (!modal || !title || !desc || !cancel || !confirm) return;

  title.textContent = ev.title;
  desc.textContent = (t('confirmEntry') as (n: number) => string)(ev.cost);
  modal.classList.remove('hidden');

  cancel.onclick = () => modal.classList.add('hidden');
  confirm.onclick = () => {
    modal.classList.add('hidden');
    const success = spendTickets(ev.cost);
    if (success) {
      const now = new Date();
      addEntry({
        eventId:    ev.id,
        eventTitle: ev.title,
        enteredAt:  `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`,
        status:     'pending',
      });
      const newCount = getTickets();
      const el = document.getElementById('event-ticket-count');
      if (el) el.textContent = String(newCount);
      showApplySuccess(ev);
      refreshEventButtons(newCount);
    } else {
      showToast(t('notEnoughMsg') as string, 2500);
    }
  };
}

function showApplySuccess(ev: EventItem): void {
  const container = document.getElementById('screen-container');
  if (!container) return;

  const overlay = document.createElement('div');
  overlay.className = 'event-success-overlay';
  overlay.innerHTML = `
    <div class="event-success-box">
      <div class="event-success-icon">🎉</div>
      <h2>${t('entryDone') as string}</h2>
      <p>${ev.title}</p>
      <p class="event-success-sub">${t('winnersLine') as string}</p>
      <button class="event-success-close">${t('done') as string}</button>
    </div>
  `;

  document.body.appendChild(overlay);
  overlay.querySelector('.event-success-close')?.addEventListener('click', () => overlay.remove());
}

function refreshEventButtons(newTickets: number): void {
  document.querySelectorAll('.event__apply-btn').forEach((btn) => {
    const evId = (btn as HTMLElement).dataset['event'];
    const ev = getEvents().find((e: EventItem) => e.id === evId);
    if (!ev) return;

    const canApply = newTickets >= ev.cost;
    if (canApply) {
      btn.classList.remove('event__apply-btn--disabled');
      btn.removeAttribute('disabled');
      btn.textContent = t('enterEvent') as string;
    } else {
      btn.classList.add('event__apply-btn--disabled');
      btn.setAttribute('disabled', '');
      btn.textContent = t('notEnough') as string;
    }
  });
}
