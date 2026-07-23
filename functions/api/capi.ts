/**
 * Cloudflare Pages Function — Meta Conversions API (CAPI) forwarder.
 *
 * The browser Pixel already fires `Lead` with an `event_id` (see the __rl_push
 * pipeline in BaseLayout.astro). This endpoint receives that same event
 * server-side and forwards it to Meta with the identical `event_id`, so Meta
 * de-duplicates the browser and server copies. That recovers conversions lost
 * to ad-blockers / ITP / cookieless browsers after iOS.
 *
 * INERT until configured — returns a 200 no-op unless BOTH env vars are set:
 *   META_PIXEL_ID    e.g. 1556029059322810
 *   META_CAPI_TOKEN  System User token from Meta Business → Events Manager
 *
 * Add them in Cloudflare Pages → project → Settings → Environment variables
 * (Production), then it starts sending automatically. Safe to deploy first.
 *
 * Verify in Meta Events Manager → Test Events: one `Lead` with source
 * "Browser + Server" and de-duplicated by event_id.
 */

interface Env {
  META_PIXEL_ID?: string;
  META_CAPI_TOKEN?: string;
}

const GRAPH_VERSION = 'v20.0';

export async function onRequestPost(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  const { request, env } = context;

  const reply = (ok: boolean, reason?: string) =>
    new Response(JSON.stringify(reason ? { ok, reason } : { ok }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  // Not configured yet → do nothing, but never error the client call.
  if (!env.META_PIXEL_ID || !env.META_CAPI_TOKEN) return reply(false, 'capi_not_configured');

  let b: Record<string, unknown>;
  try {
    b = await request.json();
  } catch {
    return reply(false, 'bad_json');
  }
  if (!b || !b.event_name || !b.event_id) return reply(false, 'missing_fields');

  const body = {
    data: [
      {
        event_name: String(b.event_name),
        event_time: Math.floor(Date.now() / 1000),
        event_id: String(b.event_id),
        action_source: 'website',
        event_source_url: b.url ? String(b.url) : undefined,
        user_data: {
          client_ip_address: request.headers.get('CF-Connecting-IP') || undefined,
          client_user_agent:
            (b.ua ? String(b.ua) : '') || request.headers.get('User-Agent') || undefined,
          // First-party Meta cookies, forwarded from the browser for match quality.
          fbp: b.fbp ? String(b.fbp) : undefined,
          fbc: b.fbc ? String(b.fbc) : undefined,
        },
        custom_data: {
          currency: 'EUR',
          content_category: b.category ? String(b.category) : undefined,
        },
      },
    ],
  };

  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${env.META_PIXEL_ID}/events?access_token=${env.META_CAPI_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
    );
    return reply(res.ok);
  } catch {
    return reply(false, 'fetch_failed');
  }
}
