/**
 * Cloudflare Pages Function — WhatsApp ref-code attribution log (RL-301).
 *
 * The browser pipeline (__rl_push in BaseLayout.astro) POSTs here on
 * wa_click / phone_click / lead_submitted, fire-and-forget, when the visitor
 * has a ref code. Each entry maps a `#ref RL-XXXX` code — the last line of
 * every WhatsApp prefill — back to the click's stored attribution
 * (localStorage.rl_attr snapshot: first/last touch UTMs, click ids, landing).
 *
 * Lookup (owner-only): when a customer writes on WhatsApp, the message ends
 * with `#ref RL-K7F3`; open
 *   https://restorelab.io/api/ref?code=RL-K7F3&token=<REF_ADMIN_TOKEN>
 * to see source/campaign and record the channel in the CRM. That closes the
 * click → conversation → booked-job attribution loop.
 *
 * INERT until configured — POST is a 200 no-op without the KV binding, and
 * GET is a 404 without the admin token:
 *   REF_LOG          KV namespace binding (Cloudflare Pages → Settings →
 *                    Functions → KV namespace bindings)
 *   REF_ADMIN_TOKEN  long random string (Settings → Environment variables)
 * Setup steps are documented in docs/ads-measurement.md.
 */

interface RefLogKV {
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  get(key: string): Promise<string | null>;
  list(options: { prefix: string; limit?: number }): Promise<{ keys: { name: string }[] }>;
}

interface Env {
  REF_LOG?: RefLogKV;
  REF_ADMIN_TOKEN?: string;
}

const REF_PATTERN = /^RL-[A-HJ-NP-Z2-9]{4}$/;
const TTL_180_DAYS = 180 * 24 * 60 * 60;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export async function onRequestPost(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  const { request, env } = context;

  // Not configured yet → do nothing, but never error the client call.
  if (!env.REF_LOG) return json({ ok: false, reason: 'ref_log_not_configured' });

  let b: Record<string, unknown>;
  try {
    b = await request.json();
  } catch {
    return json({ ok: false, reason: 'bad_json' });
  }

  const ref = typeof b?.ref === 'string' ? b.ref : '';
  if (!REF_PATTERN.test(ref)) return json({ ok: false, reason: 'bad_ref' });

  const ts =
    typeof b.ts === 'string' && !Number.isNaN(Date.parse(b.ts))
      ? b.ts
      : new Date().toISOString();

  const entry = {
    ref,
    ts,
    event: typeof b.event === 'string' ? b.event.slice(0, 64) : '',
    page: typeof b.page === 'string' ? b.page.slice(0, 256) : '',
    attr: b.attr && typeof b.attr === 'object' ? b.attr : {},
  };
  // Cap the stored value so a hostile client can't stuff KV via `attr`.
  const value = JSON.stringify(entry).slice(0, 8192);

  try {
    await env.REF_LOG.put(`ref:${ref}:${ts}`, value, { expirationTtl: TTL_180_DAYS });
    return json({ ok: true });
  } catch {
    return json({ ok: false, reason: 'kv_put_failed' });
  }
}

export async function onRequestGet(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  const { request, env } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get('code') || '';
  const token = url.searchParams.get('token') || '';

  // Wrong/missing token → 404 (not 403): the endpoint's existence stays
  // invisible to anyone probing without the token.
  if (!env.REF_ADMIN_TOKEN || token !== env.REF_ADMIN_TOKEN) {
    return new Response('Not found', { status: 404 });
  }
  if (!env.REF_LOG) return json({ ok: false, reason: 'ref_log_not_configured' });
  if (!REF_PATTERN.test(code)) return json({ ok: false, reason: 'bad_code' });

  try {
    const { keys } = await env.REF_LOG.list({ prefix: `ref:${code}:`, limit: 100 });
    const entries = (
      await Promise.all(keys.map((k) => env.REF_LOG!.get(k.name)))
    )
      .filter((v): v is string => v !== null)
      .map((v) => {
        try {
          return JSON.parse(v);
        } catch {
          return { raw: v };
        }
      });
    return json({ ok: true, code, count: entries.length, entries });
  } catch {
    return json({ ok: false, reason: 'kv_list_failed' });
  }
}
