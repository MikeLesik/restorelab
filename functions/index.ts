/**
 * Cloudflare Pages Function — smart language redirect at root "/"
 *
 * Priority:
 *  1. Cookie "preferred_lang" (set when user manually switches language)
 *  2. CF-IPCountry header (Cloudflare geo-detection, no external API)
 *  3. Fallback → /en
 *
 * Only runs for GET requests to "/".
 * All existing /en/…, /es/…, /pt/… routes are untouched.
 */

const PT_COUNTRIES = new Set([
  'PT', 'BR', 'AO', 'MZ', 'CV', 'GW', 'ST', 'TL',
]);

const ES_COUNTRIES = new Set([
  'ES', 'MX', 'AR', 'CO', 'CL', 'PE', 'VE', 'EC',
  'BO', 'PY', 'UY', 'CR', 'PA', 'GT', 'HN', 'SV',
  'NI', 'DO', 'CU', 'PR',
]);

function detectLang(country: string): 'en' | 'es' | 'pt' {
  if (PT_COUNTRIES.has(country)) return 'pt';
  if (ES_COUNTRIES.has(country)) return 'es';
  return 'en';
}

function getCookie(cookieHeader: string, name: string): string | null {
  const match = cookieHeader.match(
    new RegExp(`(?:^|;\\s*)${name}=([^;]+)`)
  );
  return match ? decodeURIComponent(match[1]) : null;
}

export async function onRequestGet({
  request,
}: {
  request: Request;
}): Promise<Response> {
  const url = new URL(request.url);
  const cookieHeader = request.headers.get('cookie') ?? '';

  // 1. Respect manual language choice saved as cookie by the lang switcher
  const preferred = getCookie(cookieHeader, 'preferred_lang');
  if (preferred && ['en', 'es', 'pt'].includes(preferred)) {
    return Response.redirect(`${url.origin}/${preferred}`, 302);
  }

  // 2. Use Cloudflare's built-in IP-to-country (no external API call)
  const country = (request.headers.get('CF-IPCountry') ?? 'XX').toUpperCase();
  const lang = detectLang(country);

  return Response.redirect(`${url.origin}/${lang}`, 302);
}
