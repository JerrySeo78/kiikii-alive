import { getTickets, getTicketHistory } from '../state.js';

const ICON_EARNED = `
<svg width="20" height="20" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M30 9H14Q9 9 9 14V18.5A4.5 4.5 0 0 1 9 25.5V30Q9 35 14 35H30Q35 35 35 30V25.5A4.5 4.5 0 0 1 35 18.5V14Q35 9 30 9Z" fill="#F07B6A"/>
  <path d="M22 15L23.6 19.4L28 22L23.6 24.6L22 29L20.4 24.6L16 22L20.4 19.4Z" fill="white" opacity="0.92"/>
</svg>`;

const ICON_SPENT = `
<svg width="20" height="20" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M30 9H14Q9 9 9 14V18.5A4.5 4.5 0 0 1 9 25.5V30Q9 35 14 35H30Q35 35 35 30V25.5A4.5 4.5 0 0 1 35 18.5V14Q35 9 30 9Z" fill="#C8C8D0"/>
  <path d="M22 15L23.6 19.4L28 22L23.6 24.6L22 29L20.4 24.6L16 22L20.4 19.4Z" fill="white" opacity="0.92"/>
</svg>`;

export function openTicketOverlay(): void {
  const history = getTicketHistory();
  const totalEarned = history.filter(r => r.type === 'earned').reduce((s, r) => s + r.amount, 0);
  const totalSpent  = history.filter(r => r.type === 'spent' ).reduce((s, r) => s + r.amount, 0);
  const current     = getTickets();

  const overlay = document.createElement('div');
  overlay.className = 'ticket-overlay';
  overlay.innerHTML = `
    <div class="ticket-overlay__sheet">

      <div class="ticket-overlay__header">
        <span class="ticket-overlay__title">응모권 내역</span>
        <button class="ticket-overlay__close" id="ticket-overlay-close">✕</button>
      </div>

      <div class="ticket-overlay__summary">
        <div class="ticket-summary__item">
          <span class="ticket-summary__label">보유 중</span>
          <span class="ticket-summary__value ticket-summary__value--hold">${current}<span class="ticket-summary__unit">장</span></span>
        </div>
        <div class="ticket-summary__divider"></div>
        <div class="ticket-summary__item">
          <span class="ticket-summary__label">총 획득</span>
          <span class="ticket-summary__value">${totalEarned}<span class="ticket-summary__unit">장</span></span>
        </div>
        <div class="ticket-summary__divider"></div>
        <div class="ticket-summary__item">
          <span class="ticket-summary__label">총 사용</span>
          <span class="ticket-summary__value">${totalSpent}<span class="ticket-summary__unit">장</span></span>
        </div>
      </div>

      <div class="ticket-overlay__list-header">획득·사용 내역</div>

      <div class="ticket-overlay__list">
        ${history.length === 0
          ? '<div class="ticket-overlay__empty">내역이 없습니다</div>'
          : history.map(r => `
            <div class="ticket-record ${r.type === 'earned' ? 'ticket-record--earned' : 'ticket-record--spent'}">
              <span class="ticket-record__icon">${r.type === 'earned' ? ICON_EARNED : ICON_SPENT}</span>
              <div class="ticket-record__info">
                <span class="ticket-record__reason">${r.reason}</span>
                <span class="ticket-record__date">${r.date}</span>
              </div>
              <span class="ticket-record__amount">${r.type === 'earned' ? '+' : '-'}${r.amount}</span>
            </div>
          `).join('')
        }
      </div>

    </div>
  `;

  (document.getElementById('app') ?? document.body).appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('ticket-overlay--open'));

  const close = () => {
    overlay.classList.remove('ticket-overlay--open');
    overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
  };
  overlay.querySelector('#ticket-overlay-close')?.addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
}
