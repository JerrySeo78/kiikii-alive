import { t } from '../i18n.js';

export function initSettingsPanel(): void {
  document.getElementById('app-settings-btn')?.addEventListener('click', openSettings);
  document.getElementById('settings-backdrop')?.addEventListener('click', closeSettings);
}

export function openSettings(): void {
  const sheet = document.getElementById('settings-sheet');
  if (!sheet) return;
  renderSheet(sheet);
  document.getElementById('settings-panel')?.classList.remove('hidden');
}

export function closeSettings(): void {
  document.getElementById('settings-panel')?.classList.add('hidden');
}

function renderSheet(sheet: HTMLElement): void {
  sheet.innerHTML = `
    <div class="settings-panel__header">
      <span class="settings-panel__title">${t('settings') as string}</span>
      <button class="settings-panel__close" id="settings-close">✕</button>
    </div>

    <div class="settings-panel__section">
      <div class="settings-panel__label">${t('soundSection') as string}</div>
      <div class="settings-panel__row">
        <span>${t('soundEffects') as string}</span>
        <label class="settings-panel__toggle">
          <input type="checkbox" checked>
          <span class="settings-panel__toggle-track"></span>
        </label>
      </div>
    </div>

    <div class="settings-panel__section">
      <div class="settings-panel__label">${t('notifSection') as string}</div>
      <div class="settings-panel__row">
        <span>${t('eventAlerts') as string}</span>
        <label class="settings-panel__toggle">
          <input type="checkbox" checked>
          <span class="settings-panel__toggle-track"></span>
        </label>
      </div>
      <div class="settings-panel__row">
        <span>${t('dailyReminder') as string}</span>
        <label class="settings-panel__toggle">
          <input type="checkbox">
          <span class="settings-panel__toggle-track"></span>
        </label>
      </div>
    </div>
  `;

  sheet.querySelector('#settings-close')?.addEventListener('click', closeSettings);
}
