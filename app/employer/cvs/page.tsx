import { requireRole } from '@/lib/auth/server';
import { CandidateSearch } from './candidate-search';
import styles from './cvs.module.css';

export default async function EmployerCvsPage() {
  await requireRole('employer');
  return <div className={styles.page}><main className={styles.container}><header className={styles.header}><p className={styles.eyebrow}>Talent discovery</p><h1 className={styles.title}>Find CVs</h1><p className={styles.subtitle}>Search candidates who have chosen to be discoverable by employers.</p></header><CandidateSearch /></main></div>;
}