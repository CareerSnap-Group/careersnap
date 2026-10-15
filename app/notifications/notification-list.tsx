'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/browser';
import type { Database } from '@/lib/supabase/database.types';
import styles from './notifications.module.css';

type Notification = Database['public']['Tables']['notifications']['Row'];

const statusByNotification: Partial<Record<Notification['notification_type'], string>> = {
  application_viewed: 'Viewed',
  application_reviewing: 'Reviewing',
  application_shortlisted: 'Shortlisted',
  application_interview: 'Interview',
  application_offer: 'Offer',
  application_hired: 'Hired',
  application_rejected: 'Rejected',
  application_accepted: 'Accepted',
};

function notificationHref(notification: Notification) {
  return notification.notification_type === 'new_application'
    ? `/employer/applications/${notification.application_id}`
    : `/applications#application-${notification.application_id}`;
}

function notificationLinkLabel(notification: Notification) {
  if (notification.notification_type === 'new_application') return 'Review application';
  const status = statusByNotification[notification.notification_type];
  return status ? `View ${status} update` : 'View application';
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
  }).format(new Date(value)) + ' UTC';
}

export function NotificationList({ notifications: initialNotifications, unavailable = false }: { notifications: Notification[]; unavailable?: boolean }) {
  const router = useRouter();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [pendingIds, setPendingIds] = useState<Set<string>>(() => new Set());
  const [error, setError] = useState('');

  const markRead = async (notificationId: string) => {
    if (pendingIds.has(notificationId)) return false;
    setPendingIds((current) => new Set(current).add(notificationId));
    setError('');

    const { data, error: updateError } = await createClient().rpc('mark_notification_read', {
      p_notification_id: notificationId,
    });
    setPendingIds((current) => {
      const next = new Set(current);
      next.delete(notificationId);
      return next;
    });

    if (updateError) {
      setError('We could not mark that notification as read. Please try again.');
      return false;
    }

    if (!data) {
      setError('We could not mark that notification as read. Please try again.');
      return false;
    }

    setNotifications((current) => current.map((notification) => notification.id === notificationId
      ? { ...notification, read_at: new Date().toISOString() }
      : notification));
    window.dispatchEvent(new Event('careersnap:notifications-changed'));
    return true;
  };

  const openNotification = async (event: React.MouseEvent<HTMLAnchorElement>, notification: Notification) => {
    if (notification.read_at) return;
    event.preventDefault();
    if (await markRead(notification.id)) router.push(notificationHref(notification));
  };

  if (unavailable) {
    return <div className={styles.empty} role="alert"><h2>Notifications unavailable</h2><p>We could not load your notifications. Please try again later.</p></div>;
  }

  if (!notifications.length) {
    return <div className={styles.empty}><h2>You&apos;re all caught up</h2><p>New application updates will appear here.</p></div>;
  }

  return (
    <div className={styles.list}>
      {error && <p className={styles.error} role="alert">{error}</p>}
      {notifications.map((notification) => (
        <article key={notification.id} className={`${styles.item} ${notification.read_at ? '' : styles.unread}`}>
          <div className={styles.itemContent}>
            <div className={styles.itemHeading}>
              <h2>{notification.title}</h2>
              {!notification.read_at && <span className={styles.unreadMark} aria-label="Unread" />}
            </div>
            <p>{notification.message}</p>
            <time dateTime={notification.created_at}>{formatTimestamp(notification.created_at)}</time>
          </div>
          <div className={styles.actions}>
            {!notification.read_at && (
              <button type="button" onClick={() => markRead(notification.id)} disabled={pendingIds.has(notification.id)}>
                Mark read
              </button>
            )}
            <Link href={notificationHref(notification)} onClick={(event) => { void openNotification(event, notification); }}>
              {notificationLinkLabel(notification)}
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}