'use client';

import Link from 'next/link';
import { useState } from 'react';
import styles from './header.module.css';
import { Button } from '@/components/ui/button';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        {/* Logo */}
        <Link href="/" className={styles.logo}>
          <span className={styles.logoIcon}>📸</span>
          <span className={styles.logoText}>CareerSnap</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className={styles.desktopNav}>
          <Link href="/jobs" className={styles.navLink}>
            Find Jobs
          </Link>
          <Link href="/resources" className={styles.navLink}>
            Career Resources
          </Link>
          <Link href="/saved-jobs" className={styles.navLink}>
            Saved Jobs
          </Link>
          <Link href="/applications" className={styles.navLink}>
            Applications
          </Link>
          <Link href="/profile" className={styles.navLink}>
            Profile
          </Link>
        </nav>

        {/* Auth Actions */}
        <div className={styles.actions}>
          <Link href="/login" className={styles.signInLink}>
            Sign In
          </Link>
          <Link href="/register">
            <Button size="sm">Create Account</Button>
          </Link>
          <Link href="/employers" className={styles.employersLink}>
            For Employers
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button className={styles.mobileMenuButton} onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle mobile menu">
          <span className={styles.menuIcon}></span>
          <span className={styles.menuIcon}></span>
          <span className={styles.menuIcon}></span>
        </button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <nav className={styles.mobileNav}>
          <Link href="/jobs" className={styles.mobileNavLink}>
            Find Jobs
          </Link>
          <Link href="/resources" className={styles.mobileNavLink}>
            Career Resources
          </Link>
          <Link href="/saved-jobs" className={styles.mobileNavLink}>
            Saved Jobs
          </Link>
          <Link href="/applications" className={styles.mobileNavLink}>
            Applications
          </Link>
          <Link href="/profile" className={styles.mobileNavLink}>
            Profile
          </Link>
          <div className={styles.mobileActions}>
            <Link href="/login" className={styles.mobileSignIn}>
              Sign In
            </Link>
            <Link href="/register">
              <Button fullWidth>Create Account</Button>
            </Link>
            <Link href="/employers" className={styles.mobileEmployers}>
              For Employers
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
