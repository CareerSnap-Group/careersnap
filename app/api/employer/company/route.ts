import { NextResponse } from 'next/server';
import { getEmployerContext } from '@/lib/auth/server';

const MAX_LOGO_FILE_SIZE = 5 * 1024 * 1024;
const allowedImageTypes = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);
const allowedImageExtensions = new Set(['png', 'jpg', 'jpeg', 'webp', 'gif']);

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

function isAllowedLogoFile(file: File) {
  const extension = file.name.split('.').pop()?.toLowerCase();
  return Boolean(extension && allowedImageExtensions.has(extension) && allowedImageTypes.has(file.type));
}

function getStorageObjectPathFromPublicUrl(publicUrl?: string | null) {
  if (!publicUrl) return null;

  try {
    const parsedUrl = new URL(publicUrl);
    const prefix = '/storage/v1/object/public/profile-photos/';
    const pathname = decodeURIComponent(parsedUrl.pathname);
    if (!pathname.startsWith(prefix)) return null;

    const objectPath = pathname.slice(prefix.length).replace(/^\/+|\/+$/g, '');
    return objectPath || null;
  } catch {
    return null;
  }
}

function isSafeCompanyLogoPath(path: string | null | undefined, userId: string, companyId: string) {
  if (!path) return false;

  const normalizedPath = path.replace(/^\/+|\/+$/g, '');
  const expectedPrefix = `${userId}/company-logos/`;
  if (!normalizedPath.startsWith(expectedPrefix)) return false;

  const objectName = normalizedPath.slice(expectedPrefix.length);
  return objectName.startsWith(`${companyId}-`);
}

async function cleanupCompanyLogoObject({
  supabase,
  userId,
  companyId,
  objectUrl,
  currentCompanyLogoUrl,
}: {
  supabase: Awaited<ReturnType<typeof getEmployerContext>>['supabase'];
  userId: string;
  companyId: string;
  objectUrl?: string | null;
  currentCompanyLogoUrl?: string | null;
}) {
  if (!objectUrl) return { deleted: false, reason: 'No object URL was supplied for cleanup.' };

  const objectPath = getStorageObjectPathFromPublicUrl(objectUrl);
  if (!objectPath) return { deleted: false, reason: 'The object URL is not a valid public profile-photos reference.' };
  if (!isSafeCompanyLogoPath(objectPath, userId, companyId)) {
    return { deleted: false, reason: 'The object path is outside the authenticated employer company-logo namespace.' };
  }
  if (currentCompanyLogoUrl && objectUrl !== currentCompanyLogoUrl) {
    return { deleted: false, reason: 'The cleanup target does not match the current company logo reference.' };
  }

  const { error } = await supabase.storage.from('profile-photos').remove([objectPath]);
  if (error) {
    return { deleted: false, reason: 'The previous logo could not be removed from storage.' };
  }

  return { deleted: true, reason: null };
}

export async function PATCH(request: Request) {
  const { supabase, membership, user } = await getEmployerContext();
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

  const { data: currentCompany, error: companyLookupError } = await supabase
    .from('companies')
    .select('logo_url')
    .eq('id', companyId)
    .maybeSingle();

  if (companyLookupError) return NextResponse.json({ error: 'We could not load the company profile.' }, { status: 400 });

  const previousLogoUrl = currentCompany?.logo_url || null;
  const shouldRemoveLogo = body.remove_logo === 'true';
  const logoFile = contentType.includes('multipart/form-data') ? (body.logo_file as File | undefined) : undefined;

  let logoUrl = normalizeUrl(typeof body.logo_url === 'string' ? body.logo_url : undefined) || null;

  if (logoFile && logoFile.size > 0) {
    if (logoFile.size > MAX_LOGO_FILE_SIZE) return NextResponse.json({ error: 'Company logo must be 5MB or smaller.' }, { status: 400 });
    if (!isAllowedLogoFile(logoFile)) return NextResponse.json({ error: 'Upload a PNG, JPG, JPEG, GIF, or WEBP company logo.' }, { status: 400 });

    const extension = (logoFile.name.split('.').pop() || 'png').toLowerCase();
    const storagePath = `${user.id}/company-logos/${companyId}-${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage.from('profile-photos').upload(storagePath, logoFile, {
      cacheControl: '3600',
      upsert: false,
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

  if (error) {
    if (logoFile && logoFile.size > 0 && logoUrl) {
      const cleanup = await cleanupCompanyLogoObject({
        supabase,
        userId: user.id,
        companyId,
        objectUrl: logoUrl,
        currentCompanyLogoUrl: null,
      });
      if (!cleanup.deleted) {
        console.warn('Company logo upload cleanup failed after DB update error:', cleanup.reason);
      }
    }
    return NextResponse.json({ error: 'We could not update the company profile.' }, { status: 400 });
  }

  if (logoFile && logoFile.size > 0 && previousLogoUrl && previousLogoUrl !== logoUrl) {
    const cleanup = await cleanupCompanyLogoObject({
      supabase,
      userId: user.id,
      companyId,
      objectUrl: previousLogoUrl,
      currentCompanyLogoUrl: previousLogoUrl,
    });
    if (!cleanup.deleted) {
      console.warn('Previous company logo cleanup failed after replacement:', cleanup.reason);
    }
  }

  if (shouldRemoveLogo && previousLogoUrl) {
    const cleanup = await cleanupCompanyLogoObject({
      supabase,
      userId: user.id,
      companyId,
      objectUrl: previousLogoUrl,
      currentCompanyLogoUrl: previousLogoUrl,
    });
    if (!cleanup.deleted) {
      console.warn('Previous company logo cleanup failed during removal:', cleanup.reason);
    }
  }

  return NextResponse.json({ ok: true, logo_url: logoUrl });
}