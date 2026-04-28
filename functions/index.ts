/**
 * Cloudflare Pages Function — smart language redirect at root "/"
 *
 * Priority:
 *  1. Cookie "preferred_lang" (set when user manually switches language)
 *  2. Accept-Language header with Catalan detection
 *  3. CF-IPCountry header (Cloudflare geo-detection, no external API)
 *  4. Fallback → /es (Spain is default market)
 *
 * Only runs for GET requests to "/".
 * All existing /en/…, /es/…, /ca/… routes are untouched.
 */

const VALID_LANGS = new Set(['en', 'es', 'ca']);

const ES_COUNTRIES = new Set([
  'ES', 'MX', 'AR', 'CO', 'CL', 'PE', 'VE', 'EC',
  'BO', 'PY', 'UY', 'CR', 'PA', 'GT', 'HN', 'SV',
  'NI', 'DO', 'CU', 'PR',
]);

function parseAcceptLanguage(header: string): string[] {
  return header
    .split(',')
    .map((part) => {
      const [lang, q] = part.trim().split(';q=');
      return { lang: lang.trim().toLowerCase(), q: q ? parseFloat(q) : 1 };
    })
    .sort((a, b) => b.q - a.q)
    .map((item) => item.lang);
}

function detectLang(request: Request): 'en' | 'es' | 'ca' {
  const country = (request.headers.get('CF-IPCountry') ?? 'XX').toUpperCase();
  const acceptLang = request.headers.get('Accept-Language') ?? '';

  // Check Accept-Language for Catalan preference
  if (acceptLang) {
    const preferred = parseAcceptLanguage(acceptLang);
    for (const lang of preferred) {
      if (lang === 'ca' || lang.startsWith('ca-')) return 'ca';
      if (lang === 'en' || lang.startsWith('en-')) return 'en';
      if (lang === 'es' || lang.startsWith('es-')) return 'es';
    }
  }

  // Visitors from Spain default to Spanish (Catalan speakers will have ca in Accept-Language)
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
  if (preferred && VALID_LANGS.has(preferred)) {
    return Response.redirect(`${url.origin}/${preferred}`, 302);
  }

  // 2. Smart detection: Accept-Language + geo
  const lang = detectLang(request);

  return Response.redirect(`${url.origin}/${lang}`, 302);
}
