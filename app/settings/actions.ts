'use server';

import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/auth/server';

const availabilityValues = ['not_specified', 'immediately', 'notice_period', 'not_available'] as const;

export type SettingsState = { error: string; success: string };

export async function updateSettings(_previousState: SettingsState, formData: FormData): Promise<SettingsState> {
  const { supabase, user } = await requireRole('job_seeker');
  const availability = String(formData.get('availability') || 'not_specified');
  if (!availabilityValues.includes(availability as typeof availabilityValues[number])) {
    return { error: 'Please choose a valid availability option.', success: '' };
  }

  const { error } = await supabase.from('profiles').update({
    full_name: String(formData.get('full_name') || '').trim() || null,
    headline: String(formData.get('headline') || '').trim() || null,
    bio: String(formData.get('bio') || '').trim() || null,
    location: String(formData.get('location') || '').trim() || null,
    allow_employer_discovery: formData.get('allow_employer_discovery') === 'on',
    availability,
  }).eq('id', user.id);

  if (error) return { error: 'Your settings could not be saved. Please try again.', success: '' };
  revalidatePath('/settings');
  revalidatePath('/profile');
  return { error: '', success: 'Your profile settings have been saved.' };
}