import { navigate, getCurrentRouteName, type Route } from '../router.js';
import { t } from '../i18n.js';
import { getOshi } from '../state.js';

interface NavItem {
  route: Route;
  labelKey: 'navHome' | 'navPlaza' | 'navEvents' | 'navMyRoom' | 'navMy';
}

const NAV_ITEMS: NavItem[] = [
  { route: 'home',     labelKey: 'navHome'    },
  { route: 'plaza',    labelKey: 'navPlaza'   },
  { route: 'event',    labelKey: 'navEvents'  },
  { route: 'miniroom', labelKey: 'navMyRoom'  },
  { route: 'my',       labelKey: 'navMy'      },
];

export function renderNavbar(): void {
  const current = getCurrentRouteName();

  document.getElementById('app')?.setAttribute('data-route', current);

  const oshiNameEl = document.getElementById('app-oshi-name');
  if (oshiNameEl) {
    const oshi = getOshi();
    oshiNameEl.textContent = oshi ? oshi.name : '';
  }

  if (current === 'onboarding') return;

  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  navbar.innerHTML = NAV_ITEMS.map((item) => {
    const label = t(item.labelKey) as string;
    const active = current === item.route;
    return `
      <button
        class="nav-item ${active ? 'nav-item--active' : ''}"
        data-route="${item.route}"
        aria-label="${label}"
      >${label}</button>
    `;
  }).join('');

  navbar.querySelectorAll('.nav-item').forEach((btn) => {
    btn.addEventListener('click', () => {
      const route = (btn as HTMLElement).dataset['route'] as Route;
      if (route) navigate(route);
    });
  });
}
