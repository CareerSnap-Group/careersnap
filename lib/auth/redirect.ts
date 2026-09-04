export function getSafeRedirectPath(candidate: string | null | undefined, fallback = '/profile') {
  if (!candidate || !candidate.startsWith('/') || candidate.startsWith('//') || candidate.includes('\\')) {
    return fallback;
  }

  return candidate;
}
