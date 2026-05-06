import { MEMBERS } from '../data/members.js';
import { setOshi } from '../state.js';
import { navigate } from '../router.js';
import { t } from '../i18n.js';

export function renderOnboarding(): void {
  const container = document.getElementById('screen-container');
  if (!container) return;

  const navbar = document.getElementById('navbar');
  if (navbar) navbar.style.display = 'none';

  container.innerHTML = `
    <div class="screen screen--onboarding">
      <div class="onboarding__header">
        <div class="onboarding__logo">KiiKiii Alive</div>
        <p class="onboarding__subtitle">${t('chooseTitle') as string}</p>
        <p class="onboarding__desc">${t('chooseDesc') as string}</p>
      </div>
      <div class="onboarding__members">
        ${MEMBERS.map((m) => `
          <button class="member-card" data-id="${m.id}" style="--member-color: ${m.color}">
            <div class="member-card__image-wrap">
              <img
                class="member-card__image"
                src="${m.image}"
                alt="${m.nameKo}"
                loading="lazy"
              />
              <div class="member-card__overlay"></div>
            </div>
            <div class="member-card__info">
              <span class="member-card__name-en">${m.name}</span>
              <span class="member-card__name-ko">${m.role}</span>
              <span class="member-card__desc">${m.description}</span>
            </div>
            <div class="member-card__select-ring"></div>
          </button>
        `).join('')}
      </div>
      <p class="onboarding__note">${t('changeAnytime') as string}</p>
      <div class="onboarding__footer">
        <button class="onboarding__confirm-btn" id="onboarding-confirm" disabled>
          ${t('selectMember') as string}
        </button>
      </div>
    </div>
  `;

  let selected: string | null = null;
  const confirmBtn = document.getElementById('onboarding-confirm') as HTMLButtonElement;

  container.querySelectorAll<HTMLElement>('.member-card').forEach((card) => {
    card.addEventListener('click', () => {
      const id = card.dataset['id'];
      if (!id) return;

      container.querySelectorAll('.member-card').forEach((c) => c.classList.remove('member-card--selected'));
      card.classList.add('member-card--selected');
      selected = id;

      const member = MEMBERS.find((m) => m.id === id);
      confirmBtn.disabled = false;
      const startWith = t('startWith') as (name: string) => string;
      confirmBtn.textContent = member ? startWith(member.name) : t('selectMember') as string;
      if (member) confirmBtn.style.setProperty('--confirm-color', member.color);
    });
  });

  confirmBtn.addEventListener('click', () => {
    if (!selected) return;
    setOshi(selected);
    navigate('home');
  });
}
