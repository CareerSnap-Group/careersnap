import { EmployerHeader as Header } from '@/components/layout/employer-header';
import { Footer } from '@/components/layout/footer';
import { JobForm } from './job-form';
import styles from './post-job.module.css';

export default function PostJobPage() {
  return <div className={styles.page}><Header /><div className={styles.container}><div className={styles.header}><h1 className={styles.title}>Post a Job</h1><p className={styles.subtitle}>Create a job listing for your company.</p></div><JobForm mode="create" /></div><Footer /></div>;
}
