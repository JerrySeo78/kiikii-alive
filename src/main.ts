import './styles/global.css';
import './styles/navbar.css';
import './styles/screens/onboarding.css';
import './styles/screens/home.css';
import './styles/screens/cardbook.css';
import './styles/screens/plaza.css';
import './styles/screens/event.css';
import './styles/screens/island.css';
import './styles/screens/my.css';
import './styles/components/ticketOverlay.css';

import { initRouter, registerRoute, navigate, renderCurrent } from './router.js';
import { renderNavbar } from './components/navbar.js';
import { initSettingsPanel } from './components/settings.js';
import { renderOnboarding } from './screens/onboarding.js';
import { renderHome } from './screens/home.js';
import { renderPlaza } from './screens/plaza.js';
import { renderEvent } from './screens/event.js';
import { renderCardbook } from './screens/cardbook.js';
import { renderIsland } from './screens/island.js';
import { renderMy } from './screens/my.js';

function withNavbar(fn: () => void | Promise<void>): () => void {
  return () => {
    const result = fn();
    if (result instanceof Promise) {
      result.then(() => renderNavbar()).catch(console.error);
    } else {
      renderNavbar();
    }
  };
}

registerRoute('onboarding', withNavbar(renderOnboarding));
registerRoute('home',       withNavbar(renderHome));
registerRoute('plaza',      withNavbar(renderPlaza));
registerRoute('event',      withNavbar(renderEvent));
registerRoute('cardbook',   withNavbar(renderCardbook));
registerRoute('miniroom',   withNavbar(renderIsland));
registerRoute('my',         withNavbar(renderMy));

initRouter();
initSettingsPanel();

window.addEventListener('kiikii:langchange', () => {
  renderNavbar();
  renderCurrent();
});

declare global {
  interface Window {
    kiikii: { reset: () => void; go: (route: string) => void; };
  }
}

import { resetAllState } from './state.js';
window.kiikii = {
  reset: () => { resetAllState(); navigate('onboarding'); },
  go: (route) => navigate(route as Parameters<typeof navigate>[0]),
};
