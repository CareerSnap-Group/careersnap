'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useEffect } from 'react';
import styles from './header.module.css';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/browser';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setSignedIn(false);
      return;
    }

    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setSignedIn(Boolean(data.user)));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setSignedIn(Boolean(session?.user)));
    return () => listener.subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await createClient().auth.signOut();
    setSignedIn(false);
  };

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        {/* Logo */}
        <Link href="/" className={styles.logo} aria-label="CareerSnap home">
          <Image
            src="/careersnap-logo.png"
            alt="CareerSnap"
            width={217}
            height={48}
            className={styles.logoImage}
            priority
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className={styles.desktopNav}>
          <Link href="/jobs" className={styles.navLink}>
            Find Jobs
          </Link>
          <Link href="/resources" className={styles.navLink}>
            Career Resources
          </Link>
          {signedIn && (
            <>
              <Link href="/saved-jobs" className={styles.navLink}>Saved Jobs</Link>
              <Link href="/applications" className={styles.navLink}>Applications</Link>
              <Link href="/profile" className={styles.navLink}>Profile</Link>
            </>
          )}
        </nav>

        {/* Auth Actions */}
        <div className={styles.actions}>
          {signedIn === true ? (
            <Button variant="ghost" size="sm" onClick={handleSignOut}>Sign Out</Button>
          ) : (
            <>
              <Link href="/login" className={styles.signInLink}>Sign In</Link>
              <Link href="/register"><Button size="sm">Create Account</Button></Link>
            </>
          )}
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
          {signedIn && (
            <>
              <Link href="/saved-jobs" className={styles.mobileNavLink}>Saved Jobs</Link>
              <Link href="/applications" className={styles.mobileNavLink}>Applications</Link>
              <Link href="/profile" className={styles.mobileNavLink}>Profile</Link>
            </>
          )}
          <div className={styles.mobileActions}>
            {signedIn === true ? (
              <Button variant="ghost" fullWidth onClick={handleSignOut}>Sign Out</Button>
            ) : (
              <>
                <Link href="/login" className={styles.mobileSignIn}>Sign In</Link>
                <Link href="/register"><Button fullWidth>Create Account</Button></Link>
              </>
            )}
            <Link href="/employers" className={styles.mobileEmployers}>
              For Employers
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
