/** Returns a URL rooted at Vite's base path (handles GitHub Pages sub-directory). */
export function asset(path: string): string {
  const clean = path.startsWith('/') ? path.slice(1) : path;
  return import.meta.env.BASE_URL + clean;
}
