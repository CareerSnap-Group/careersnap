'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { Icon } from '@/components/icons';
import styles from './footer.module.css';

const sections = [
  { title: 'Sign in', links: [['/login', 'Sign in']] },
  { title: 'Job Seekers', links: [['/resources', 'Help'], ['/employers', 'Browse companies'], ['/jobs', 'Browse jobs']] },
  { title: 'Employers', links: [['/employers', 'Help Centre'], ['/employers/post-job', 'Post a job'], ['/employers', 'Employer Events']] },
  { title: 'About', links: [['/', 'About']] },
] as const;

export function Footer() {
  const [openSection, setOpenSection] = useState<string | null>(null);
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <Link href="/" className={styles.brand} aria-label="CareerSnap home">
          <Image src="/careersnap-logo.png" alt="CareerSnap" width={217} height={48} className={styles.brandImage} />
        </Link>
        <nav className={styles.navigation} aria-label="Footer navigation">
          {sections.map((section) => {
            const isOpen = openSection === section.title;
            return (
              <section key={section.title} className={styles.section}>
                <button
                  type="button"
                  className={styles.sectionTrigger}
                  aria-expanded={isOpen}
                  aria-controls={`footer-${section.title.toLowerCase().replace(/ /g, '-')}`}
                  onClick={() => setOpenSection(isOpen ? null : section.title)}
                >
                  <span>{section.title}</span>
                  <Icon name="chevron-down" className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`} />
                </button>
                <ul id={`footer-${section.title.toLowerCase().replace(/ /g, '-')}`} className={`${styles.links} ${isOpen ? styles.linksOpen : ''}`}>
                  {section.links.map(([href, label]) => <li key={label}><Link href={href}>{label}</Link></li>)}
                </ul>
              </section>
            );
          })}
        </nav>
      </div>
      <div className={styles.bottom}>
        <p>&copy; {year} CareerSnap. All rights reserved.</p>
        <nav className={styles.legal} aria-label="Legal navigation">
          <Link href="/">Policies</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/cookies">Cookies</Link>
        </nav>
      </div>
    </footer>
  );
}
