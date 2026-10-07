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
    const refreshUnreadCount = async () => {
      try {
        const { count, error } = await createClient()
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('recipient_user_id', userId)
          .is('read_at', null);
        if (active && !error) setUnreadCount(count || 0);
      } catch {
        if (active) setUnreadCount(0);
      }
    };

    const handleNotificationsChanged = () => { void refreshUnreadCount(); };
    void refreshUnreadCount();
    window.addEventListener('careersnap:notifications-changed', handleNotificationsChanged);
    return () => {
      active = false;
      window.removeEventListener('careersnap:notifications-changed', handleNotificationsChanged);
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