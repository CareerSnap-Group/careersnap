function isLocalhost(hostname: string) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
}

function isPublicKey(key: string) {
  if (/^sb_publishable_[A-Za-z0-9_-]{20,}$/.test(key)) return true;
  if (!key.startsWith('eyJ')) return false;

  const payload = key.split('.')[1];
  if (!payload) return false;

  try {
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const claims = JSON.parse(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='))) as { role?: unknown };
    return claims.role === 'anon';
  } catch {
    return false;
  }
}

export function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key || /your-supabase|placeholder|example/i.test(url) || /your-supabase|placeholder|example/i.test(key)) {
    return false;
  }

  try {
    const parsedUrl = new URL(url);
    const isSecure = parsedUrl.protocol === 'https:';
    const isLocal = parsedUrl.protocol === 'http:' && isLocalhost(parsedUrl.hostname);
    return !parsedUrl.username && !parsedUrl.password && (isSecure || isLocal) && isPublicKey(key);
  } catch {
    return false;
  }
}
