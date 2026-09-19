import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Card } from '@/components/ui/card';
import { RatingSummary } from '@/components/companies/rating-summary';
import { getCompanyDirectory } from '@/lib/companies';
import styles from './companies.module.css';

export const metadata = { title: 'Companies | CareerSnap' };

export default async function CompaniesPage() {
  const companies = await getCompanyDirectory();
  return <div className={styles.page}><Header /><main className={styles.container}>
    <header className={styles.intro}><p className={styles.eyebrow}>CareerSnap directory</p><h1 className={styles.title}>Companies</h1><p className={styles.description}>Explore companies registered on CareerSnap and discover their current opportunities.</p></header>
    {companies.length === 0 ? <div className={styles.empty}>No companies are available yet.</div> : <div className={styles.grid}>
      {companies.map((company) => <Card key={company.id} className={styles.card} hoverable>
        <div className={styles.cardTop}>
          {company.logo_url ? <div className={styles.logo} style={{ backgroundImage: `url(${company.logo_url})` }} role="img" aria-label={`${company.name} logo`} /> : <div className={styles.logoFallback} aria-hidden="true">{company.name.slice(0, 1).toUpperCase()}</div>}
          <div><h2 className={styles.companyName}>{company.name}</h2>{company.industry && <p className={styles.industry}>{company.industry}</p>}</div>
        </div>
        {company.description && <p className={styles.cardDescription}>{company.description}</p>}
        {company.location && <p className={styles.meta}>{company.location}</p>}
        <div className={styles.summary}><RatingSummary average={company.rating.average} count={company.rating.count} /></div>
        <div className={styles.cardFooter}><span className={styles.jobs}>{company.activeJobCount} active {company.activeJobCount === 1 ? 'job' : 'jobs'}</span><Link href={`/companies/${company.id}`} className={styles.link}>View company</Link></div>
      </Card>)}
    </div>}
  </main><Footer /></div>;
}
