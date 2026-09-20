'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import styles from './header.module.css';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/icons';
import { createClient } from '@/lib/supabase/browser';
import { useAccountRole } from './use-account-role';

function getInitials(name: string) {
  const initials = name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase());
  return initials.join('') || 'U';
}

export function Header({ variant }: { variant?: 'landing' }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { signedIn, role, displayName, profilePhotoUrl } = useAccountRole();
  const mobileLogoSrc = '/CareerSnap-Mobile-Logo.png';

  const handleSignOut = async () => {
    await createClient().auth.signOut();
  };

  return (
    <header className={`${styles.header} ${variant === 'landing' ? styles.landingHeader : ''}`}>
      <div className={styles.container}>
        {/* Logo */}
        <Link href="/" className={styles.logo} aria-label="CareerSnap home">
          <Image
            src={mobileLogoSrc}
            alt="CareerSnap"
            width={217}
            height={48}
            className={styles.logoImage}
            priority
          />
          <Image
            src={mobileLogoSrc}
            alt="CareerSnap"
            width={217}
            height={48}
            className={styles.mobileLogoImage}
            priority
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className={styles.desktopNav}>
          {(signedIn === false || (signedIn === true && role === 'job_seeker')) && <>
            <Link href="/jobs" className={styles.navLink}>Find Jobs</Link>
            <Link href="/resources" className={styles.navLink}>Career Resources</Link>
            <Link href="/companies" className={styles.navLink}>Companies</Link>
          </>}
          {signedIn && role === 'job_seeker' && (
            <>
              <Link href="/saved-jobs" className={styles.navLink}>Saved Jobs</Link>
              <Link href="/applications" className={styles.navLink}>Applications</Link>
              <Link href="/profile" className={styles.navLink}>Profile</Link>
            </>
          )}
          {signedIn && role === 'employer' && (
            <>
              <Link href="/employer/dashboard" className={styles.navLink}>Employer Dashboard</Link>
              <Link href="/employers/post-job" className={styles.navLink}>Post a Job</Link>
              <Link href="/employer/jobs" className={styles.navLink}>Jobs</Link>
              <Link href="/employer/applications" className={styles.navLink}>Applications</Link>
              <Link href="/employer/company" className={styles.navLink}>Company</Link>
              <Link href="/employer/packages" className={styles.navLink}>Packages</Link>
              <Link href="/employer/billing" className={styles.navLink}>Billing</Link>
            </>
          )}
        </nav>

        {/* Auth Actions */}
        <div className={styles.actions}>
          <Link href="/jobs" className={styles.desktopSearchLink} aria-label="Search jobs">
            <Icon name="search" size={20} />
          </Link>
          {signedIn === true ? (
            <Button variant="ghost" size="sm" onClick={handleSignOut}>Sign Out</Button>
          ) : (
            <>
              <Link href="/login" className={styles.signInLink}>Sign In</Link>
              <Link href="/register"><Button size="sm">Create Account</Button></Link>
            </>
          )}
          {signedIn === false && <Link href="/employers" className={styles.employersLink}>For Employers</Link>}
        </div>

        <div className={styles.mobileHeaderActions}>
          <button
            type="button"
            className={styles.mobileMenuButton}
            onClick={() => setMobileMenuOpen((isOpen) => !isOpen)}
            aria-label="Toggle mobile menu"
            aria-expanded={mobileMenuOpen}
          >
            <span className={styles.menuIcon}></span>
            <span className={styles.menuIcon}></span>
            <span className={styles.menuIcon}></span>
          </button>
          <Link href="/jobs" className={styles.mobileSearchLink} aria-label="Search jobs">
            <Icon name="search" size={20} />
          </Link>
          {signedIn === true ? (
            <Link
              href="/profile"
              className={styles.mobileProfileLink}
              aria-label="Open profile"
              title={displayName || 'Open profile'}
            >
              {profilePhotoUrl ? (
                <span className={styles.mobileAvatarImage} style={{ backgroundImage: `url(${profilePhotoUrl})` }} role="img" aria-label="Profile photo" />
              ) : (
                <span className={styles.mobileAvatarInitials}>{getInitials(displayName)}</span>
              )}
            </Link>
          ) : signedIn === false ? (
            <Link href="/login" className={styles.mobileSignInControl} aria-label="Sign in">
              <Icon name="user" size={20} />
            </Link>
          ) : null}
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <nav className={styles.mobileNav}>
          {(signedIn === false || (signedIn === true && role === 'job_seeker')) && <>
            <Link href="/jobs" className={styles.mobileNavLink}>Find Jobs</Link>
            <Link href="/resources" className={styles.mobileNavLink}>Career Resources</Link>
            <Link href="/companies" className={styles.mobileNavLink}>Companies</Link>
          </>}
          {signedIn && role === 'job_seeker' && (
            <>
              <Link href="/saved-jobs" className={styles.mobileNavLink}>Saved Jobs</Link>
              <Link href="/applications" className={styles.mobileNavLink}>Applications</Link>
              <Link href="/profile" className={styles.mobileNavLink}>Profile</Link>
            </>
          )}
          {signedIn && role === 'employer' && (
            <>
              <Link href="/employer/dashboard" className={styles.mobileNavLink}>Employer Dashboard</Link>
              <Link href="/employers/post-job" className={styles.mobileNavLink}>Post a Job</Link>
              <Link href="/employer/jobs" className={styles.mobileNavLink}>Jobs</Link>
              <Link href="/employer/applications" className={styles.mobileNavLink}>Applications</Link>
              <Link href="/employer/company" className={styles.mobileNavLink}>Company</Link>
              <Link href="/employer/packages" className={styles.mobileNavLink}>Packages</Link>
              <Link href="/employer/billing" className={styles.mobileNavLink}>Billing</Link>
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
            {signedIn === false && <Link href="/employers" className={styles.mobileEmployers}>For Employers</Link>}
          </div>
        </nav>
      )}
    </header>
  );
}
