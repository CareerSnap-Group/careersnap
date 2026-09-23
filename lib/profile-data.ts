import { createClient } from '@/lib/supabase/server';

export type ProfileSkill = { id?: string; name: string };
export type ProfileExperience = {
  id?: string;
  job_title: string;
  company_name: string;
  location?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  is_current?: boolean;
  description?: string | null;
};
export type ProfileEducation = {
  id?: string;
  institution: string;
  degree?: string | null;
  field_of_study?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  description?: string | null;
};
export type ProfileCertification = {
  id?: string;
  name: string;
  issuing_organization?: string | null;
  issue_date?: string | null;
  expiry_date?: string | null;
  credential_id?: string | null;
  credential_url?: string | null;
};
export type ProfileLanguage = {
  id?: string;
  name: string;
  proficiency: string;
};
export type ProfileLink = {
  id?: string;
  label: string;
  url: string;
};

export type JobSeekerProfile = {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  phone: string | null;
  location: string | null;
  city: string | null;
  province: string | null;
  country: string | null;
  headline: string | null;
  professional_headline: string | null;
  bio: string | null;
  profile_photo_url: string | null;
  current_job_title: string | null;
  current_employer: string | null;
  years_experience: number | null;
  employment_status: string | null;
  desired_job_title: string | null;
  desired_employment_type: string | null;
  desired_work_arrangement: string | null;
  preferred_locations: string[] | null;
  expected_salary: number | null;
  availability: string | null;
  availability_start_date: string | null;
  allow_employer_discovery: boolean;
};

export type JobSeekerProfileData = {
  profile: JobSeekerProfile;
  skills: ProfileSkill[];
  experience: ProfileExperience[];
  education: ProfileEducation[];
  certifications: ProfileCertification[];
  languages: ProfileLanguage[];
  links: ProfileLink[];
  resumes: Array<{ id: string; file_name: string; created_at: string; is_primary: boolean; is_default: boolean; storage_path: string }>;
  completion: number;
  missingSections: string[];
  publicSummary: {
    displayName: string;
    headline: string;
    location: string;
    summary: string;
    skills: string[];
    experience: Array<{ job_title: string; company_name: string; location?: string | null; start_date?: string | null; end_date?: string | null; is_current?: boolean }>;
    education: Array<{ institution: string; degree?: string | null; field_of_study?: string | null }>;
    availability: string;
    hasCv: boolean;
  };
};

export function calculateProfileCompletion(data: Pick<JobSeekerProfileData, 'profile' | 'skills' | 'experience' | 'education' | 'certifications' | 'languages' | 'links' | 'resumes'>) {
  const checks = [
    { label: 'Profile photo', isComplete: Boolean(data.profile.profile_photo_url) },
    { label: 'Professional headline', isComplete: Boolean(data.profile.professional_headline || data.profile.headline) },
    { label: 'About section', isComplete: Boolean(data.profile.bio) },
    { label: 'Skills', isComplete: (data.skills || []).length > 0 },
    { label: 'Education', isComplete: (data.education || []).length > 0 },
    { label: 'Work experience', isComplete: (data.experience || []).length > 0 },
    { label: 'CV', isComplete: (data.resumes || []).length > 0 },
    { label: 'Contact information', isComplete: Boolean(data.profile.email || data.profile.phone) },
    { label: 'Professional links', isComplete: (data.links || []).length > 0 },
  ];

  const completedCount = checks.filter((item) => item.isComplete).length;
  const percentage = Math.round((completedCount / checks.length) * 100);
  const missingSections = checks.filter((item) => !item.isComplete).map((item) => item.label);

  return { percentage, missingSections, checks };
}

