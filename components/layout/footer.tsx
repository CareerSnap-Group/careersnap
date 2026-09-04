import Link from 'next/link';
import Image from 'next/image';
import styles from './footer.module.css';

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        {/* Brand Section */}
        <div className={styles.section}>
          <Link href="/" className={styles.brand} aria-label="CareerSnap home">
            <Image src="/careersnap-logo.png" alt="CareerSnap" width={217} height={48} className={styles.brandImage} />
          </Link>
          <p className={styles.tagline}>Find work that moves your career forward.</p>
        </div>

        {/* Job Seekers */}
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Job Seekers</h4>
          <ul className={styles.links}>
            <li>
              <Link href="/jobs">Find Jobs</Link>
            </li>
            <li>
              <Link href="/resources">Career Resources</Link>
            </li>
          </ul>
        </div>

        {/* Employers */}
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Employers</h4>
          <ul className={styles.links}>
            <li>
              <Link href="/employers">Post a Job</Link>
            </li>
            <li>
              <Link href="/employers">Employer Solutions</Link>
            </li>
            <li>
              <Link href="/employers/pricing">Pricing</Link>
            </li>
          </ul>
        </div>

        {/* Company */}
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Company</h4>
          <ul className={styles.links}>
            <li>
              <Link href="/about">About</Link>
            </li>
            <li>
              <Link href="/careers">Careers</Link>
            </li>
            <li>
              <Link href="/contact">Contact</Link>
            </li>
          </ul>
        </div>

        {/* Legal */}
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Legal</h4>
          <ul className={styles.links}>
            <li>
              <Link href="/privacy">Privacy Policy</Link>
            </li>
            <li>
              <Link href="/terms">Terms of Service</Link>
            </li>
            <li>
              <Link href="/cookies">Cookie Policy</Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom */}
      <div className={styles.bottom}>
        <p>&copy; 2024 CareerSnap. All rights reserved.</p>
      </div>
    </footer>
  );
}
