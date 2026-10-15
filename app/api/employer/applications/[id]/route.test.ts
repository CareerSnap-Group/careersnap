/** @jest-environment node */

import { createClient } from '@/lib/supabase/server';
import { PATCH } from './route';

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

const mockCreateClient = jest.mocked(createClient);

function createQuery(result: { data?: unknown; error?: unknown } = { data: null, error: null }) {
  const query = {
    select: jest.fn(),
    eq: jest.fn(),
    in: jest.fn(),
    update: jest.fn(),
    maybeSingle: jest.fn().mockResolvedValue(result),
  };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.in.mockReturnValue(query);
  query.update.mockReturnValue(query);
  return query;
}

function setup(updateResult: { data?: unknown; error?: unknown }) {
  const profileQuery = createQuery({ data: { user_type: 'employer' }, error: null });
  const applicationQuery = createQuery({ data: { id: 'application-1', jobs: { company_id: 'company-1' } }, error: null });
  const updateQuery = createQuery(updateResult);
  applicationQuery.update.mockReturnValue(updateQuery);
  const membershipQuery = createQuery({ data: { company_id: 'company-1' }, error: null });

  mockCreateClient.mockReturnValue({
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'employer-1' } } }) },
    from: jest.fn((table: string) => {
      if (table === 'profiles') return profileQuery;
      if (table === 'applications') return applicationQuery;
      if (table === 'employer_users') return membershipQuery;
      throw new Error(`Unexpected table ${table}`);
    }),
  } as unknown as ReturnType<typeof createClient>);

  return { applicationQuery, updateQuery };
}

describe('PATCH /api/employer/applications/[id]', () => {
  afterEach(() => {
    mockCreateClient.mockReset();
    jest.restoreAllMocks();
  });

  it('confirms an authorized status update affected the application', async () => {
    const { applicationQuery, updateQuery } = setup({ data: { id: 'application-1' }, error: null });
    const response = await PATCH(
      new Request('http://localhost/api/employer/applications/application-1', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'shortlisted', notes: 'Review complete' }),
      }),
      { params: { id: 'application-1' } },
    );

    expect(response.status).toBe(200);
    expect(applicationQuery.update).toHaveBeenCalledWith({ status: 'shortlisted', notes: 'Review complete' });
    expect(updateQuery.select).toHaveBeenCalledWith('id');
    expect(applicationQuery.maybeSingle).toHaveBeenCalled();
  });

  it('does not report success when RLS or a concurrent change leaves no updated row', async () => {
    const { applicationQuery } = setup({ data: null, error: null });
    const response = await PATCH(
      new Request('http://localhost/api/employer/applications/application-1', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'accepted' }),
      }),
      { params: { id: 'application-1' } },
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: 'Application not found.' });
    expect(applicationQuery.update).toHaveBeenCalledWith({ status: 'accepted' });
  });

  it('reports database update errors instead of a successful status change', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const { applicationQuery } = setup({ data: null, error: { code: '42501', message: 'policy denied' } });
    const response = await PATCH(
      new Request('http://localhost/api/employer/applications/application-1', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'rejected' }),
      }),
      { params: { id: 'application-1' } },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'We could not update this application. Please try again.' });
    expect(errorSpy).toHaveBeenCalled();
    expect(applicationQuery.update).toHaveBeenCalledWith({ status: 'rejected' });
  });
});
