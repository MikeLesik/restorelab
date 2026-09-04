/**
 * Address autocomplete proxy → CartoCiudad (IGN, the official Spanish address
 * database). GET /api/geocode?q=<query> returns up to 8 candidates.
 *
 * Same-origin by design: the browser never calls CartoCiudad directly, so the
 * strict CSP (connect-src 'self') stays intact and we can bias, cache and trim
 * server-side. Barcelona-province results (the service area) float to the top.
 * Free, no key. Best-effort: any upstream failure returns an empty list.
 */

interface Candidate {
  address?: string; muni?: string; province?: string; postalCode?: string;
  lat?: number; lng?: number; type?: string;
}

const CARTO = 'https://www.cartociudad.es/geocoder/api/geocoder/candidates';

// A JSONP-style body ("callback([...])") is unwrapped defensively; the plain
// endpoint already returns a bare JSON array.
function unwrap(text: string): string {
  const s = text.trim();
  if (s.startsWith('callback') && s.endsWith(')')) {
    const i = s.indexOf('(');
    if (i >= 0) return s.slice(i + 1, -1);
  }
  return s;
}

export async function onRequestGet(context: { request: Request }): Promise<Response> {
  const q = (new URL(context.request.url).searchParams.get('q') || '').trim().slice(0, 120);
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=86400',
  };
  if (q.length < 3) return new Response(JSON.stringify({ ok: true, results: [] }), { headers });

  let raw: Candidate[] = [];
  try {
    const res = await fetch(`${CARTO}?q=${encodeURIComponent(q)}&limit=12&countrycode=es`, {
      headers: { Accept: 'application/json', 'User-Agent': 'restoreLab/1.0 (+https://restorelab.io)' },
      signal: AbortSignal.timeout(6000),
    });
    const parsed = JSON.parse(unwrap(await res.text()));
    if (Array.isArray(parsed)) raw = parsed as Candidate[];
  } catch {
    return new Response(JSON.stringify({ ok: false, reason: 'geocoder_unreachable', results: [] }), { headers });
  }

  const results = raw
    .filter((r) => r && r.address)
    .map((r) => ({
      label: String(r.address),
      muni: r.muni || '',
      province: r.province || '',
      postalCode: r.postalCode || '',
      lat: Number(r.lat) > 0 ? Number(r.lat) : null,
      lng: Number(r.lng) > 0 ? Number(r.lng) : null,
      type: r.type || '',
    }))
    // Service area first: Barcelona province, then the rest.
    .sort((a, b) => (a.province === 'Barcelona' ? 0 : 1) - (b.province === 'Barcelona' ? 0 : 1))
    .slice(0, 8);

  return new Response(JSON.stringify({ ok: true, results }), { headers });
}
