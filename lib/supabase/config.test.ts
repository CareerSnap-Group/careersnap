import { isSupabaseConfigured } from './config';

describe('isSupabaseConfigured', () => {
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const originalKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  afterEach(() => {
    if (originalUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;

    if (originalKey === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    else process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = originalKey;
  });

  it('accepts an HTTPS project URL and a publishable key', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://project.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_012345678901234567890123';

    expect(isSupabaseConfigured()).toBe(true);
  });

  it('rejects a malformed URL or non-public key', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'not-a-url';
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_012345678901234567890123';
    expect(isSupabaseConfigured()).toBe(false);

    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://project.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'sb_secret_012345678901234567890123';
    expect(isSupabaseConfigured()).toBe(false);
  });

  it('accepts local Supabase over HTTP for development', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_012345678901234567890123';

    expect(isSupabaseConfigured()).toBe(true);
  });

  it('accepts a legacy anonymous JWT but rejects a service-role JWT', () => {
    const makeJwt = (role: string) => `eyJhbGciOiJub25lIn0.${btoa(JSON.stringify({ role }))}.signature`;
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://project.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = makeJwt('anon');
    expect(isSupabaseConfigured()).toBe(true);

    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = makeJwt('service_role');
    expect(isSupabaseConfigured()).toBe(false);
  });
});
