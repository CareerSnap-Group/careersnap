'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { mockUserProfile } from '@/lib/mock-data';
import styles from './profile.module.css';
import { createClient } from '@/lib/supabase/browser';
import { fetchProfile } from '@/lib/supabase/data';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export default function ProfilePage() {
  const [profile, setProfile] = useState(mockUserProfile);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    createClient().auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const remoteProfile = await fetchProfile(data.user.id);
      if (remoteProfile) setProfile(remoteProfile);
    });
  }, []);

  return (
    <div className={styles.page}>
      <Header />

      <div className={styles.container}>
        {/* Profile Header */}
        <div className={styles.profileHeader}>
          <div className={styles.profileInfo}>
            <div className={styles.avatar}>{profile.firstName[0]}</div>
            <div>
              <h1 className={styles.name}>
                {profile.firstName} {profile.lastName}
              </h1>
              <p className={styles.headline}>{profile.headline}</p>
              <p className={styles.location}>📍 {profile.location}</p>
            </div>
          </div>
          <Link href="/settings">
            <Button variant="outline">Edit Profile</Button>
          </Link>
        </div>

        {/* Profile Completion */}
        <div className={styles.completionCard}>
          <div className={styles.completionHeader}>
            <h3 className={styles.completionTitle}>Profile Completeness</h3>
            <span className={styles.completionPercent}>{profile.profileCompletion}%</span>
          </div>
          <div className={styles.progressBar}>
            <div className={styles.progress} style={{ width: `${profile.profileCompletion}%` }}></div>
          </div>
          <p className={styles.completionHint}>Complete your profile to improve job recommendations and visibility.</p>
        </div>

        <div className={styles.contentLayout}>
          {/* Main Content */}
          <div className={styles.mainContent}>
            {/* Professional Summary */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Professional Summary</h2>
              <Card>
                <p className={styles.summary}>{profile.summary}</p>
              </Card>
            </section>

            {/* Skills */}
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Skills</h2>
                <Link href="/settings">
                  <Button variant="ghost" size="sm">
                    Edit
                  </Button>
                </Link>
              </div>
              <Card>
                <div className={styles.skillsGrid}>
                  {profile.skills.map((skill) => (
                    <Badge key={skill} variant="primary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </Card>
            </section>

            {/* Experience */}
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Experience</h2>
                <Link href="/settings">
                  <Button variant="ghost" size="sm">
                    Edit
                  </Button>
                </Link>
              </div>
              <div className={styles.experiences}>
                {profile.experience.map((exp) => (
                  <Card key={exp.id} className={styles.experienceCard}>
                    <div className={styles.expHeader}>
                      <h3 className={styles.expTitle}>{exp.jobTitle}</h3>
                      {exp.isCurrent && <Badge variant="success">Current</Badge>}
                    </div>
                    <p className={styles.expCompany}>{exp.company}</p>
                    <p className={styles.expDates}>
                      {exp.startDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                      {' — '}
                      {exp.isCurrent
                        ? 'Present'
                        : exp.endDate?.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                    </p>
                    {exp.description && <p className={styles.expDescription}>{exp.description}</p>}
                  </Card>
                ))}
              </div>
            </section>

            {/* Education */}
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Education</h2>
                <Link href="/settings">
                  <Button variant="ghost" size="sm">
                    Edit
                  </Button>
                </Link>
              </div>
              <div className={styles.educations}>
                {profile.education.map((edu) => (
                  <Card key={edu.id} className={styles.educationCard}>
                    <h3 className={styles.eduInstitution}>{edu.institution}</h3>
                    <p className={styles.eduQualification}>
                      {edu.qualification}
                      {edu.field && ` in ${edu.field}`}
                    </p>
                    <p className={styles.eduDates}>
                      {edu.startDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                      {' — '}
                      {edu.isCurrent ? 'Present' : edu.endDate?.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                    </p>
                  </Card>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <aside className={styles.sidebar}>
            {/* Contact Information */}
            <Card className={styles.sidebarCard}>
              <h3 className={styles.cardTitle}>Contact Information</h3>
              <div className={styles.contactInfo}>
                <div>
                  <p className={styles.contactLabel}>Email</p>
                  <p className={styles.contactValue}>{profile.email}</p>
                </div>
                {profile.phone && (
                  <div>
                    <p className={styles.contactLabel}>Phone</p>
                    <p className={styles.contactValue}>{profile.phone}</p>
                  </div>
                )}
                {profile.location && (
                  <div>
                    <p className={styles.contactLabel}>Location</p>
                    <p className={styles.contactValue}>{profile.location}</p>
                  </div>
                )}
              </div>
            </Card>

            {/* CV/Resume */}
            <Card className={styles.sidebarCard}>
              <h3 className={styles.cardTitle}>CV/Resume</h3>
              <p className={styles.cvDescription}>Upload your CV to include it in job applications.</p>
              <div className={styles.cvUpload}>
                <label className={styles.uploadBox}>
                  <input type="file" accept=".pdf,.doc,.docx" hidden />
                  <span>📄 Choose file</span>
                </label>
              </div>
              <p className={styles.cvHint}>PDF, DOC, or DOCX up to 5MB</p>
            </Card>

            {/* Next Steps */}
            <Card className={styles.sidebarCard}>
              <h3 className={styles.cardTitle}>Next Steps</h3>
              <div className={styles.nextSteps}>
                <div className={styles.step}>
                  <span className={styles.stepNumber}>✓</span>
                  <span className={styles.stepText}>Profile created</span>
                </div>
                <div className={styles.step}>
                  <span className={styles.stepNumber}>2</span>
                  <span className={styles.stepText}>Upload CV</span>
                </div>
                <div className={styles.step}>
                  <span className={styles.stepNumber}>3</span>
                  <span className={styles.stepText}>Start applying</span>
                </div>
              </div>
            </Card>
          </aside>
        </div>
      </div>

      <Footer />
    </div>
  );
}
