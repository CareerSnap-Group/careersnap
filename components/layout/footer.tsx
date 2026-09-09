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
  { title: 'About', links: [['/about', 'About']] },
] as const;

const socialLinks = [
  { name: 'Facebook', href: 'https://www.facebook.com/careersnaphq', icon: 'facebook' },
  { name: 'Instagram', href: 'https://www.instagram.com/careersnaphq', icon: 'instagram' },
  { name: 'X', href: 'https://x.com/careersnaphq', icon: 'x' },
  { name: 'TikTok', href: 'https://www.tiktok.com/@careersnaphq', icon: 'tiktok' },
  { name: 'YouTube', href: 'https://www.youtube.com/@careersnaphq', icon: 'youtube' },
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
        <section className={styles.socialSection} aria-labelledby="footer-social-title">
          <h2 id="footer-social-title" className={styles.socialTitle}>Let&apos;s connect</h2>
          <nav className={styles.socialLinks} aria-label="CareerSnap social media">
            {socialLinks.map((social) => (
              <a
                key={social.name}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialLink}
                aria-label={social.name}
              >
                <Icon name={social.icon} size={20} />
              </a>
            ))}
          </nav>
        </section>
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
