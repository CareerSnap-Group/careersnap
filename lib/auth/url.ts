const localSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

export function getAuthRedirectUrl(path: string) {
  if (typeof window !== 'undefined') {
    const origin = localSiteUrl || window.location.origin;
    return `${origin}${path}`;
  }

  return `${localSiteUrl || 'http://localhost:3000'}${path}`;
}