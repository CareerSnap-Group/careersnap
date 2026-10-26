import { getLoginErrorMessage } from './login-error';

describe('getLoginErrorMessage', () => {
  it('gives invalid credentials a clear, user-friendly message', () => {
    expect(getLoginErrorMessage({ code: 'invalid_credentials', message: 'Invalid login credentials' }))
      .toBe('The email or password you entered is incorrect.');
  });

  it('reports fetch failures as connectivity issues', () => {
    expect(getLoginErrorMessage(new TypeError('Failed to fetch')))
      .toBe("We couldn't reach the sign-in service. Check your connection and try again.");
  });

  it('reports Supabase retryable fetch errors as connectivity issues', () => {
    expect(getLoginErrorMessage({ name: 'AuthRetryableFetchError', message: 'Network error' }))
      .toBe("We couldn't reach the sign-in service. Check your connection and try again.");
  });

  it('preserves non-credential authentication messages', () => {
    expect(getLoginErrorMessage({ message: 'Email not confirmed' })).toBe('Email not confirmed');
  });
});
