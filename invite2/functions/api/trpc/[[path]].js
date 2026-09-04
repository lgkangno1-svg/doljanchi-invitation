const UPSTREAM = 'https://invite.avocadoss.co.kr';
const ALLOWED_PATH = '/api/trpc/invitation.addRsvp';
const ALLOWED_METHODS = new Set(['POST', 'OPTIONS']);
const ALLOWED_HEADERS_FORWARD = ['content-type', 'accept', 'accept-language'];

export async function onRequest({ request }) {
  const incoming = new URL(request.url);

  // Only allow OPTIONS (preflight) and POST to the RSVP endpoint
  if (!ALLOWED_METHODS.has(request.method)) {
    return new Response(null, { status: 405, headers: { allow: 'POST, OPTIONS', 'cache-control': 'no-store' } });
  }

  // Path must match exactly
  if (incoming.pathname !== ALLOWED_PATH) {
    return new Response(null, { status: 404, headers: { 'cache-control': 'no-store' } });
  }

  // Handle CORS preflight without touching upstream
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'access-control-allow-origin': incoming.origin,
        'access-control-allow-methods': 'POST',
        'access-control-allow-headers': 'content-type',
        'access-control-max-age': '86400',
        'cache-control': 'no-store',
      },
    });
  }

  // Forward only safe request headers
  const headers = new Headers();
  for (const key of ALLOWED_HEADERS_FORWARD) {
    const val = request.headers.get(key);
    if (val) headers.set(key, val);
  }
  headers.set('origin', UPSTREAM);
  headers.set('referer', UPSTREAM + '/');

  const target = new URL(ALLOWED_PATH, UPSTREAM);
  const body = await request.arrayBuffer();

  try {
    const upstream = await fetch(target.toString(), {
      method: 'POST',
      headers,
      body,
      redirect: 'manual',
    });
    const responseHeaders = new Headers(upstream.headers);
    responseHeaders.delete('set-cookie');
    responseHeaders.set('cache-control', 'no-store');
    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('invite2 proxy error', error);
    return Response.json({ error: 'upstream_unavailable' }, { status: 502, headers: { 'cache-control': 'no-store' } });
  }
}
