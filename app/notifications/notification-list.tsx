'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
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

export function NotificationList({ notifications: initialNotifications, userId, unavailable = false }: { notifications: Notification[]; userId: string; unavailable?: boolean }) {
  const router = useRouter();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [pendingIds, setPendingIds] = useState<Set<string>>(() => new Set());
  const [error, setError] = useState('');
  const [refreshError, setRefreshError] = useState('');
  const [queryAvailable, setQueryAvailable] = useState(!unavailable);

  useEffect(() => {
    let active = true;
    let requestSequence = 0;
    const refreshNotifications = async () => {
      const requestId = ++requestSequence;
      try {
        const { data, error: fetchError } = await createClient()
          .from('notifications')
          .select('*')
          .eq('recipient_user_id', userId)
          .order('created_at', { ascending: false })
          .limit(50);
        if (fetchError) throw fetchError;
        if (active && requestId === requestSequence && data) {
          setNotifications(data);
          setRefreshError('');
          setQueryAvailable(true);
        }
      } catch (refreshError) {
        console.error('Could not refresh notifications', refreshError);
        if (active && requestId === requestSequence) {
          setRefreshError('We could not refresh your notifications. Showing the last loaded results.');
        }
      }
    };

    const intervalId = window.setInterval(() => { void refreshNotifications(); }, 30_000);
    window.addEventListener('careersnap:notifications-changed', refreshNotifications);
    window.addEventListener('focus', refreshNotifications);
    void refreshNotifications();
    return () => {
      active = false;
      requestSequence += 1;
      window.clearInterval(intervalId);
      window.removeEventListener('careersnap:notifications-changed', refreshNotifications);
      window.removeEventListener('focus', refreshNotifications);
    };
  }, [userId]);

  const markRead = async (notificationId: string) => {
    if (pendingIds.has(notificationId)) return false;
    setError('');
    setPendingIds((current) => new Set(current).add(notificationId));

    let data: boolean | null = null;
    let updateError: { message: string } | null = null;
    try {
      const result = await createClient().rpc('mark_notification_read', {
        p_notification_id: notificationId,
      });
      data = result.data;
      updateError = result.error;
    } catch (markReadError) {
      console.error('Could not mark notification as read', markReadError);
      setError('We could not mark that notification as read. Please try again.');
      return false;
    } finally {
      setPendingIds((current) => {
        const next = new Set(current);
        next.delete(notificationId);
        return next;
      });
    }

    if (updateError) {
      console.error('Could not mark notification as read', updateError.message);
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
    await markRead(notification.id);
    router.push(notificationHref(notification));
  };

  if (!queryAvailable) {
    return <div className={styles.empty} role="alert"><h2>Notifications unavailable</h2><p>We could not load your notifications. Please try again later.</p></div>;
  }

  if (!notifications.length) {
    return (
      <>
        {refreshError && <p className={styles.error} role="alert">{refreshError}</p>}
        <div className={styles.empty}>
          <h2>{refreshError ? 'Notifications unavailable' : "You're all caught up"}</h2>
          <p>{refreshError ? 'We could not load your notifications. Please try again later.' : 'New application updates will appear here.'}</p>
        </div>
      </>
    );
  }

  return (
    <div className={styles.list}>
      {error && <p className={styles.error} role="alert">{error}</p>}
      {refreshError && <p className={styles.error} role="alert">{refreshError}</p>}
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