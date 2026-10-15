import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createClient } from '@/lib/supabase/browser';
import type { Database } from '@/lib/supabase/database.types';
import { NotificationBell } from '@/components/layout/notification-bell';
import { NotificationList } from './notification-list';

jest.mock('@/lib/supabase/browser', () => ({
  createClient: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
}));

const mockCreateClient = jest.mocked(createClient);

describe('notification read state and unread count', () => {
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
  jest.restoreAllMocks();
});
