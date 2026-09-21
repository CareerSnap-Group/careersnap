'use server';

import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/auth/server';

const availabilityValues = ['not_specified', 'immediately', 'notice_period', 'not_available'] as const;

export type SettingsState = { error: string; success: string };

function parseJsonField(formData: FormData, key: string) {
  const raw = String(formData.get(key) || '[]');
  if (!raw || raw === 'null') return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseJsonObject(formData: FormData, key: string) {
  const raw = String(formData.get(key) || '{}');
  if (!raw || raw === 'null') return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function normalizeOptionalString(value: FormDataEntryValue | null | undefined) {
  const str = String(value ?? '').trim();
  return str === '' ? null : str;
}

function normalizeNumber(value: FormDataEntryValue | null | undefined) {
  const str = String(value ?? '').trim();
  if (!str) return null;
  const number = Number(str);
  return Number.isFinite(number) ? number : null;
}

export async function updateSettings(_previousState: SettingsState, formData: FormData): Promise<SettingsState> {
  const { supabase } = await requireRole('job_seeker');

  const profileFields = parseJsonObject(formData, 'profile_json');
  const experience = parseJsonField(formData, 'experience_json');
  const education = parseJsonField(formData, 'education_json');
  const skills = parseJsonField(formData, 'skills_json');
  const certifications = parseJsonField(formData, 'certifications_json');
  const languages = parseJsonField(formData, 'languages_json');
  const links = parseJsonField(formData, 'links_json');

  const availability = String(profileFields.availability || 'not_specified');
  if (!availabilityValues.includes(availability as typeof availabilityValues[number])) {
    return { error: 'Please choose a valid availability option.', success: '' };
  }

  const fullName = [normalizeOptionalString(profileFields.first_name), normalizeOptionalString(profileFields.last_name)].filter(Boolean).join(' ') || normalizeOptionalString(profileFields.full_name) || null;
  const preferredLocations = Array.isArray(profileFields.preferred_locations)
    ? profileFields.preferred_locations.map((location: string) => String(location).trim()).filter(Boolean)
    : String(profileFields.preferred_locations || '').split(',').map((location) => location.trim()).filter(Boolean);

  const normalizedProfile = {
    ...profileFields,
    first_name: normalizeOptionalString(profileFields.first_name),
    last_name: normalizeOptionalString(profileFields.last_name),
    full_name: fullName,
    email: normalizeOptionalString(profileFields.email),
    phone: normalizeOptionalString(profileFields.phone),
    location: normalizeOptionalString(profileFields.location),
    city: normalizeOptionalString(profileFields.city),
    province: normalizeOptionalString(profileFields.province),
    country: normalizeOptionalString(profileFields.country),
    headline: normalizeOptionalString(profileFields.professional_headline) || normalizeOptionalString(profileFields.headline),
    professional_headline: normalizeOptionalString(profileFields.professional_headline),
    bio: normalizeOptionalString(profileFields.bio),
    profile_photo_url: normalizeOptionalString(profileFields.profile_photo_url),
    current_job_title: normalizeOptionalString(profileFields.current_job_title),
    current_employer: normalizeOptionalString(profileFields.current_employer),
    years_experience: normalizeNumber(profileFields.years_experience),
    employment_status: normalizeOptionalString(profileFields.employment_status),
    desired_job_title: normalizeOptionalString(profileFields.desired_job_title),
    desired_employment_type: normalizeOptionalString(profileFields.desired_employment_type),
    desired_work_arrangement: normalizeOptionalString(profileFields.desired_work_arrangement),
    preferred_locations: preferredLocations,
    expected_salary: normalizeNumber(profileFields.expected_salary),
    availability,
    allow_employer_discovery: Boolean(profileFields.allow_employer_discovery),
  };

  const { error: rpcError } = await supabase.rpc('save_job_seeker_profile' as never, {
    p_profile: normalizedProfile,
    p_experience: experience,
    p_education: education,
    p_skills: skills,
    p_certifications: certifications,
    p_languages: languages,
    p_links: links,
  } as never);

  if (rpcError) {
    return { error: 'Your profile could not be saved. Please review the form and try again.', success: '' };
  }

  revalidatePath('/settings');
  revalidatePath('/profile');
  return { error: '', success: 'Your profile has been updated successfully.' };
}