export async function getJobSeekerProfileData(userId: string): Promise<JobSeekerProfileData> {
  const supabase = createClient();
  const relationshipClient = supabase as any;

  const [profileResult, experienceResult, educationResult, skillsResult, certResult, languageResult, linkResult, resumeResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
    supabase.from('experiences').select('*').eq('user_id', userId).order('start_date', { ascending: false }),
    supabase.from('education').select('*').eq('user_id', userId).order('start_date', { ascending: false }),
    relationshipClient.from('user_skills').select('skill:skills(id, name)').eq('user_id', userId).order('skill_id', { ascending: true }),
    supabase.from('profile_certifications').select('*').eq('user_id', userId).order('issue_date', { ascending: false }),
    supabase.from('profile_languages').select('*').eq('user_id', userId).order('name', { ascending: true }),
    supabase.from('profile_links').select('*').eq('user_id', userId).order('label', { ascending: true }),
    supabase.from('resumes').select('id, file_name, created_at, is_primary, is_default, storage_path').eq('user_id', userId).order('created_at', { ascending: false }),
  ]);

  const profile = (profileResult.data || {
    id: userId,
    email: null,
    first_name: null,
    last_name: null,
    full_name: null,
    phone: null,
    location: null,
    city: null,
    province: null,
    country: null,
    headline: null,
    professional_headline: null,
    bio: null,
    profile_photo_url: null,
    current_job_title: null,
    current_employer: null,
    years_experience: null,
    employment_status: null,
    desired_job_title: null,
    desired_employment_type: null,
    desired_work_arrangement: null,
    preferred_locations: null,
    expected_salary: null,
    availability: 'not_specified',
    availability_start_date: null,
    allow_employer_discovery: false,
  }) as JobSeekerProfile;

  const skills = ((skillsResult.data || []) as Array<{ skill: { id: string; name: string } | null }>).flatMap((row) => row.skill ? [{ id: row.skill.id, name: row.skill.name }] : []);
  const experience = ((experienceResult.data || []) as Array<Record<string, unknown>>).map((item) => ({
    id: String(item.id ?? ''),
    job_title: String(item.job_title ?? ''),
    company_name: String(item.company_name ?? ''),
    location: (item.location as string | null) ?? null,
    start_date: (item.start_date as string | null) ?? null,
    end_date: (item.end_date as string | null) ?? null,
    is_current: Boolean(item.is_current),
    description: (item.description as string | null) ?? null,
  }));
  const education = ((educationResult.data || []) as Array<Record<string, unknown>>).map((item) => ({
    id: String(item.id ?? ''),
    institution: String(item.institution ?? ''),
    degree: (item.degree as string | null) ?? null,
    field_of_study: (item.field_of_study as string | null) ?? null,
    start_date: (item.start_date as string | null) ?? null,
    end_date: (item.end_date as string | null) ?? null,
    description: (item.description as string | null) ?? null,
  }));
  const certifications = ((certResult.data || []) as Array<Record<string, unknown>>).map((item) => ({
    id: String(item.id ?? ''),
    name: String(item.name ?? ''),
    issuing_organization: (item.issuing_organization as string | null) ?? null,
    issue_date: (item.issue_date as string | null) ?? null,
    expiry_date: (item.expiry_date as string | null) ?? null,
    credential_id: (item.credential_id as string | null) ?? null,
    credential_url: (item.credential_url as string | null) ?? null,
  }));
  const languages = ((languageResult.data || []) as Array<Record<string, unknown>>).map((item) => ({
    id: String(item.id ?? ''),
    name: String(item.name ?? ''),
    proficiency: String(item.proficiency ?? 'Professional'),
  }));
  const links = ((linkResult.data || []) as Array<Record<string, unknown>>).map((item) => ({
    id: String(item.id ?? ''),
    label: String(item.label ?? ''),
    url: String(item.url ?? ''),
  }));
  const resumes = ((resumeResult.data || []) as Array<Record<string, unknown>>).map((item) => ({
    id: String(item.id ?? ''),
    file_name: String(item.file_name ?? ''),
    created_at: String(item.created_at ?? ''),
    is_primary: Boolean(item.is_primary),
    is_default: Boolean(item.is_default),
    storage_path: String(item.storage_path ?? ''),
  }));

  const normalizedProfile: JobSeekerProfile = {
    ...profile,
    email: profile.email ?? null,
    first_name: profile.first_name ?? null,
    last_name: profile.last_name ?? null,
    full_name: profile.full_name || [profile.first_name, profile.last_name].filter(Boolean).join(' ') || null,
    headline: profile.headline || profile.professional_headline || null,
    professional_headline: profile.professional_headline || profile.headline || null,
    location: profile.location || [profile.city, profile.province, profile.country].filter(Boolean).join(', ') || null,
    preferred_locations: Array.isArray(profile.preferred_locations)
      ? profile.preferred_locations
      : profile.preferred_locations
        ? String(profile.preferred_locations).split(',').map((value) => value.trim()).filter(Boolean)
        : [],
    availability: profile.availability || 'not_specified',
    allow_employer_discovery: Boolean(profile.allow_employer_discovery),
  };

  const completion = calculateProfileCompletion({
    profile: normalizedProfile,
    skills,
    experience,
    education,
    certifications,
    languages,
    links,
    resumes,
  });

  return {
    profile: normalizedProfile,
    skills,
    experience,
    education,
    certifications,
    languages,
    links,
    resumes,
    completion: completion.percentage,
    missingSections: completion.missingSections,
    publicSummary: {
      displayName: normalizedProfile.full_name || [normalizedProfile.first_name, normalizedProfile.last_name].filter(Boolean).join(' ') || 'CareerSnap candidate',
      headline: normalizedProfile.professional_headline || normalizedProfile.headline || 'Professional profile',
      location: normalizedProfile.location || 'Location not specified',
      summary: normalizedProfile.bio || 'Professional summary not yet added.',
      skills: skills.map((skill) => skill.name),
      experience: experience.map((item) => ({
        job_title: item.job_title,
        company_name: item.company_name,
        location: item.location,
        start_date: item.start_date,
        end_date: item.end_date,
        is_current: !!item.is_current,
      })),
      education: education.map((item) => ({
        institution: item.institution,
        degree: item.degree,
        field_of_study: item.field_of_study,
      })),
      availability: normalizedProfile.availability || 'not_specified',
      hasCv: resumes.length > 0,
    },
  };
}
