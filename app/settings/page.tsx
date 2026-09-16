import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';
import { requireRole } from '@/lib/auth/server';
import { SettingsForm } from './settings-form';
import styles from './settings.module.css';

export const metadata = {
  title: 'Profile Settings | CareerSnap',
  description: 'Manage your CareerSnap Job Seeker profile settings.',
};

export default async function SettingsPage() {
  const { supabase, user } = await requireRole('job_seeker');
  const { data: profile } = await supabase.from('profiles').select('email, full_name, headline, bio, location, allow_employer_discovery, availability').eq('id', user.id).maybeSingle();
  const values = profile || { email: user.email || '', full_name: '', headline: '', bio: '', location: '', allow_employer_discovery: false, availability: 'not_specified' };

  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.main}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>Job Seeker settings</p>
          <h1 className={styles.title}>Manage your profile</h1>
          <p className={styles.subtitle}>Keep your professional information current and choose whether employers can discover your profile.</p>
        </header>
        <section className={styles.card} aria-label="Profile settings form">
          <SettingsForm profile={{ email: values.email || user.email || '', full_name: values.full_name || '', headline: values.headline || '', bio: values.bio || '', location: values.location || '', allow_employer_discovery: values.allow_employer_discovery, availability: values.availability || 'not_specified' }} />
        </section>
      </main>
      <Footer />
    </div>
  );
}