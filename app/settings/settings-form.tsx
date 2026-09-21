'use client';

import { useMemo, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { updateSettings, type SettingsState } from './actions';
import styles from './settings.module.css';

type ExperienceRecord = {
  id?: string;
  job_title: string;
  company_name: string;
  location: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  description: string;
};

type EducationRecord = {
  id?: string;
  institution: string;
  degree: string;
  field_of_study: string;
  start_date: string;
  end_date: string;
  description: string;
};

type CertificationRecord = {
  id?: string;
  name: string;
  issuing_organization: string;
  issue_date: string;
  expiry_date: string;
  credential_id: string;
  credential_url: string;
};

type LanguageRecord = {
  id?: string;
  name: string;
  proficiency: string;
};

type LinkRecord = {
  id?: string;
  label: string;
  url: string;
};

function emptyExperience(): ExperienceRecord { return { job_title: '', company_name: '', location: '', start_date: '', end_date: '', is_current: false, description: '' }; }
function emptyEducation(): EducationRecord { return { institution: '', degree: '', field_of_study: '', start_date: '', end_date: '', description: '' }; }
function emptyCertification(): CertificationRecord { return { name: '', issuing_organization: '', issue_date: '', expiry_date: '', credential_id: '', credential_url: '' }; }
function emptyLanguage(): LanguageRecord { return { name: '', proficiency: 'Professional' }; }
function emptyLink(): LinkRecord { return { label: 'LinkedIn', url: '' }; }

function SaveButton() {
  const { pending } = useFormStatus();
  return <Button type="submit" size="lg" disabled={pending}>{pending ? 'Saving...' : 'Save changes'}</Button>;
}

export function SettingsForm({ initialProfile }: { initialProfile: any }) {
  const initial = initialProfile?.profile || {};
  const [profile, setProfile] = useState({
    email: initial.email || '',
    first_name: initial.first_name || '',
    last_name: initial.last_name || '',
    phone: initial.phone || '',
    location: initial.location || '',
    city: initial.city || '',
    province: initial.province || '',
    country: initial.country || '',
    profile_photo_url: initial.profile_photo_url || '',
    professional_headline: initial.professional_headline || initial.headline || '',
    bio: initial.bio || '',
    current_job_title: initial.current_job_title || '',
    current_employer: initial.current_employer || '',
    years_experience: initial.years_experience || '',
    employment_status: initial.employment_status || 'employed',
    desired_job_title: initial.desired_job_title || '',
    desired_employment_type: initial.desired_employment_type || 'full-time',
    desired_work_arrangement: initial.desired_work_arrangement || 'remote',
    preferred_locations: Array.isArray(initial.preferred_locations) ? initial.preferred_locations.join(', ') : '',
    expected_salary: initial.expected_salary || '',
    availability: initial.availability || 'not_specified',
    allow_employer_discovery: Boolean(initial.allow_employer_discovery),
  });
  const [experience, setExperience] = useState<ExperienceRecord[]>(initialProfile?.experience?.length ? initialProfile.experience.map((item: any) => ({ id: item.id, job_title: item.job_title || '', company_name: item.company_name || '', location: item.location || '', start_date: item.start_date || '', end_date: item.end_date || '', is_current: Boolean(item.is_current), description: item.description || '' })) : [emptyExperience()]);
  const [education, setEducation] = useState<EducationRecord[]>(initialProfile?.education?.length ? initialProfile.education.map((item: any) => ({ id: item.id, institution: item.institution || '', degree: item.degree || '', field_of_study: item.field_of_study || '', start_date: item.start_date || '', end_date: item.end_date || '', description: item.description || '' })) : [emptyEducation()]);
  const [skills, setSkills] = useState<string[]>(initialProfile?.skills?.length ? initialProfile.skills.map((item: any) => item.name || '') : ['']);
  const [certifications, setCertifications] = useState<CertificationRecord[]>(initialProfile?.certifications?.length ? initialProfile.certifications.map((item: any) => ({ id: item.id, name: item.name || '', issuing_organization: item.issuing_organization || '', issue_date: item.issue_date || '', expiry_date: item.expiry_date || '', credential_id: item.credential_id || '', credential_url: item.credential_url || '' })) : [emptyCertification()]);
  const [languages, setLanguages] = useState<LanguageRecord[]>(initialProfile?.languages?.length ? initialProfile.languages.map((item: any) => ({ id: item.id, name: item.name || '', proficiency: item.proficiency || 'Professional' })) : [emptyLanguage()]);
  const [links, setLinks] = useState<LinkRecord[]>(initialProfile?.links?.length ? initialProfile.links.map((item: any) => ({ id: item.id, label: item.label || 'LinkedIn', url: item.url || '' })) : [emptyLink()]);
  const initialState: SettingsState = { error: '', success: '' };
  const [state, formAction] = useFormState(updateSettings, initialState);
  const serialized = useMemo(() => ({ profile, experience, education, skills, certifications, languages, links }), [profile, experience, education, skills, certifications, languages, links]);

  const updateField = (key: keyof typeof profile, value: string | boolean) => setProfile((current) => ({ ...current, [key]: value }));
  const pushItem = <T,>(list: T[], setList: (next: T[]) => void, item: T) => setList([...list, item]);
  const removeItem = <T,>(list: T[], setList: (next: T[]) => void, index: number) => setList(list.filter((_, i) => i !== index));

  return (
    <form action={formAction} className={styles.form}>
      {state.error && <p className={styles.error} role="alert">{state.error}</p>}
      {state.success && <p className={styles.success} role="status">{state.success}</p>}

      <input type="hidden" name="profile_json" value={JSON.stringify(serialized.profile)} />
      <input type="hidden" name="experience_json" value={JSON.stringify(experience)} />
      <input type="hidden" name="education_json" value={JSON.stringify(education)} />
      <input type="hidden" name="skills_json" value={JSON.stringify(skills)} />
      <input type="hidden" name="certifications_json" value={JSON.stringify(certifications)} />
      <input type="hidden" name="languages_json" value={JSON.stringify(languages)} />
      <input type="hidden" name="links_json" value={JSON.stringify(links)} />

      <section className={styles.sectionBlock}>
        <div className={styles.sectionHeader}><h2>Personal information</h2></div>
        <div className={styles.fieldsGrid}>
          <Input name="first_name" label="First name" value={profile.first_name} onChange={(event) => updateField('first_name', event.target.value)} autoComplete="given-name" />
          <Input name="last_name" label="Last name" value={profile.last_name} onChange={(event) => updateField('last_name', event.target.value)} autoComplete="family-name" />
          <Input name="email" label="Email address" value={profile.email} readOnly helperText="Managed through your account." />
          <Input name="phone" label="Phone number" value={profile.phone} onChange={(event) => updateField('phone', event.target.value)} autoComplete="tel" />
          <Input name="profile_photo_url" label="Profile photo URL" value={profile.profile_photo_url} onChange={(event) => updateField('profile_photo_url', event.target.value)} placeholder="https://example.com/me.jpg" />
          <Input name="professional_headline" label="Professional headline" value={profile.professional_headline} onChange={(event) => updateField('professional_headline', event.target.value)} placeholder="Senior Product Designer" />
          <div className={styles.fullWidth}><label className={styles.field}><span>About me</span><textarea name="bio" value={profile.bio} onChange={(event) => updateField('bio', event.target.value)} rows={5} placeholder="Describe your background, strengths, and professional goals." /></label></div>
          <Input name="city" label="City" value={profile.city} onChange={(event) => updateField('city', event.target.value)} />
          <Input name="province" label="Province / State" value={profile.province} onChange={(event) => updateField('province', event.target.value)} />
          <Input name="country" label="Country" value={profile.country} onChange={(event) => updateField('country', event.target.value)} />
          <Input name="location" label="Location summary" value={profile.location} onChange={(event) => updateField('location', event.target.value)} placeholder="Johannesburg, South Africa" />
        </div>
      </section>

      <section className={styles.sectionBlock}>
        <div className={styles.sectionHeader}><h2>Professional information</h2></div>
        <div className={styles.fieldsGrid}>
          <Input name="current_job_title" label="Current / most recent job title" value={profile.current_job_title} onChange={(event) => updateField('current_job_title', event.target.value)} />
          <Input name="current_employer" label="Current / most recent employer" value={profile.current_employer} onChange={(event) => updateField('current_employer', event.target.value)} />
          <Input name="years_experience" type="number" min="0" label="Years of experience" value={profile.years_experience} onChange={(event) => updateField('years_experience', event.target.value)} />
          <label className={styles.field} htmlFor="employment_status"><span>Employment status</span><select id="employment_status" name="employment_status" value={profile.employment_status} onChange={(event) => updateField('employment_status', event.target.value)}><option value="employed">Employed</option><option value="self-employed">Self-employed</option><option value="unemployed">Unemployed</option><option value="student">Student</option><option value="freelance">Freelance</option></select></label>
          <Input name="desired_job_title" label="Desired job title" value={profile.desired_job_title} onChange={(event) => updateField('desired_job_title', event.target.value)} />
          <label className={styles.field} htmlFor="desired_employment_type"><span>Desired employment type</span><select id="desired_employment_type" name="desired_employment_type" value={profile.desired_employment_type} onChange={(event) => updateField('desired_employment_type', event.target.value)}><option value="full-time">Full-time</option><option value="part-time">Part-time</option><option value="contract">Contract</option><option value="internship">Internship</option><option value="temporary">Temporary</option></select></label>
          <label className={styles.field} htmlFor="desired_work_arrangement"><span>Preferred work arrangement</span><select id="desired_work_arrangement" name="desired_work_arrangement" value={profile.desired_work_arrangement} onChange={(event) => updateField('desired_work_arrangement', event.target.value)}><option value="on-site">On-site</option><option value="hybrid">Hybrid</option><option value="remote">Remote</option></select></label>
          <Input name="preferred_locations" label="Preferred locations" value={profile.preferred_locations} onChange={(event) => updateField('preferred_locations', event.target.value)} placeholder="Johannesburg, Cape Town, Remote" />
          <Input name="expected_salary" type="number" min="0" label="Expected salary (annual, ZAR)" value={profile.expected_salary} onChange={(event) => updateField('expected_salary', event.target.value)} />
          <label className={styles.field} htmlFor="availability"><span>Availability</span><select id="availability" name="availability" value={profile.availability} onChange={(event) => updateField('availability', event.target.value)}><option value="not_specified">Not specified</option><option value="immediately">Immediately</option><option value="notice_period">Notice period</option><option value="not_available">Not available</option></select></label>
        </div>
      </section>

      <section className={styles.sectionBlock}>
        <div className={styles.sectionHeader}><h2>Skills</h2><Button type="button" variant="outline" size="sm" onClick={() => pushItem(skills, setSkills, '')}>Add skill</Button></div>
        {skills.map((skill, index) => (
          <div key={`skill-${index}`} className={styles.inlineRow}>
            <Input label="Skill" value={skill} onChange={(event) => setSkills((current) => current.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} />
            {skills.length > 1 && <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(skills, setSkills, index)}>Remove</Button>}
          </div>
        ))}
      </section>

      <section className={styles.sectionBlock}>
        <div className={styles.sectionHeader}><h2>Work experience</h2><Button type="button" variant="outline" size="sm" onClick={() => pushItem(experience, setExperience, emptyExperience())}>Add experience</Button></div>
        {experience.map((item, index) => (
          <div key={`exp-${index}`} className={styles.repeatCard}>
            <div className={styles.inlineRow}>
              <Input label="Job title" value={item.job_title} onChange={(event) => setExperience((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, job_title: event.target.value } : entry))} />
              <Input label="Company" value={item.company_name} onChange={(event) => setExperience((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, company_name: event.target.value } : entry))} />
            </div>
            <div className={styles.inlineRow}>
              <Input label="Location" value={item.location} onChange={(event) => setExperience((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, location: event.target.value } : entry))} />
              <label className={styles.field}><span>Current role</span><input type="checkbox" checked={item.is_current} onChange={(event) => setExperience((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, is_current: event.target.checked } : entry))} /></label>
            </div>
            <div className={styles.inlineRow}>
              <Input label="Start date" type="date" value={item.start_date} onChange={(event) => setExperience((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, start_date: event.target.value } : entry))} />
              {!item.is_current && <Input label="End date" type="date" value={item.end_date} onChange={(event) => setExperience((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, end_date: event.target.value } : entry))} />}
            </div>
            <label className={styles.field}><span>Description</span><textarea value={item.description} onChange={(event) => setExperience((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, description: event.target.value } : entry))} rows={4} /></label>
            {experience.length > 1 && <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(experience, setExperience, index)}>Remove experience</Button>}
          </div>
        ))}
      </section>

      <section className={styles.sectionBlock}>
        <div className={styles.sectionHeader}><h2>Education</h2><Button type="button" variant="outline" size="sm" onClick={() => pushItem(education, setEducation, emptyEducation())}>Add education</Button></div>
        {education.map((item, index) => (
          <div key={`edu-${index}`} className={styles.repeatCard}>
            <div className={styles.inlineRow}>
              <Input label="Institution" value={item.institution} onChange={(event) => setEducation((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, institution: event.target.value } : entry))} />
              <Input label="Degree" value={item.degree} onChange={(event) => setEducation((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, degree: event.target.value } : entry))} />
            </div>
            <div className={styles.inlineRow}>
              <Input label="Field of study" value={item.field_of_study} onChange={(event) => setEducation((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, field_of_study: event.target.value } : entry))} />
            </div>
            <div className={styles.inlineRow}>
              <Input label="Start date" type="date" value={item.start_date} onChange={(event) => setEducation((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, start_date: event.target.value } : entry))} />
              <Input label="End date" type="date" value={item.end_date} onChange={(event) => setEducation((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, end_date: event.target.value } : entry))} />
            </div>
            <label className={styles.field}><span>Description</span><textarea value={item.description} onChange={(event) => setEducation((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, description: event.target.value } : entry))} rows={3} /></label>
            {education.length > 1 && <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(education, setEducation, index)}>Remove education</Button>}
          </div>
        ))}
      </section>

      <section className={styles.sectionBlock}>
        <div className={styles.sectionHeader}><h2>Certifications</h2><Button type="button" variant="outline" size="sm" onClick={() => pushItem(certifications, setCertifications, emptyCertification())}>Add certification</Button></div>
        {certifications.map((item, index) => (
          <div key={`cert-${index}`} className={styles.repeatCard}>
            <div className={styles.inlineRow}>
              <Input label="Certification name" value={item.name} onChange={(event) => setCertifications((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, name: event.target.value } : entry))} />
              <Input label="Issuing organisation" value={item.issuing_organization} onChange={(event) => setCertifications((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, issuing_organization: event.target.value } : entry))} />
            </div>
            <div className={styles.inlineRow}>
              <Input label="Issue date" type="date" value={item.issue_date} onChange={(event) => setCertifications((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, issue_date: event.target.value } : entry))} />
              <Input label="Expiry date" type="date" value={item.expiry_date} onChange={(event) => setCertifications((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, expiry_date: event.target.value } : entry))} />
            </div>
            <div className={styles.inlineRow}>
              <Input label="Credential ID" value={item.credential_id} onChange={(event) => setCertifications((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, credential_id: event.target.value } : entry))} />
              <Input label="Credential URL" value={item.credential_url} onChange={(event) => setCertifications((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, credential_url: event.target.value } : entry))} />
            </div>
            {certifications.length > 1 && <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(certifications, setCertifications, index)}>Remove</Button>}
          </div>
        ))}
      </section>

      <section className={styles.sectionBlock}>
        <div className={styles.sectionHeader}><h2>Languages</h2><Button type="button" variant="outline" size="sm" onClick={() => pushItem(languages, setLanguages, emptyLanguage())}>Add language</Button></div>
        {languages.map((item, index) => (
          <div key={`lang-${index}`} className={styles.inlineRow}>
            <Input label="Language" value={item.name} onChange={(event) => setLanguages((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, name: event.target.value } : entry))} />
            <label className={styles.field}><span>Proficiency</span><select value={item.proficiency} onChange={(event) => setLanguages((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, proficiency: event.target.value } : entry))}><option>Basic</option><option>Conversational</option><option>Professional</option><option>Fluent</option><option>Native</option></select></label>
            {languages.length > 1 && <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(languages, setLanguages, index)}>Remove</Button>}
          </div>
        ))}
      </section>

      <section className={styles.sectionBlock}>
        <div className={styles.sectionHeader}><h2>Professional links</h2><Button type="button" variant="outline" size="sm" onClick={() => pushItem(links, setLinks, emptyLink())}>Add link</Button></div>
        {links.map((item, index) => (
          <div key={`link-${index}`} className={styles.inlineRow}>
            <Input label="Label" value={item.label} onChange={(event) => setLinks((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, label: event.target.value } : entry))} />
            <Input label="URL" type="url" value={item.url} onChange={(event) => setLinks((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, url: event.target.value } : entry))} />
            {links.length > 1 && <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(links, setLinks, index)}>Remove</Button>}
          </div>
        ))}
      </section>

      <section className={styles.sectionBlock} id="privacy">
        <div className={styles.sectionHeader}><h2>Privacy</h2></div>
        <label className={styles.checkbox}><input type="checkbox" checked={profile.allow_employer_discovery} onChange={(event) => updateField('allow_employer_discovery', event.target.checked)} /><span>Allow eligible employers to discover my profile and CV availability</span></label>
      </section>

      <div className={styles.actions}><SaveButton /></div>
    </form>
  );
}