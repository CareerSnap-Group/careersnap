'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';
import { Icon } from '@/components/icons';
import type { AccountRole } from './use-account-role';
import styles from './mobile-authenticated-navigation.module.css';

const navigation = {
  job_seeker: [
    { href: '/job-seeker/dashboard', label: 'Home', icon: 'bar-chart' },
    { href: '/jobs', label: 'Jobs', icon: 'briefcase' },
    { href: '/applications', label: 'Applications', icon: 'calendar' },
    { href: '/profile', label: 'Profile', icon: 'user' },
  ],
  employer: [
    { href: '/employer/dashboard', label: 'Home', icon: 'bar-chart' },
    { href: '/employer/jobs', label: 'Jobs', icon: 'briefcase' },
    { href: '/employer/cvs', label: 'Candidates', icon: 'search' },
    { href: '/employer/company', label: 'Company', icon: 'user' },
  ],
} as const;

export function MobileAuthenticatedNavigation({ role }: { role: AccountRole }) {
  const pathname = usePathname();
  return (
    <nav className={styles.nav} aria-label="Primary navigation" data-authenticated-mobile-nav="true">
      {navigation[role].map((item) => {
        const active = pathname === item.href || (item.href !== '/job-seeker/dashboard' && item.href !== '/employer/dashboard' && pathname.startsWith(`${item.href}/`));
        return (
          <Link key={item.href} href={item.href} className={`${styles.item} ${active ? styles.active : ''}`} aria-current={active ? 'page' : undefined}>
            <Icon name={item.icon} size={20} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function AuthenticatedDesktopSidebar({ role, displayName, avatarUrl }: { role: AccountRole; displayName: string; avatarUrl?: string | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const isSeeker = role === 'job_seeker';
  const profileHref = isSeeker ? '/profile' : '/employer/company';
  const initials = displayName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'C';
  const extraItems = isSeeker
    ? [
      { href: '/companies', label: 'Companies', icon: 'search' as const },
      { href: '/resources', label: 'Career Resources', icon: 'briefcase' as const },
      { href: '/saved-jobs', label: 'Saved Jobs', icon: 'heart' as const },
      { href: '/settings', label: 'Settings', icon: 'user' as const },
    ]
    : [
      { href: '/employers/post-job', label: 'Post a Job', icon: 'briefcase' as const },
      { href: '/employer/applications', label: 'Applications', icon: 'calendar' as const },
      { href: '/employer/packages', label: 'Packages', icon: 'briefcase' as const },
      { href: '/employer/billing', label: 'Billing', icon: 'bar-chart' as const },
    ];

  const signOut = async () => {
    await createClient().auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const linkClass = (href: string) => `${styles.sidebarLink} ${pathname === href || pathname.startsWith(`${href}/`) ? styles.active : ''}`;

  return (
    <aside className={styles.sidebar} aria-label={`${isSeeker ? 'Job Seeker' : 'Employer'} navigation`} data-authenticated-sidebar="true">
      <Link href={isSeeker ? '/job-seeker/dashboard' : '/employer/dashboard'} className={styles.brand} aria-label="CareerSnap home">
        <Image src="/careersnap-pro-logo.png" alt="CareerSnap" width={217} height={48} priority />
      </Link>
      <Link href={profileHref} className={styles.profile}>
        <span className={styles.avatar} style={avatarUrl ? { backgroundImage: `url(${avatarUrl})` } : undefined}>{avatarUrl ? null : initials}</span>
        <span className={styles.identity}><strong>{displayName}</strong><small>{isSeeker ? 'Job Seeker' : 'Employer'}</small></span>
      </Link>
      <nav className={styles.primary}>
        {navigation[role].map((item) => {
          const active = pathname === item.href || (item.href !== '/job-seeker/dashboard' && item.href !== '/employer/dashboard' && pathname.startsWith(`${item.href}/`));
          return <Link key={item.href} href={item.href} className={`${styles.sidebarLink} ${active ? styles.active : ''}`} aria-current={active ? 'page' : undefined}><Icon name={item.icon} size={20} /><span>{item.label}</span></Link>;
        })}
      </nav>
      <nav className={styles.secondary} aria-label="More options">
        {extraItems.map((item) => <Link key={item.href} href={item.href} className={linkClass(item.href)}><Icon name={item.icon} size={19} /><span>{item.label}</span></Link>)}
        <Link href="/notifications" className={linkClass('/notifications')}><Icon name="bell" size={19} /><span>Notifications</span></Link>
      </nav>
      <button type="button" className={styles.signOut} onClick={signOut}>Sign out</button>
    </aside>
  );
}