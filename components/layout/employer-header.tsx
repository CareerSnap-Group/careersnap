'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';
import { Button } from '@/components/ui/button';
import styles from './employer-header.module.css';

const links = [
  ['/employer/dashboard', 'Dashboard'], ['/employers/post-job', 'Post a Job'], ['/employer/cvs', 'Find CVs'],
  ['/employer/jobs', 'Jobs'], ['/employer/applications', 'Applications'],
  ['/employer/company', 'Company'], ['/employer/packages', 'Packages'], ['/employer/billing', 'Billing'],
] as const;

export function EmployerHeader() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const signOut = async () => { await createClient().auth.signOut(); router.push('/login'); router.refresh(); };
  const navigation = links.map(([href, label]) => <Link key={href} href={href} className={styles.navLink} onClick={() => setOpen(false)}>{label}</Link>);
  return <header className={styles.header}><div className={styles.container}>
    <Link href="/employer/dashboard" className={styles.logo} aria-label="CareerSnap employer dashboard"><Image src="/careersnap-logo.png" alt="CareerSnap" width={217} height={48} className={styles.logoImage} priority /></Link>
    <nav className={styles.nav}>{navigation}<Button size="sm" className={styles.signOut} onClick={signOut}>Sign Out</Button></nav>
    <button type="button" className={styles.menuButton} onClick={() => setOpen(!open)} aria-label="Toggle employer menu">Menu</button>
  </div>{open && <nav className={styles.mobileNav}>{navigation}<Button className={styles.signOut} onClick={signOut}>Sign Out</Button></nav>}</header>;
}