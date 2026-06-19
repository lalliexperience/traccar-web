import fetchOrThrow from './fetchOrThrow';

const RELAY_BASE = '/relay/api';

export default async function relayFetch(path, init = {}) {
  return fetchOrThrow(`${RELAY_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
}
