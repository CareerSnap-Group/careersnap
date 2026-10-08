'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { AuthenticatedAppShell } from './authenticated-app-shell';
import { isAuthenticatedAppRoute, useAccountRole } from './use-account-role';

export function AuthenticatedAppShellBoundary({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { role, userId, displayName, profilePhotoUrl } = useAccountRole();

  const dashboardUsesServerShell = pathname === '/job-seeker/dashboard' || pathname === '/employer/dashboard';
  if (!role || !userId || !pathname || dashboardUsesServerShell || !isAuthenticatedAppRoute(pathname, role)) {
    return children;
  }

  return (
    <AuthenticatedAppShell role={role} displayName={displayName || 'CareerSnap Member'} avatarUrl={profilePhotoUrl}>
      {children}
    </AuthenticatedAppShell>
  );
}
