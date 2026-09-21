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
  const { supabase, user } = await requireRole('job_seeker');

  const profileFields = JSON.parse(String(formData.get('profile_json') || '{}'));
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

  const { error: profileError } = await supabase.from('profiles').update({
    first_name: normalizeOptionalString(profileFields.first_name),
    last_name: normalizeOptionalString(profileFields.last_name),
    full_name: fullName,
    email: normalizeOptionalString(profileFields.email) || user.email || null,
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
    preferred_locations: preferredLocations.length ? preferredLocations : [],
    expected_salary: normalizeNumber(profileFields.expected_salary),
    availability,
    allow_employer_discovery: Boolean(profileFields.allow_employer_discovery),
  }).eq('id', user.id);

  if (profileError) {
    return { error: 'Your profile could not be saved. Please review the form and try again.', success: '' };
  }

  await supabase.from('experiences').delete().eq('user_id', user.id);
  if (experience.length) {
    const nextExperience = experience
      .filter((item: any) => item && (item.job_title || item.company_name || item.location))
      .map((item: any) => ({
        user_id: user.id,
        job_title: String(item.job_title || '').trim(),
        company_name: String(item.company_name || '').trim(),
        location: String(item.location || '').trim() || null,
        start_date: item.start_date || null,
        end_date: item.is_current ? null : (item.end_date || null),
        is_current: Boolean(item.is_current),
        description: String(item.description || '').trim() || null,
      }));
    if (nextExperience.length) await supabase.from('experiences').insert(nextExperience);
  }

  await supabase.from('education').delete().eq('user_id', user.id);
  if (education.length) {
    const nextEducation = education
      .filter((item: any) => item && (item.institution || item.degree || item.field_of_study))
      .map((item: any) => ({
        user_id: user.id,
        institution: String(item.institution || '').trim(),
        degree: String(item.degree || '').trim() || null,
        field_of_study: String(item.field_of_study || '').trim() || null,
        start_date: item.start_date || null,
        end_date: item.end_date || null,
        description: String(item.description || '').trim() || null,
      }));
    if (nextEducation.length) await supabase.from('education').insert(nextEducation);
  }

  await supabase.from('skills').delete().eq('user_id', user.id);
  if (skills.length) {
    const nextSkills = skills
      .map((skill: any) => String(skill || '').trim())
      .filter(Boolean)
      .map((name: string) => ({ user_id: user.id, name, proficiency: 'Professional' }));
    if (nextSkills.length) await supabase.from('skills').insert(nextSkills);
  }

  await supabase.from('profile_certifications').delete().eq('user_id', user.id);
  if (certifications.length) {
    const nextCerts = certifications
      .filter((item: any) => item && (item.name || item.issuing_organization))
      .map((item: any) => ({
        user_id: user.id,
        name: String(item.name || '').trim(),
        issuing_organization: String(item.issuing_organization || '').trim() || null,
        issue_date: item.issue_date || null,
        expiry_date: item.expiry_date || null,
        credential_id: String(item.credential_id || '').trim() || null,
        credential_url: String(item.credential_url || '').trim() || null,
      }));
    if (nextCerts.length) await supabase.from('profile_certifications').insert(nextCerts);
  }

  await supabase.from('profile_languages').delete().eq('user_id', user.id);
  if (languages.length) {
    const nextLanguages = languages
      .filter((item: any) => item && item.name)
      .map((item: any) => ({
        user_id: user.id,
        name: String(item.name || '').trim(),
        proficiency: String(item.proficiency || 'Professional'),
      }));
    if (nextLanguages.length) await supabase.from('profile_languages').insert(nextLanguages);
  }

  await supabase.from('profile_links').delete().eq('user_id', user.id);
  if (links.length) {
    const nextLinks = links
      .filter((item: any) => item && item.url)
      .map((item: any) => ({
        user_id: user.id,
        label: String(item.label || 'Professional link').trim() || 'Professional link',
        url: String(item.url || '').trim(),
      }));
    if (nextLinks.length) await supabase.from('profile_links').insert(nextLinks);
  }

  revalidatePath('/settings');
  revalidatePath('/profile');
  return { error: '', success: 'Your profile has been updated successfully.' };
}