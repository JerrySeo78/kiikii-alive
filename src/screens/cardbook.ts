import { MEMBERS } from '../data/members.js';
import { getCardsByMember, GRADE_LABELS } from '../data/cards.js';
import { isCardCollected, getOshi } from '../state.js';

// ── Overlay mode (called from Home / MY) ──────────────────────────────────────
export function openCardbookOverlay(): void {
  const overlay = document.createElement('div');
  overlay.className = 'cardbook-overlay';
  overlay.innerHTML = `
    <div class="cardbook-overlay__sheet">
      <div class="cardbook-overlay__header">
        <span class="cardbook-overlay__title">카드북</span>
        <button class="cardbook-overlay__close" id="cardbook-overlay-close">✕</button>
      </div>
      <div class="cardbook-overlay__body" id="cardbook-overlay-body"></div>
    </div>
  `;

  (document.getElementById('app') ?? document.body).appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('cardbook-overlay--open'));

  const body = overlay.querySelector<HTMLElement>('#cardbook-overlay-body')!;
  _renderCardbookInto(body);

  const close = () => {
    overlay.classList.remove('cardbook-overlay--open');
    overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
  };
  overlay.querySelector('#cardbook-overlay-close')?.addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
}

export function renderCardbook(): void {
  const container = document.getElementById('screen-container');
  if (!container) return;

  container.innerHTML = `
    <div class="screen screen--cardbook">
      <div class="cardbook__header">
        <h1 class="cardbook__title">카드북</h1>
        <p class="cardbook__subtitle">나의 컬렉션</p>
      </div>
      <div id="cardbook-overlay-body"></div>
    </div>
  `;

  const body = container.querySelector<HTMLElement>('#cardbook-overlay-body')!;
  _renderCardbookInto(body);
}

// ── Shared inner renderer ─────────────────────────────────────────────────────
function _renderCardbookInto(root: HTMLElement): void {
  const oshi = getOshi();
  const defaultTab = oshi?.id ?? MEMBERS[0]!.id;

  root.innerHTML = `
    <div class="cardbook__tabs" id="cardbook-tabs-inner">
      ${MEMBERS.map((m) => `
        <button
          class="cardbook__tab ${m.id === defaultTab ? 'cardbook__tab--active' : ''}"
          data-member="${m.id}"
          style="--tab-color: ${m.color}"
        >
          <span class="cardbook__tab-name">${m.nameKo}</span>
        </button>
      `).join('')}
    </div>
    <div class="cardbook__grid-wrap">
      <div class="cardbook__progress" id="cardbook-progress-inner"></div>
      <div class="cardbook__grid" id="cardbook-grid-inner"></div>
    </div>
  `;

  _renderMemberCards(defaultTab, root);

  root.querySelectorAll('.cardbook__tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      const memberId = (tab as HTMLElement).dataset['member'];
      if (!memberId) return;
      root.querySelectorAll('.cardbook__tab').forEach((t) => t.classList.remove('cardbook__tab--active'));
      tab.classList.add('cardbook__tab--active');
      _renderMemberCards(memberId, root);
    });
  });
}

function _renderMemberCards(memberId: string, root: HTMLElement): void {
  const grid     = root.querySelector<HTMLElement>('#cardbook-grid-inner');
  const progress = root.querySelector<HTMLElement>('#cardbook-progress-inner');
  if (!grid || !progress) return;

  const cards     = getCardsByMember(memberId);
  const collected = cards.filter((c) => isCardCollected(c.id));
  const member    = MEMBERS.find((m) => m.id === memberId);

  progress.innerHTML = `
    <div class="cardbook__progress-bar-wrap">
      <div class="cardbook__progress-label">
        <span>${member?.nameKo ?? ''} 컬렉션</span>
        <span class="cardbook__progress-count">${collected.length} / ${cards.length}</span>
      </div>
      <div class="cardbook__progress-bar">
        <div
          class="cardbook__progress-fill"
          style="width: ${cards.length ? (collected.length / cards.length) * 100 : 0}%; background: ${member?.color ?? 'var(--accent)'}"
        ></div>
      </div>
    </div>
  `;

  grid.innerHTML = cards.map((card) => {
    const owned      = isCardCollected(card.id);
    const gradeLabel = GRADE_LABELS[card.grade];
    const gradeCls   = ['', 'card--normal', 'card--rare', 'card--special'][card.grade];

    return `
      <div class="cardbook__item ${owned ? 'cardbook__item--owned' : 'cardbook__item--locked'} ${gradeCls}" style="--card-color: ${member?.color ?? '#9B7FE8'}">
        <div class="cardbook__item-inner">
          ${owned ? `
            <img class="cardbook__item-img" src="${member?.image ?? ''}" alt="${card.title}" />
            <div class="cardbook__item-grade">${gradeLabel}</div>
            <div class="cardbook__item-title">${card.title}</div>
          ` : `
            <div class="cardbook__item-silhouette">
              <span class="cardbook__item-lock">🔒</span>
            </div>
            <div class="cardbook__item-grade">${gradeLabel}</div>
            <div class="cardbook__item-title">???</div>
          `}
        </div>
      </div>
    `;
  }).join('');
}
