'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';
import { Icon } from '@/components/icons';
import { NotificationBell } from './notification-bell';
import styles from './authenticated-app-shell.module.css';

type AppRole = 'job_seeker' | 'employer';
type NavigationItem = { href: string; label: string; icon: 'bar-chart' | 'briefcase' | 'calendar' | 'heart' | 'user' | 'search' };

const seekerNavigation: NavigationItem[] = [
  { href: '/job-seeker/dashboard', label: 'Home', icon: 'bar-chart' },
  { href: '/jobs', label: 'Jobs', icon: 'briefcase' },
  { href: '/applications', label: 'Applications', icon: 'calendar' },
  { href: '/profile', label: 'Profile', icon: 'user' },
];

const employerNavigation: NavigationItem[] = [
  { href: '/employer/dashboard', label: 'Home', icon: 'bar-chart' },
  { href: '/employer/jobs', label: 'Jobs', icon: 'briefcase' },
  { href: '/employer/cvs', label: 'Candidates', icon: 'search' },
  { href: '/employer/company', label: 'Company', icon: 'user' },
];

export function AuthenticatedAppShell({
  role,
  userId,
  displayName,
  avatarUrl,
  children,
}: {
  role: AppRole;
  userId: string;
  displayName: string;
  avatarUrl?: string | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const navigation = role === 'job_seeker' ? seekerNavigation : employerNavigation;
  const profileHref = role === 'job_seeker' ? '/profile' : '/employer/company';
  const searchHref = role === 'job_seeker' ? '/jobs' : '/employer/cvs';
  const initials = displayName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'C';

  const signOut = async () => {
    await createClient().auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const navigationItems = (items: NavigationItem[], className: string) => items.map((item) => {
    const active = pathname === item.href || (item.href !== '/job-seeker/dashboard' && item.href !== '/employer/dashboard' && pathname.startsWith(`${item.href}/`));
    return (
      <Link key={item.href} href={item.href} className={`${className} ${active ? styles.active : ''}`} aria-current={active ? 'page' : undefined}>
        <Icon name={item.icon} size={20} />
        <span>{item.label}</span>
      </Link>
    );
  });

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar} aria-label={`${role === 'job_seeker' ? 'Job Seeker' : 'Employer'} navigation`}>
        <Link href={role === 'job_seeker' ? '/job-seeker/dashboard' : '/employer/dashboard'} className={styles.brand} aria-label="CareerSnap home">
          <Image src="/careersnap-pro-logo.png" alt="CareerSnap" width={217} height={48} priority />
        </Link>
        <div className={styles.sidebarProfile}>
          <span className={styles.avatar} style={avatarUrl ? { backgroundImage: `url(${avatarUrl})` } : undefined}>{avatarUrl ? null : initials}</span>
          <span className={styles.sidebarIdentity}><strong>{displayName}</strong><small>{role === 'job_seeker' ? 'Job Seeker' : 'Employer'}</small></span>
        </div>
        <nav className={styles.sidebarNav}>{navigationItems(navigation, styles.sidebarLink)}</nav>
        <nav className={styles.secondaryNav} aria-label="More options">
          {role === 'job_seeker' ? (
            <>
              <Link href="/saved-jobs" className={`${styles.sidebarLink} ${pathname.startsWith('/saved-jobs') ? styles.active : ''}`}><Icon name="heart" size={19} /><span>Saved Jobs</span></Link>
              <Link href="/settings" className={`${styles.sidebarLink} ${pathname.startsWith('/settings') ? styles.active : ''}`}><Icon name="user" size={19} /><span>Settings</span></Link>
            </>
          ) : (
            <>
              <Link href="/employer/applications" className={`${styles.sidebarLink} ${pathname.startsWith('/employer/applications') ? styles.active : ''}`}><Icon name="calendar" size={19} /><span>Applications</span></Link>
              <Link href="/employer/packages" className={`${styles.sidebarLink} ${pathname.startsWith('/employer/packages') ? styles.active : ''}`}><Icon name="briefcase" size={19} /><span>Packages</span></Link>
              <Link href="/employer/billing" className={`${styles.sidebarLink} ${pathname.startsWith('/employer/billing') ? styles.active : ''}`}><Icon name="bar-chart" size={19} /><span>Billing</span></Link>
            </>
          )}
          <Link href="/notifications" className={`${styles.sidebarLink} ${pathname.startsWith('/notifications') ? styles.active : ''}`}><Icon name="bell" size={19} /><span>Notifications</span></Link>
        </nav>
        <button type="button" className={styles.sidebarSignOut} onClick={signOut}>Sign out</button>
      </aside>

      <div className={styles.mainColumn}>
        <header className={styles.topbar}>
          <Link href={role === 'job_seeker' ? '/job-seeker/dashboard' : '/employer/dashboard'} className={styles.mobileBrand} aria-label="CareerSnap home">
            <Image src="/careersnap-pro-logo.png" alt="CareerSnap" width={217} height={48} priority />
          </Link>
          <span className={styles.workspaceLabel}>{role === 'job_seeker' ? 'Career workspace' : 'Hiring workspace'}</span>
          <div className={styles.topActions}>
            <Link href={searchHref} className={styles.iconLink} aria-label={role === 'job_seeker' ? 'Search jobs' : 'Find candidates'} title={role === 'job_seeker' ? 'Search jobs' : 'Find candidates'}>
              <Icon name="search" size={20} />
            </Link>
            <NotificationBell userId={userId} className={styles.notificationSlot} />
            <Link href={profileHref} className={styles.topAvatar} aria-label={role === 'job_seeker' ? 'Open profile' : 'Open company profile'}>
              {avatarUrl ? <span className={styles.avatarImage} style={{ backgroundImage: `url(${avatarUrl})` }} /> : initials}
            </Link>
            <button type="button" className={styles.mobileSignOut} onClick={signOut}>Sign out</button>
          </div>
        </header>
        <div className={styles.content}>{children}</div>
      </div>

      <nav className={styles.bottomNav} aria-label="Primary navigation">
        {navigationItems(navigation, styles.bottomLink)}
      </nav>
    </div>
  );
}