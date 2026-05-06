import { getOshi, getTickets, getStreak, getCollectedCards, getEntryHistory, getVouchers, useVoucher, setOshi } from '../state.js';
import { navigate } from '../router.js';
import { openCardbookOverlay } from './cardbook.js';
import { openTicketOverlay } from '../components/ticketOverlay.js';
import { MEMBERS } from '../data/members.js';
import { t, getLang, setLang, type Lang } from '../i18n.js';
import { asset } from '../utils.js';

export function renderMy(): void {
  const container = document.getElementById('screen-container');
  if (!container) return;

  const oshi    = getOshi();
  if (!oshi) { navigate('onboarding'); return; }
  const streak  = getStreak();
  const cards   = getCollectedCards().length;
  const tickets = getTickets();
  const entries  = getEntryHistory();
  const wins     = entries.filter(e => e.status === 'won');
  const vouchers = getVouchers();
  const availVouchers = vouchers.filter(v => v.status === 'available');
  const usedVouchers  = vouchers.filter(v => v.status === 'used');

  const statUnit = (unit: string) => unit ? `<span class="my__stat-unit">${unit}</span>` : '';

  container.innerHTML = `
    <div class="screen screen--my">

      <!-- 오시 히어로 -->
      <div class="my__hero" style="--hero-color: ${oshi?.color ?? '#9B7FE8'}">
        <div class="my__hero-info">
          <div class="my__hero-label">${t('myOshi') as string}</div>
          <div class="my__hero-name">${oshi ? oshi.name : '-'}</div>
          <div class="my__hero-role">${oshi ? oshi.role : ''}</div>
        </div>
        ${oshi
          ? `<img class="my__hero-img" src="${asset(oshi.image)}" alt="${oshi.name}" />`
          : '<div class="my__hero-img--empty"></div>'}
      </div>

      <!-- 내 기록 -->
      <div class="my__section">
        <div class="my__stat-row">
          <div class="my__stat">
            <div class="my__stat-value">
              <span class="my__stat-num">${streak}</span>
              ${statUnit(t('statStreakUnit') as string)}
            </div>
            <span class="my__stat-label">${t('statStreak') as string}</span>
          </div>
          <div class="my__stat-divider"></div>
          <div class="my__stat">
            <div class="my__stat-value">
              <span class="my__stat-num">${cards}</span>
              ${statUnit(t('statCardsUnit') as string)}
            </div>
            <span class="my__stat-label">${t('statCards') as string}</span>
          </div>
          <div class="my__stat-divider"></div>
          <div class="my__stat my__stat--tappable" id="my-tickets-stat">
            <div class="my__stat-value">
              <span class="my__stat-num">${tickets}</span>
              ${statUnit(t('statTicketsUnit') as string)}
            </div>
            <span class="my__stat-label">${t('ticketsLabel') as string}</span>
          </div>
        </div>
      </div>

      <!-- 메뉴 -->
      <div class="my__section">
        <div class="my__menu-card">
          <button class="my__menu-item" id="my-cardbook">
            <span class="my__menu-icon">🎴</span>
            <span class="my__menu-label">${t('myCardbook') as string}</span>
            <span class="my__menu-arrow">›</span>
          </button>
          <div class="my__divider"></div>
          <button class="my__menu-item" id="my-miniroom">
            <span class="my__menu-icon">🏠</span>
            <span class="my__menu-label">${t('myMiniroom') as string}</span>
            <span class="my__menu-arrow">›</span>
          </button>
          <div class="my__divider"></div>
          <button class="my__menu-item" id="my-oshi-change">
            <span class="my__menu-icon">💜</span>
            <span class="my__menu-label">${t('myChangeFav') as string}</span>
            <span class="my__menu-arrow" id="my-oshi-arrow">›</span>
          </button>
          <div class="my__divider"></div>
          <button class="my__menu-item" id="my-lang">
            <span class="my__menu-icon">🌐</span>
            <span class="my__menu-label">${t('myLangSetting') as string}</span>
            <span class="my__menu-arrow" id="my-lang-arrow">›</span>
          </button>
        </div>
      </div>

      <!-- 오시 변경 (인라인) -->
      <div class="my__section my__section--collapse" id="my-oshi-section">
        <div class="my__oshi-list">
          ${MEMBERS.map(m => `
            <button class="my__oshi-item ${oshi?.id === m.id ? 'my__oshi-item--active' : ''}"
              data-id="${m.id}" style="--member-color: ${m.color}">
              <img src="${m.image}" alt="${m.nameKo}" />
              <span>${m.nameKo}</span>
            </button>
          `).join('')}
        </div>
      </div>

      <!-- 언어 설정 (인라인) -->
      <div class="my__section my__section--collapse" id="my-lang-section">
        <div class="my__lang-list">
          ${(['ko', 'ja', 'en'] as Lang[]).map(lang => `
            <button class="my__lang-item ${getLang() === lang ? 'my__lang-item--active' : ''}" data-lang="${lang}">
              <span>${lang === 'ko' ? '🇰🇷  한국어' : lang === 'ja' ? '🇯🇵  日本語' : '🇺🇸  English'}</span>
              ${getLang() === lang ? '<span class="my__lang-check">✓</span>' : ''}
            </button>
          `).join('')}
        </div>
      </div>

      <!-- 교환권 -->
      <div class="my__section">
        <div class="my__card-section">
          <div class="my__card-section-title">${t('myVouchers') as string}</div>
          ${vouchers.length === 0
            ? `<div class="my__empty">${t('myNoVouchers') as string}</div>`
            : `
              ${availVouchers.length > 0 ? availVouchers.map(v => `
                <div class="my__voucher my__voucher--available" data-vid="${v.id}">
                  <div class="my__voucher-left">
                    <div class="my__voucher-title">${v.title}</div>
                    <div class="my__voucher-desc">${v.description}</div>
                    ${v.expiresAt ? `<div class="my__voucher-meta">${t('myVoucherExpires') as string} ${v.expiresAt}</div>` : ''}
                  </div>
                  <button class="my__voucher-btn" data-vid="${v.id}">${t('myVoucherUseBtn') as string}</button>
                </div>
              `).join('<div class="my__divider"></div>') : ''}
              ${availVouchers.length > 0 && usedVouchers.length > 0 ? '<div class="my__divider"></div>' : ''}
              ${usedVouchers.length > 0 ? usedVouchers.map(v => `
                <div class="my__voucher my__voucher--used">
                  <div class="my__voucher-left">
                    <div class="my__voucher-title">${v.title}</div>
                    <div class="my__voucher-desc">${v.description}</div>
                    <div class="my__voucher-meta">${t('myVoucherUsedAt') as string} ${v.usedAt ?? ''}</div>
                  </div>
                  <span class="my__voucher-used-label">${t('myVoucherUsed') as string}</span>
                </div>
              `).join('<div class="my__divider"></div>') : ''}
            `
          }
        </div>
      </div>

      <!-- 응모 현황 -->
      <div class="my__section">
        <div class="my__card-section">
          <div class="my__card-section-title">${t('myEntries') as string}</div>
          ${entries.length === 0
            ? `<div class="my__empty">${t('myNoEntries') as string}</div>`
            : entries.map(e => {
                const statusKey = e.status === 'won' ? 'myEntryWon' : e.status === 'missed' ? 'myEntryMissed' : 'myEntryPending';
                return `
                  <div class="my__entry-row">
                    <div class="my__entry-info">
                      <div class="my__entry-title">${e.eventTitle}</div>
                      <div class="my__entry-date">${e.enteredAt}</div>
                    </div>
                    <span class="my__entry-badge my__entry-badge--${e.status}">${t(statusKey) as string}</span>
                  </div>`;
              }).join('<div class="my__divider"></div>')
          }
        </div>
      </div>

      <!-- 당첨 히스토리 -->
      <div class="my__section">
        <div class="my__card-section">
          <div class="my__card-section-title">${t('myWins') as string}</div>
          ${wins.length === 0
            ? `<div class="my__empty">${t('myNoWins') as string}</div>`
            : wins.map(e => `
                <div class="my__entry-row">
                  <div class="my__entry-info">
                    <div class="my__entry-title">${e.eventTitle}</div>
                    <div class="my__entry-date">${e.enteredAt}</div>
                  </div>
                  <span class="my__entry-badge my__entry-badge--won">${t('myEntryWon') as string} 🎉</span>
                </div>`).join('<div class="my__divider"></div>')
          }
        </div>
      </div>

      <div style="height: 24px;"></div>

    </div>
  `;

  const toggleSection = (sectionId: string, arrowId: string, otherSectionId: string, otherArrowId: string) => {
    const sec      = document.getElementById(sectionId)!;
    const arrow    = document.getElementById(arrowId)!;
    const otherSec = document.getElementById(otherSectionId)!;
    const otherArrow = document.getElementById(otherArrowId)!;
    const isOpen   = sec.classList.contains('my__section--open');

    otherSec.classList.remove('my__section--open');
    otherArrow.style.transform = '';

    sec.classList.toggle('my__section--open', !isOpen);
    arrow.style.transform = !isOpen ? 'rotate(90deg)' : '';
  };

  document.getElementById('my-tickets-stat')?.addEventListener('click', () => openTicketOverlay());
  document.getElementById('my-cardbook')?.addEventListener('click', () => openCardbookOverlay());

  document.getElementById('my-miniroom')?.addEventListener('click', () => navigate('miniroom'));

  document.getElementById('my-oshi-change')?.addEventListener('click', () =>
    toggleSection('my-oshi-section', 'my-oshi-arrow', 'my-lang-section', 'my-lang-arrow'));

  document.getElementById('my-lang')?.addEventListener('click', () =>
    toggleSection('my-lang-section', 'my-lang-arrow', 'my-oshi-section', 'my-oshi-arrow'));

  document.querySelectorAll<HTMLButtonElement>('.my__voucher-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const vid = btn.dataset['vid']!;
      if (useVoucher(vid)) renderMy();
    });
  });

  document.querySelectorAll<HTMLButtonElement>('.my__oshi-item').forEach(btn => {
    btn.addEventListener('click', () => {
      setOshi(btn.dataset['id']!);
      renderMy();
    });
  });

  document.querySelectorAll<HTMLButtonElement>('.my__lang-item').forEach(btn => {
    btn.addEventListener('click', () => {
      setLang(btn.dataset['lang'] as Lang);
      document.dispatchEvent(new CustomEvent('kiikii:langchange'));
    });
  });
}
