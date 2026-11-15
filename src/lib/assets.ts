/**
 * Resolves local `/media/...` paths cleanly across both root-hosted servers
 * and subpath static hosts such as GitHub Pages (`/<repo>/`).
 */
export function resolveAssetUrl(url: string): string {
  if (!url) return url;
  if (/^(https?:|data:|blob:|\/\/)/i.test(url)) return url;

  if (url.startsWith('/')) {
    const base = import.meta.env.BASE_URL || './';
    if (base !== './' && base !== '.') {
      return `${base.replace(/\/$/, '')}${url}`;
    }

    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const isDeepServerRoute =
        !window.location.hostname.endsWith('.github.io') &&
        (/^\/projects\/[^/]+/.test(path) || /^\/admin(\/|$)/.test(path));
      if (isDeepServerRoute) {
        return url;
      }
    }

    return `./${url.slice(1)}`;
  }

  return url;
}
