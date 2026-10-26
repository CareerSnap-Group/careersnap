type LoginErrorDetails = {
  code?: unknown;
  message?: unknown;
  name?: unknown;
  status?: unknown;
};

export function getLoginErrorMessage(error: unknown) {
  const details = typeof error === 'object' && error !== null
    ? error as LoginErrorDetails
    : {};
  const message = typeof details.message === 'string' ? details.message : '';
  const normalizedMessage = message.toLowerCase();

  if (details.code === 'invalid_credentials' || normalizedMessage.includes('invalid login credentials')) {
    return 'The email or password you entered is incorrect.';
  }

  if (
    details.name === 'AuthRetryableFetchError'
    || (typeof details.status === 'number' && details.status >= 500)
    || /failed to fetch|fetch failed|network request failed|networkerror/.test(normalizedMessage)
  ) {
    return "We couldn't reach the sign-in service. Check your connection and try again.";
  }

  return message || 'Unable to sign in right now. Please try again.';
}
