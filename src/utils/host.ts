import { headers } from 'next/headers';

const LOCALHOSTS = ['localhost:3000', '127.0.0.1:3000'];

export async function getHostFromHeaders() {
  const _headers = await headers();
  const host = _headers.get('host');

  if (host === null) {
    throw new Error('Host header not found');
  }

  return host;
}

export async function getBaseUrlFromHeaders() {
  const host = await getHostFromHeaders();
  const protocol = LOCALHOSTS.includes(host) ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;

  return baseUrl;
}

export async function checkIsLocalhost() {
  const host = await getHostFromHeaders();
  const isLocalhost = LOCALHOSTS.includes(host);

  return isLocalhost;
}
