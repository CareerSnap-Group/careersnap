import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import styles from './profile.module.css';
import { ResumeManager } from './resume-manager';
import { requireRole } from '@/lib/auth/server';
import { getJobSeekerProfileData } from '@/lib/profile-data';

export default async function ProfilePage() {
  const { user } = await requireRole('job_seeker');
  const data = await getJobSeekerProfileData(user.id);
  const profile = data.profile;

  return (
    <div className={styles.page}>
      <Header />
      <div className={styles.container}>
        <div className={styles.profileHeader}>
          <div className={styles.profileInfo}>
            <div className={styles.avatar}>{(profile.full_name || profile.first_name || 'C')[0]?.toUpperCase() || 'C'}</div>
            <div>
              <h1 className={styles.name}>{profile.full_name || [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'CareerSnap Candidate'}</h1>
              <p className={styles.headline}>{profile.professional_headline || profile.headline || 'Professional profile'}</p>
              <p className={styles.location}>{profile.location || 'Location not specified'}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link href="/settings"><Button variant="outline">Edit profile</Button></Link>
            <Link href="/settings#privacy"><Button variant="secondary">Preview privacy</Button></Link>
          </div>
        </div>

        <div className={styles.completionCard}>
          <div className={styles.completionHeader}>
            <h3 className={styles.completionTitle}>Profile completion</h3>
            <span className={styles.completionPercent}>{data.completion}%</span>
          </div>
          <div className={styles.progressBar}>
            <div className={styles.progress} style={{ width: `${data.completion}%` }}></div>
          </div>
          {data.missingSections.length > 0 ? (
            <p className={styles.completionHint}>Missing: {data.missingSections.join(', ')}. <Link href="/settings">Complete your profile</Link>.</p>
          ) : (
            <p className={styles.completionHint}>Your profile is complete and ready for employers to review.</p>
          )}
        </div>

        <div className={styles.contentLayout}>
          <div className={styles.mainContent}>
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Professional summary</h2>
              <Card>
                <p className={styles.summary}>{profile.bio || 'Add a short professional summary to help employers understand your background and strengths.'}</p>
              </Card>
            </section>

            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Skills</h2>
                <Link href="/settings"><Button variant="ghost" size="sm">Edit</Button></Link>
              </div>
              <Card>
                <div className={styles.skillsGrid}>
                  {data.skills.length > 0 ? data.skills.map((skill) => <Badge key={skill.id || skill.name} variant="primary">{skill.name}</Badge>) : <p className={styles.summary}>No skills added yet.</p>}
                </div>
              </Card>
            </section>

            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Experience</h2>
                <Link href="/settings"><Button variant="ghost" size="sm">Edit</Button></Link>
              </div>
              <div className={styles.experiences}>
                {data.experience.length > 0 ? data.experience.map((exp) => (
                  <Card key={exp.id || `${exp.job_title}-${exp.company_name}`} className={styles.experienceCard}>
                    <div className={styles.expHeader}>
                      <h3 className={styles.expTitle}>{exp.job_title}</h3>
                      {exp.is_current && <Badge variant="success">Current</Badge>}
                    </div>
                    <p className={styles.expCompany}>{exp.company_name}</p>
                    <p className={styles.expDates}>{exp.start_date ? new Date(exp.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Unknown'} {exp.is_current ? '— Present' : exp.end_date ? `— ${new Date(exp.end_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}` : ''}</p>
                    {exp.description && <p className={styles.expDescription}>{exp.description}</p>}
                  </Card>
                )) : <Card className={styles.experienceCard}><p className={styles.summary}>Add your work history to show employers your experience.</p></Card>}
              </div>
            </section>

            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Education</h2>
                <Link href="/settings"><Button variant="ghost" size="sm">Edit</Button></Link>
              </div>
              <div className={styles.educations}>
                {data.education.length > 0 ? data.education.map((edu) => (
                  <Card key={edu.id || `${edu.institution}-${edu.degree}`} className={styles.educationCard}>
                    <h3 className={styles.eduInstitution}>{edu.institution}</h3>
                    <p className={styles.eduQualification}>{[edu.degree, edu.field_of_study].filter(Boolean).join(' · ') || 'Qualification not specified'}</p>
                    <p className={styles.eduDates}>{edu.start_date ? new Date(edu.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Unknown'} {edu.end_date ? `— ${new Date(edu.end_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}` : ''}</p>
                  </Card>
                )) : <Card className={styles.educationCard}><p className={styles.summary}>Add your education details to strengthen your profile.</p></Card>}
              </div>
            </section>
          </div>

          <aside className={styles.sidebar}>
            <Card className={styles.sidebarCard}>
              <h3 className={styles.cardTitle}>Contact and visibility</h3>
              <div className={styles.contactInfo}>
                <div><p className={styles.contactLabel}>Email</p><p className={styles.contactValue}>{profile.email || 'Not shared publicly'}</p></div>
                {profile.phone && <div><p className={styles.contactLabel}>Phone</p><p className={styles.contactValue}>{profile.phone}</p></div>}
                {profile.location && <div><p className={styles.contactLabel}>Location</p><p className={styles.contactValue}>{profile.location}</p></div>}
                <div><p className={styles.contactLabel}>Employer visibility</p><p className={styles.contactValue}>{profile.allow_employer_discovery ? 'Visible to eligible employers' : 'Private'}</p></div>
              </div>
            </Card>

            <Card className={styles.sidebarCard}>
              <h3 className={styles.cardTitle}>Professional preview</h3>
              <p className={styles.cvDescription}>Visible to employers: name, headline, summary, skills, experience, education, location, availability, and CV if enabled.</p>
              <div className={styles.nextSteps}>
                <div className={styles.step}><span className={styles.stepNumber}>1</span><span className={styles.stepText}>{data.publicSummary.displayName}</span></div>
                <div className={styles.step}><span className={styles.stepNumber}>2</span><span className={styles.stepText}>{data.publicSummary.headline}</span></div>
                <div className={styles.step}><span className={styles.stepNumber}>3</span><span className={styles.stepText}>{data.publicSummary.availability}</span></div>
              </div>
            </Card>

            <Card className={styles.sidebarCard}>
              <h3 className={styles.cardTitle}>CV/Resume</h3>
              <p className={styles.cvDescription}>Applicants can upload a CV and use it when applying for jobs.</p>
              <ResumeManager />
            </Card>
          </aside>
        </div>
      </div>
      <Footer />
    </div>
  );
}
