'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import styles from './employer-public-header.module.css';

const postJobPath = '/login?next=%2Femployers%2Fpost-job';
const findCvsPath = '/login?next=%2Femployer%2Fcvs';
const registerPath = '/register?role=employer';

export function EmployerPublicHeader() {
  const [open, setOpen] = useState(false);
  const links = <>
    <Link href="/jobs" className={styles.navLink}>Find Jobs</Link>
    <Link href="/resources" className={styles.navLink}>Career Resources</Link>
    <Link href={postJobPath} className={styles.navLink}>Post a Job</Link>
    <Link href={findCvsPath} className={styles.navLink}>Find CVs</Link>
  </>;
  return <header className={styles.header}><div className={styles.container}>
    <Link href="/employers" className={styles.logo} aria-label="CareerSnap employer services"><Image src="/careersnap-logo.png" alt="CareerSnap" width={217} height={48} className={styles.logoImage} priority /></Link>
    <nav className={styles.nav}>{links}</nav>
    <div className={styles.actions}><Link href="/login" className={styles.signIn}>Sign In</Link><Link href={registerPath}><Button size="sm">Create Account</Button></Link></div>
    <button type="button" className={styles.menuButton} onClick={() => setOpen(!open)} aria-label="Toggle employer menu">Menu</button>
  </div>{open && <nav className={styles.mobileNav}>{links}<Link href="/login" className={styles.signIn}>Sign In</Link><Link href={registerPath}><Button fullWidth>Create Account</Button></Link></nav>}</header>;
}