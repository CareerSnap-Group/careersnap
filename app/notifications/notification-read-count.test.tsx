import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';
import type { Database } from '@/lib/supabase/database.types';
import { NotificationBell } from '@/components/layout/notification-bell';
import { NotificationList } from './notification-list';

jest.mock('@/lib/supabase/browser', () => ({
  createClient: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

const mockCreateClient = jest.mocked(createClient);
const mockRouterPush = jest.fn();

beforeEach(() => {
  jest.mocked(useRouter).mockReturnValue({ push: mockRouterPush, refresh: jest.fn() } as never);
});

describe('notification read state and unread count', () => {
  it('links a new-application notification to employer application review', async () => {
    type Notification = Database['public']['Tables']['notifications']['Row'];
    const notification: Notification = {
      id: 'notification-1',
      recipient_user_id: 'employer-1',
      notification_type: 'new_application',
      title: 'New application',
      message: 'Jordan Lee applied for Engineer.',
      application_id: 'application-1',
      job_id: 'job-1',
      company_id: 'company-1',
      read_at: null,
      created_at: '2026-10-15T10:00:00.000Z',
    };
    const query = {
      select: jest.fn(),
      eq: jest.fn(),
      order: jest.fn(),
      limit: jest.fn().mockResolvedValue({ data: [notification], error: null }),
    };
    query.select.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    query.order.mockReturnValue(query);
    mockCreateClient.mockReturnValue({
      from: jest.fn(() => query),
    } as unknown as ReturnType<typeof createClient>);

    render(<NotificationList notifications={[notification]} userId="employer-1" />);

    expect(screen.getByText('Jordan Lee applied for Engineer.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Review application' }))
      .toHaveAttribute('href', '/employer/applications/application-1');
    expect(screen.getByText(/Oct 15, 2026/)).toBeInTheDocument();
    await waitFor(() => expect(query.limit).toHaveBeenCalled());
  });

  it('shows decision messages and links each status notification to the seeker application', async () => {
    type Notification = Database['public']['Tables']['notifications']['Row'];
    const statuses = [
      ['application_viewed', 'Viewed', 'The employer has marked your application for Engineer at Acme as Viewed.'],
      ['application_reviewing', 'Reviewing', 'Your application for Engineer at Acme has moved to Reviewing.'],
      ['application_shortlisted', 'Shortlisted', 'Your application for Engineer at Acme has been Shortlisted.'],
      ['application_interview', 'Interview', 'Your application for Engineer at Acme has moved to Interview.'],
      ['application_offer', 'Offer', 'Your application for Engineer at Acme has moved to Offer.'],
      ['application_hired', 'Hired', 'Your application for Engineer at Acme has been marked Hired.'],
      ['application_rejected', 'Rejected', 'Your application for Engineer at Acme has been marked Rejected.'],
      ['application_accepted', 'Accepted', 'Your application for Engineer at Acme has been marked Accepted.'],
    ] as const;
    const notifications: Notification[] = statuses.map(([notification_type, status, message], index) => ({
      id: `notification-${index}`,
      recipient_user_id: 'seeker-1',
      notification_type,
      title: `Application ${status}`,
      message,
      application_id: `application-${index}`,
      job_id: 'job-1',
      company_id: 'company-1',
      read_at: null,
      created_at: '2026-10-15T10:00:00.000Z',
    }));
    const query = {
      select: jest.fn(),
      eq: jest.fn(),
      order: jest.fn(),
      limit: jest.fn().mockResolvedValue({ data: notifications, error: null }),
    };
    query.select.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    query.order.mockReturnValue(query);
    mockCreateClient.mockReturnValue({
      from: jest.fn(() => query),
    } as unknown as ReturnType<typeof createClient>);

    render(<NotificationList notifications={notifications} userId="seeker-1" />);

    for (const [notificationType, status, message] of statuses) {
      const index = statuses.findIndex(([type]) => type === notificationType);
      expect(screen.getByText(message)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: `View ${status} update` }))
        .toHaveAttribute('href', `/applications#application-application-${index}`);
    }
    await waitFor(() => expect(query.limit).toHaveBeenCalled());
  });

  it('opens an unread notification destination even if marking it read fails', async () => {
    type Notification = Database['public']['Tables']['notifications']['Row'];
    const notification: Notification = {
      id: 'notification-1',
      recipient_user_id: 'seeker-1',
      notification_type: 'application_shortlisted',
      title: 'Application shortlisted',
      message: 'Your application has been shortlisted.',
      application_id: 'application-1',
      job_id: 'job-1',
      company_id: 'company-1',
      read_at: null,
      created_at: '2026-10-15T10:00:00.000Z',
    };
    const query = {
      select: jest.fn(),
      eq: jest.fn(),
      order: jest.fn(),
      limit: jest.fn().mockResolvedValue({ data: [notification], error: null }),
    };
    query.select.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    query.order.mockReturnValue(query);
    const rpc = jest.fn().mockResolvedValue({ data: null, error: new Error('RPC failed') });
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockCreateClient.mockReturnValue({
      from: jest.fn(() => query),
      rpc,
    } as unknown as ReturnType<typeof createClient>);

    render(<NotificationList notifications={[notification]} userId="seeker-1" />);
    fireEvent.click(screen.getByRole('link', { name: 'View Shortlisted update' }));

    await waitFor(() => expect(mockRouterPush).toHaveBeenCalledWith('/applications#application-application-1'));
    expect(await screen.findByRole('alert')).toHaveTextContent('We could not mark that notification as read.');
    expect(rpc).toHaveBeenCalledWith('mark_notification_read', { p_notification_id: 'notification-1' });
    expect(errorSpy).toHaveBeenCalled();
  });

  it('recovers from an initial server query failure after a successful client refresh', async () => {
    type Notification = Database['public']['Tables']['notifications']['Row'];
    const notification: Notification = {
      id: 'notification-1',
      recipient_user_id: 'seeker-1',
      notification_type: 'application_accepted',
      title: 'Application accepted',
      message: 'Your application for Engineer at Acme has been Accepted.',
      application_id: 'application-1',
      job_id: 'job-1',
      company_id: 'company-1',
      read_at: null,
      created_at: '2026-10-15T10:00:00.000Z',
    };
    const query = {
      select: jest.fn(),
      eq: jest.fn(),
      order: jest.fn(),
      limit: jest.fn().mockResolvedValue({ data: [notification], error: null }),
    };
    query.select.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    query.order.mockReturnValue(query);
    mockCreateClient.mockReturnValue({
      from: jest.fn(() => query),
    } as unknown as ReturnType<typeof createClient>);

    render(<NotificationList notifications={[]} userId="seeker-1" unavailable />);

    expect(await screen.findByText(notification.message)).toBeInTheDocument();
    expect(screen.queryByText('Notifications unavailable')).not.toBeInTheDocument();
    await waitFor(() => expect(query.limit).toHaveBeenCalled());
  });

  it('surfaces an initial refresh error instead of showing an empty success state', async () => {
    const query = {
      select: jest.fn(),
      eq: jest.fn(),
      order: jest.fn(),
      limit: jest.fn().mockRejectedValue(new Error('query failed')),
    };
    query.select.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    query.order.mockReturnValue(query);
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockCreateClient.mockReturnValue({
      from: jest.fn(() => query),
    } as unknown as ReturnType<typeof createClient>);

    render(<NotificationList notifications={[]} userId="seeker-1" />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Showing the last loaded results.');
    expect(screen.getByText('Notifications unavailable')).toBeInTheDocument();
    expect(screen.queryByText("You're all caught up")).not.toBeInTheDocument();
    expect(errorSpy).toHaveBeenCalled();
  });

  it('refreshes the bell count when a notification is marked as read', async () => {
    type Notification = Database['public']['Tables']['notifications']['Row'];
    const rows: Notification[] = [{
      id: 'notification-1',
      recipient_user_id: 'seeker-1',
      notification_type: 'application_shortlisted' as const,
      title: 'Application shortlisted',
      message: 'Your application has been shortlisted.',
      application_id: 'application-1',
      job_id: 'job-1',
      company_id: 'company-1',
      read_at: null,
      created_at: '2026-10-15T10:00:00.000Z',
    }];

    const query = {
      select: jest.fn(),
      eq: jest.fn(),
      is: jest.fn(),
      order: jest.fn(),
      limit: jest.fn(),
    };
    query.select.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    query.order.mockReturnValue(query);
    query.is.mockImplementation(async () => ({
      count: rows.filter((row) => row.read_at === null).length,
      error: null,
    }));
    query.limit.mockImplementation(async () => ({ data: [...rows], error: null }));

    const rpc = jest.fn(async () => {
      rows[0].read_at = new Date().toISOString();
      return { data: true, error: null };
    });
    mockCreateClient.mockReturnValue({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'seeker-1' } }, error: null }) },
      from: jest.fn(() => query),
      rpc,
    } as unknown as ReturnType<typeof createClient>);

    render(
      <>
        <NotificationBell userId="seeker-1" />
        <NotificationList notifications={rows.map((row) => ({ ...row }))} userId="seeker-1" />
      </>,
    );

    expect(await screen.findByText('1')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Mark read' }));

    await waitFor(() => expect(screen.queryByText('1')).not.toBeInTheDocument());
    expect(rpc).toHaveBeenCalledWith('mark_notification_read', { p_notification_id: 'notification-1' });
    expect(screen.queryByRole('button', { name: 'Mark read' })).not.toBeInTheDocument();
  });
});

afterEach(() => {
  mockCreateClient.mockReset();
  mockRouterPush.mockReset();
  jest.restoreAllMocks();
});
