import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';
import { requireRole } from '@/lib/auth/server';
import { SettingsForm } from './settings-form';
import styles from './settings.module.css';
import { DeleteAccount } from '@/components/account/delete-account';
import { getJobSeekerProfileData } from '@/lib/profile-data';

export const metadata = {
  title: 'Profile Settings | CareerSnap',
  description: 'Manage your CareerSnap Job Seeker profile settings.',
};

export default async function SettingsPage() {
  const { user } = await requireRole('job_seeker');
  const data = await getJobSeekerProfileData(user.id);

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
          <SettingsForm initialProfile={data} />
          <DeleteAccount />
        </section>
      </main>
      <Footer />
    </div>
  );
}