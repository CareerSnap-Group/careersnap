import { NextResponse } from 'next/server';
import { getEmployerContext } from '@/lib/auth/server';

function normalizeUrl(value?: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.toString() : null;
  } catch {
    return null;
  }
}

export async function PATCH(request: Request) {
  const { supabase, membership } = await getEmployerContext();
  const companyId = (membership as unknown as { company_id: string } | null)?.company_id;
  if (!companyId) return NextResponse.json({ error: 'Your employer account has no company.' }, { status: 404 });

  let body: Record<string, FormDataEntryValue | string | null> | null = null;
  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    body = Object.fromEntries(formData.entries());
  } else {
    body = await request.json().catch(() => null) as Record<string, string> | null;
  }

  if (!body) return NextResponse.json({ error: 'Company profile data was not provided.' }, { status: 400 });

  const name = (typeof body.name === 'string' ? body.name : '').trim();
  if (!name) return NextResponse.json({ error: 'Company name is required.' }, { status: 400 });

  const website = normalizeUrl(typeof body.website === 'string' ? body.website : undefined) || null;
  const description = (typeof body.description === 'string' ? body.description : '').trim() || null;
  const location = (typeof body.location === 'string' ? body.location : '').trim() || null;
  const industry = (typeof body.industry === 'string' ? body.industry : '').trim() || null;

  let logoUrl = normalizeUrl(typeof body.logo_url === 'string' ? body.logo_url : undefined) || null;
  const shouldRemoveLogo = body.remove_logo === 'true';
  const logoFile = contentType.includes('multipart/form-data') ? (body.logo_file as File | undefined) : undefined;

  if (logoFile && logoFile.size > 0) {
    const safeName = `${companyId}-${Date.now()}-${(logoFile.name || 'logo').replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const storagePath = `company-logos/${safeName}`;
    const { error: uploadError } = await supabase.storage.from('profile-photos').upload(storagePath, logoFile, {
      cacheControl: '3600',
      upsert: true,
      contentType: logoFile.type || 'image/png',
    });

    if (uploadError) return NextResponse.json({ error: 'We could not upload the company logo.' }, { status: 400 });

    const { data: publicData } = supabase.storage.from('profile-photos').getPublicUrl(storagePath);
    logoUrl = publicData?.publicUrl || null;
  } else if (shouldRemoveLogo) {
    logoUrl = null;
  }

  const socialFields = {
    facebook_url: normalizeUrl(typeof body.facebook_url === 'string' ? body.facebook_url : undefined) || null,
    instagram_url: normalizeUrl(typeof body.instagram_url === 'string' ? body.instagram_url : undefined) || null,
    linkedin_url: normalizeUrl(typeof body.linkedin_url === 'string' ? body.linkedin_url : undefined) || null,
    x_url: normalizeUrl(typeof body.x_url === 'string' ? body.x_url : undefined) || null,
    tiktok_url: normalizeUrl(typeof body.tiktok_url === 'string' ? body.tiktok_url : undefined) || null,
    youtube_url: normalizeUrl(typeof body.youtube_url === 'string' ? body.youtube_url : undefined) || null,
  };

  const { error } = await supabase.from('companies').update({
    name,
    description,
    website,
    website_url: website,
    location,
    industry,
    logo_url: logoUrl,
    ...socialFields,
  }).eq('id', companyId);

  if (error) return NextResponse.json({ error: 'We could not update the company profile.' }, { status: 400 });
  return NextResponse.json({ ok: true, logo_url: logoUrl });
}