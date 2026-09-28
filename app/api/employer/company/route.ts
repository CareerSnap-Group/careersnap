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

function getLogoValidationError(file: File) {
  if (file.size > MAX_LOGO_FILE_SIZE) return 'Company logo must be 5MB or smaller.';
  if (!isAllowedLogoFile(file)) return 'Upload a PNG, JPG, JPEG, GIF, or WEBP company logo.';
  return null;
}

async function readBody(request: Request) {
  const contentType = request.headers.get('content-type') || '';
  if (contentType.includes('multipart/form-data')) {
    return Object.fromEntries((await request.formData()).entries()) as Record<string, FormDataEntryValue | string | null>;
  }
  return await request.json().catch(() => null) as Record<string, FormDataEntryValue | string | null> | null;
}

function getText(body: Record<string, FormDataEntryValue | string | null>, key: string) {
  const value = body[key];
  return typeof value === 'string' ? value : '';
}

async function uploadCompanyLogo({
  supabase,
  userId,
  companyId,
  file,
}: {
  supabase: Awaited<ReturnType<typeof getEmployerContext>>['supabase'];
  userId: string;
  companyId: string;
  file: File;
}) {
  const validationError = getLogoValidationError(file);
  if (validationError) return { logoUrl: null, error: validationError };

  const extension = (file.name.split('.').pop() || 'png').toLowerCase();
  const storagePath = `${userId}/company-logos/${companyId}-${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from('profile-photos').upload(storagePath, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || 'image/png',
  });

  if (error) return { logoUrl: null, error: 'We could not upload the company logo.' };

  const { data } = supabase.storage.from('profile-photos').getPublicUrl(storagePath);
  return { logoUrl: data.publicUrl, error: null };
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
  const companyMembership = membership as unknown as { company_id: string; role: string } | null;
  const companyId = companyMembership?.company_id;
  if (!companyId) return NextResponse.json({ error: 'Your employer account has no company.' }, { status: 404 });
  if (!['owner', 'admin'].includes(companyMembership.role)) {
    return NextResponse.json({ error: 'Only company owners and admins can edit the company profile.' }, { status: 403 });
  }

  const body = await readBody(request);

  if (!body) return NextResponse.json({ error: 'Company profile data was not provided.' }, { status: 400 });

  const contentType = request.headers.get('content-type') || '';
  const name = getText(body, 'name').trim();
  if (!name) return NextResponse.json({ error: 'Company name is required.' }, { status: 400 });

  const website = normalizeUrl(getText(body, 'website')) || null;
  const description = getText(body, 'description').trim() || null;
  const location = getText(body, 'location').trim() || null;
  const industry = getText(body, 'industry').trim() || null;

  const { data: currentCompany, error: companyLookupError } = await supabase
    .from('companies')
    .select('logo_url')
    .eq('id', companyId)
    .maybeSingle();

  if (companyLookupError) return NextResponse.json({ error: 'We could not load the company profile.' }, { status: 400 });

  const previousLogoUrl = currentCompany?.logo_url || null;
  const shouldRemoveLogo = getText(body, 'remove_logo') === 'true';
  const logoFile = contentType.includes('multipart/form-data') ? (body.logo_file as File | undefined) : undefined;

  let logoUrl = normalizeUrl(getText(body, 'logo_url')) || null;

  if (logoFile && logoFile.size > 0) {
    const upload = await uploadCompanyLogo({ supabase, userId: user.id, companyId, file: logoFile });
    if (upload.error) return NextResponse.json({ error: upload.error }, { status: 400 });
    logoUrl = upload.logoUrl;
  } else if (shouldRemoveLogo) {
    logoUrl = null;
  }

  const socialFields = {
    facebook_url: normalizeUrl(getText(body, 'facebook_url')) || null,
    instagram_url: normalizeUrl(getText(body, 'instagram_url')) || null,
    linkedin_url: normalizeUrl(getText(body, 'linkedin_url')) || null,
    x_url: normalizeUrl(getText(body, 'x_url')) || null,
    tiktok_url: normalizeUrl(getText(body, 'tiktok_url')) || null,
    youtube_url: normalizeUrl(getText(body, 'youtube_url')) || null,
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

export async function POST(request: Request) {
  const { supabase, membership, user } = await getEmployerContext();
  const body = await readBody(request);
  if (!body) return NextResponse.json({ error: 'Company profile data was not provided.' }, { status: 400 });

  if (getText(body, 'action') === 'claim') {
    const companyId = getText(body, 'company_id');
    if (!companyId) return NextResponse.json({ error: 'A company to claim was not provided.' }, { status: 400 });

    const { data, error } = await supabase.rpc('claim_company_owner', { target_company_id: companyId });
    if (error) return NextResponse.json({ error: 'We could not claim this company.' }, { status: 400 });

    const claimResult = data as { success?: boolean; reason?: string } | null;
    if (!claimResult?.success) {
      return NextResponse.json({ error: claimResult?.reason || 'This company cannot be claimed by your account.' }, { status: 409 });
    }

    return NextResponse.json({ ok: true, claimed: true });
  }

  if (membership) {
    return NextResponse.json({
      code: 'company_already_configured',
      error: 'Your employer account already has a company membership.',
    }, { status: 409 });
  }

  const name = getText(body, 'name').trim();
  if (!name) return NextResponse.json({ error: 'Company name is required.' }, { status: 400 });

  const contentType = request.headers.get('content-type') || '';
  const logoFile = contentType.includes('multipart/form-data') ? (body.logo_file as File | undefined) : undefined;
  if (logoFile && logoFile.size > 0) {
    const validationError = getLogoValidationError(logoFile);
    if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const website = normalizeUrl(getText(body, 'website')) || null;
  const { data: company, error: createError } = await supabase.rpc('create_employer_company', {
    p_name: name,
    p_description: getText(body, 'description').trim() || null,
    p_website: website,
    p_industry: getText(body, 'industry').trim() || null,
    p_location: getText(body, 'location').trim() || null,
    p_facebook_url: normalizeUrl(getText(body, 'facebook_url')),
    p_instagram_url: normalizeUrl(getText(body, 'instagram_url')),
    p_linkedin_url: normalizeUrl(getText(body, 'linkedin_url')),
    p_x_url: normalizeUrl(getText(body, 'x_url')),
    p_tiktok_url: normalizeUrl(getText(body, 'tiktok_url')),
    p_youtube_url: normalizeUrl(getText(body, 'youtube_url')),
  });

  if (createError || !company) {
    return NextResponse.json({ error: 'We could not create your company.' }, { status: 400 });
  }

  const companyResult = company as unknown as { status: 'created' | 'existing' | 'claim_required'; company: { id: string } };
  if (companyResult.status === 'existing') {
    return NextResponse.json({
      code: 'company_already_configured',
      error: 'Your employer account already has a company membership.',
      company_id: companyResult.company.id,
    }, { status: 409 });
  }
  if (companyResult.status === 'claim_required') {
    return NextResponse.json({
      code: 'company_claim_required',
      error: 'Claim the company created by your account before creating another company.',
      company_id: companyResult.company.id,
    }, { status: 409 });
  }
  const createdCompany = companyResult.company;

  if (!logoFile || logoFile.size === 0) {
    return NextResponse.json({ ok: true, company_id: createdCompany.id, logo_url: null }, { status: 201 });
  }

  const upload = await uploadCompanyLogo({ supabase, userId: user.id, companyId: createdCompany.id, file: logoFile });
  if (upload.error || !upload.logoUrl) {
    return NextResponse.json({
      ok: true,
      company_id: createdCompany.id,
      logo_url: null,
      warning: upload.error || 'The company was created, but its logo could not be saved.',
    }, { status: 201 });
  }

  const { error: logoUpdateError } = await supabase.from('companies').update({ logo_url: upload.logoUrl }).eq('id', createdCompany.id);
  if (logoUpdateError) {
    const cleanup = await cleanupCompanyLogoObject({
      supabase,
      userId: user.id,
      companyId: createdCompany.id,
      objectUrl: upload.logoUrl,
      currentCompanyLogoUrl: null,
    });
    if (!cleanup.deleted) console.warn('Company logo cleanup failed after company creation:', cleanup.reason);
    return NextResponse.json({
      ok: true,
      company_id: createdCompany.id,
      logo_url: null,
      warning: 'The company was created, but its logo could not be saved. You can upload it again from the company profile.',
    }, { status: 201 });
  }

  return NextResponse.json({ ok: true, company_id: createdCompany.id, logo_url: upload.logoUrl }, { status: 201 });
}