import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createClient } from '@/lib/supabase/browser';
import { NotificationBell } from './notification-bell';

jest.mock('@/lib/supabase/browser', () => ({
  createClient: jest.fn(),
}));

const mockCreateClient = jest.mocked(createClient);

describe('NotificationBell', () => {
  let unreadCount: number;
  let query: {
    select: jest.Mock;
    eq: jest.Mock;
    is: jest.Mock;
  };
  let getUser: jest.Mock;

  beforeEach(() => {
    unreadCount = 0;
    query = {
      select: jest.fn(),
      eq: jest.fn(),
      is: jest.fn(),
    };
    query.select.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    query.is.mockImplementation(async () => ({ count: unreadCount, error: null }));
    getUser = jest.fn().mockResolvedValue({ data: { user: { id: 'seeker-1' } }, error: null });

    mockCreateClient.mockReturnValue({
      auth: { getUser },
      from: jest.fn(() => query),
    } as unknown as ReturnType<typeof createClient>);
  });

  afterEach(() => {
    mockCreateClient.mockReset();
    jest.restoreAllMocks();
  });

  it.each([
    [1, '1'],
    [7, '7'],
    [99, '99'],
    [100, '99+'],
  ])('shows %s unread notifications as %s', async (count, label) => {
    unreadCount = count;
    render(<NotificationBell userId="seeker-1" />);

    expect(await screen.findByText(label)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: `Notifications, ${count > 99 ? '100' : count} unread` })).toBeInTheDocument();
  });

  it('hides the badge when there are no unread notifications', async () => {
    render(<NotificationBell userId="seeker-1" />);

    await waitFor(() => expect(query.is).toHaveBeenCalledWith('read_at', null));
    expect(screen.queryByText('0')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Notifications' })).toBeInTheDocument();
  });

  it('scopes the count to the authenticated user and refreshes on notification changes', async () => {
    unreadCount = 1;
    const { unmount } = render(<NotificationBell userId="seeker-1" />);

    expect(await screen.findByText('1')).toBeInTheDocument();
    expect(query.eq).toHaveBeenCalledWith('recipient_user_id', 'seeker-1');
    expect(getUser).toHaveBeenCalled();

    unreadCount = 3;
    fireEvent(window, new Event('careersnap:notifications-changed'));
    expect(await screen.findByText('3')).toBeInTheDocument();

    const requestCount = query.is.mock.calls.length;
    unmount();
    fireEvent(window, new Event('careersnap:notifications-changed'));
    expect(query.is).toHaveBeenCalledTimes(requestCount);
  });

  it('keeps the last count and indicates when a refresh fails', async () => {
    unreadCount = 4;
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    render(<NotificationBell userId="seeker-1" />);

    expect(await screen.findByText('4')).toBeInTheDocument();
    query.is.mockImplementationOnce(async () => ({ count: null, error: new Error('query failed') }));
    fireEvent(window, new Event('careersnap:notifications-changed'));

    expect(await screen.findByRole('link', {
      name: 'Notifications, 4 unread, unread count may be out of date',
    })).toBeInTheDocument();
    expect(screen.getByText('!')).toBeInTheDocument();
    expect(errorSpy).toHaveBeenCalled();
  });

  it('does not fetch a personal count for a logged-out user', () => {
    const { container } = render(<NotificationBell userId={null} />);

    expect(container).toBeEmptyDOMElement();
    expect(mockCreateClient).not.toHaveBeenCalled();
  });
});
