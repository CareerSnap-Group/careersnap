'use client';

import Link from 'next/link';
import { Icon } from '@/components/icons';
import type { ReactNode } from 'react';
import type { AccountRole } from './use-account-role';
import { AuthenticatedDesktopSidebar, MobileAuthenticatedNavigation } from './mobile-authenticated-navigation';
import styles from './authenticated-app-shell.module.css';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function AuthenticatedAppShell({
  role,
  displayName,
  greeting,
  avatarUrl,
  monochrome = false,
  children,
}: {
  role: AccountRole;
  displayName: string;
  greeting?: string;
  avatarUrl?: string | null;
  monochrome?: boolean;
  children: ReactNode;
}) {
  const firstName = displayName.trim().split(/\s+/)[0] || 'there';
  const profileHref = role === 'job_seeker' ? '/profile' : '/employer/company';
  const searchHref = role === 'job_seeker' ? '/jobs' : '/employer/cvs';
  const initials = displayName.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'C';

  return (
    <div className={styles.shell} data-authenticated-app-shell="true" data-role={role} data-dashboard-theme={monochrome ? 'monochrome' : undefined}>
      <AuthenticatedDesktopSidebar role={role} displayName={displayName} avatarUrl={avatarUrl} />
      <div className={styles.mainColumn}>
        <header className={styles.topbar}>
          <div className={styles.greetingHeader}>
            <p className={styles.workspaceLabel}>Career workspace</p>
            <h1 className={styles.greeting}>{greeting || `${getGreeting()}, ${firstName}`}</h1>
          </div>
          <div className={styles.topActions}>
            <Link href={searchHref} className={styles.iconLink} aria-label={role === 'job_seeker' ? 'Search jobs' : 'Find candidates'} title={role === 'job_seeker' ? 'Search jobs' : 'Find candidates'}>
              <Icon name="search" size={20} strokeWidth={1.8} />
            </Link>
            <Link href={profileHref} className={styles.topAvatar} aria-label={role === 'job_seeker' ? 'Open profile' : 'Open company profile'}>
              {avatarUrl ? <span className={styles.avatarImage} style={{ backgroundImage: `url(${avatarUrl})` }} role="img" aria-label={`${displayName} profile photo`} /> : initials}
            </Link>
          </div>
        </header>
        <div className={styles.content}>{children}</div>
      </div>
      <MobileAuthenticatedNavigation role={role} />
    </div>
  );
}
