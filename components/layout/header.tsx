'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useEffect } from 'react';
import styles from './header.module.css';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/icons';
import { createClient } from '@/lib/supabase/browser';
import { isSupabaseConfigured } from '@/lib/supabase/config';

function getInitials(name: string) {
  const initials = name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase());
  return initials.join('') || 'U';
}

export function Header({ variant }: { variant?: 'landing' }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [role, setRole] = useState<'job_seeker' | 'employer' | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setSignedIn(false);
      return;
    }

    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      setSignedIn(Boolean(data.user));
      if (data.user) {
        const { data: profile } = await supabase.from('profiles').select('user_type, full_name, profile_photo_url').eq('id', data.user.id).maybeSingle();
        setRole(profile?.user_type || null);
        setDisplayName(profile?.full_name || data.user.user_metadata?.full_name || data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'CareerSnap Member');
        setProfilePhotoUrl(profile?.profile_photo_url || null);
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSignedIn(Boolean(session?.user));
      if (!session?.user) {
        setRole(null);
        setDisplayName('');
        setProfilePhotoUrl(null);
        return;
      }
      const { data: profile } = await supabase.from('profiles').select('user_type, full_name, profile_photo_url').eq('id', session.user.id).maybeSingle();
      setRole(profile?.user_type || null);
      setDisplayName(profile?.full_name || session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'CareerSnap Member');
      setProfilePhotoUrl(profile?.profile_photo_url || null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await createClient().auth.signOut();
    setSignedIn(false);
    setRole(null);
  };

  return (
    <header className={`${styles.header} ${variant === 'landing' ? styles.landingHeader : ''}`}>
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
          {(signedIn === false || (signedIn === true && role === 'job_seeker')) && <>
            <Link href="/jobs" className={styles.navLink}>Find Jobs</Link>
            <Link href="/resources" className={styles.navLink}>Career Resources</Link>
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
            <Link href="/login" className={styles.mobileSignInControl} aria-label="Sign In">
              <span>Sign In</span>
              <Icon name="user" size={17} />
              <Icon name="chevron-down" size={13} />
            </Link>
          ) : null}
          <button className={styles.mobileMenuButton} onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle mobile menu">
            <span className={styles.menuIcon}></span>
            <span className={styles.menuIcon}></span>
            <span className={styles.menuIcon}></span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <nav className={styles.mobileNav}>
          {(signedIn === false || (signedIn === true && role === 'job_seeker')) && <>
            <Link href="/jobs" className={styles.mobileNavLink}>Find Jobs</Link>
            <Link href="/resources" className={styles.mobileNavLink}>Career Resources</Link>
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
