import { getEmployerContext } from '@/lib/auth/server';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Card } from '@/components/ui/card';
import styles from '../../applications/applications.module.css';

export default async function EmployerCompanyPage() {
  const { membership } = await getEmployerContext();
  const companyMembership = membership as unknown as { companies: { name: string; description: string | null; location: string | null; website: string | null } | null } | null;
  const company = companyMembership?.companies;
  return <><Header /><main className={styles.page}><div className={styles.container}><header className={styles.header}><h1 className={styles.title}>Company Profile</h1><p className={styles.subtitle}>The company associated with your employer account.</p></header><Card className={styles.legendCard}>{company ? <><h2 className={styles.legendTitle}>{company.name}</h2><p>{company.description || 'Add a company description to help candidates understand your organization.'}</p><p>{company.location || 'Location not provided'}</p></> : <><h2 className={styles.legendTitle}>Company setup</h2><p>Your company will be created when you post your first job.</p></>}</Card></div></main><Footer /></>;
}