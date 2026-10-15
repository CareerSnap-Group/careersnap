'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/browser';
import { Icon } from '@/components/icons';
import styles from './notification-bell.module.css';

export function NotificationBell({ userId, className = '' }: { userId: string | null; className?: string }) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    setUnreadCount(0);
    if (!userId) return;

    let active = true;
    let requestSequence = 0;
    const supabase = createClient();
    const refreshUnreadCount = async () => {
      const requestId = ++requestSequence;
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        if (!user || user.id !== userId) {
          if (active && requestId === requestSequence) setUnreadCount(0);
          return;
        }

        const { count, error } = await supabase
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('recipient_user_id', userId)
          .is('read_at', null);
        if (error) throw error;
        if (active && requestId === requestSequence) setUnreadCount(count ?? 0);
      } catch (refreshError) {
        console.error('Could not refresh unread notification count', refreshError);
      }
    };

    const handleNotificationsChanged = () => { void refreshUnreadCount(); };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') void refreshUnreadCount();
    };
    void refreshUnreadCount();
    const intervalId = window.setInterval(() => { void refreshUnreadCount(); }, 30_000);
    window.addEventListener('careersnap:notifications-changed', handleNotificationsChanged);
    window.addEventListener('focus', handleNotificationsChanged);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      active = false;
      window.clearInterval(intervalId);
      window.removeEventListener('careersnap:notifications-changed', handleNotificationsChanged);
      window.removeEventListener('focus', handleNotificationsChanged);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [userId]);

  if (!userId) return null;

  return (
    <span className={`${styles.root} ${className}`}>
      <Link
        href="/notifications"
        className={styles.link}
        aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        title="Notifications"
      >
        <Icon name="bell" size={20} />
        {unreadCount > 0 && <span className={styles.badge} aria-hidden="true">{unreadCount > 99 ? '99+' : unreadCount}</span>}
      </Link>
    </span>
  );
}