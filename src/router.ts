import { getOshi } from './state.js';

export type Route = 'onboarding' | 'home' | 'plaza' | 'event' | 'cardbook' | 'miniroom' | 'my';

type RouteHandler = () => void;

const handlers: Map<Route, RouteHandler> = new Map();
const VALID_ROUTES: Route[] = ['onboarding', 'home', 'plaza', 'event', 'cardbook', 'miniroom', 'my'];

export function registerRoute(route: Route, handler: RouteHandler): void {
  handlers.set(route, handler);
}

function getCurrentRoute(): Route {
  const hash = window.location.hash.slice(1) as Route;
  if (VALID_ROUTES.includes(hash)) return hash;
  return getOshi() ? 'home' : 'onboarding';
}

export function navigate(route: Route): void {
  window.location.hash = route;
}

export function initRouter(): void {
  const run = () => {
    const route = getCurrentRoute();
    const handler = handlers.get(route);
    if (handler) handler();
  };

  window.addEventListener('hashchange', run);
  run();
}

export function getCurrentRouteName(): Route {
  return getCurrentRoute();
}

export function renderCurrent(): void {
  const route = getCurrentRoute();
  const handler = handlers.get(route);
  if (handler) handler();
}
