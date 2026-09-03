/**
 * Partner-sold add-ons (RL-432): POST /api/job/<jobtoken>/addon
 *   body { action: 'add' | 'remove', slug }
 * Authorized by the job token. The partner upsells fixed-price extras on site;
 * the price is looked up server-side from the catalog (client can't inflate it)
 * and the add-on is appended to orders.addons. Add-ons raise what the client
 * pays and pay the partner at ADDON_PARTNER_PCT (higher than the base cut).
 * Allowed while the job is workable (booked → qc).
 */

import { json, inert, notFound, sha256hex, logEvent, addonsTotal } from '../../../_lib/orders';
import type { OrdersEnv } from '../../../_lib/orders';
import es from '../../../../src/content/es.json';

const WORKABLE = ['booked', 'assigned', 'in_progress', 'qc'];
type Addon = { slug: string; name: string; price_eur: number; size_pricing?: Record<string, number> };
const CATALOG: Addon[] = (es as any).addons || [];

// Some add-ons (e.g. the ceramic coatings) scale with the vehicle size, exactly
// like the main packages. Resolve the price server-side from the order's size so
// the partner can never set it and a van never gets charged a compact price.
function addonPrice(item: Addon, size: unknown): number {
  const s = typeof size === 'string' ? size : '';
  if (item.size_pricing && item.size_pricing[s] != null) return item.size_pricing[s];
  return Number(item.price_eur) || 0;
}

export async function onRequestPost(context: {
  request: Request;
  env: OrdersEnv;
  params: { token: string };
}): Promise<Response> {
  const { request, env, params } = context;
  if (!env.ORDERS_DB) return inert('orders_db_not_configured');
  const db = env.ORDERS_DB;

  if (!/^[a-f0-9]{32}$/.test(params.token)) return notFound();
  const order = await db
    .prepare('SELECT * FROM orders WHERE job_token_hash = ?')
    .bind(await sha256hex(params.token))
    .first<Record<string, unknown>>();
  if (!order || !WORKABLE.includes(order.status as string)) return notFound();

  let b: Record<string, unknown>;
  try { b = await request.json(); } catch { return json({ ok: false, reason: 'bad_json' }, 400); }
  const slug = typeof b.slug === 'string' ? b.slug : '';
  const item = CATALOG.find((a) => a.slug === slug);
  if (!item) return json({ ok: false, reason: 'unknown_addon' }, 400);

  let list: any[] = [];
  try { list = JSON.parse((order.addons as string) || '[]'); } catch { list = []; }
  if (!Array.isArray(list)) list = [];

  if (b.action === 'add') {
    if (!list.some((a) => a.slug === slug)) {
      const price = addonPrice(item, order.size);
      list.push({ slug: item.slug, name: item.name, price_eur: price });
      await logEvent(db, order.id as string, 'addon_added', { slug, price_eur: price, by: 'partner' });
    }
  } else if (b.action === 'remove') {
    const before = list.length;
    list = list.filter((a) => a.slug !== slug);
    if (list.length !== before) await logEvent(db, order.id as string, 'addon_removed', { slug, by: 'partner' });
  } else {
    return json({ ok: false, reason: 'bad_action' }, 400);
  }

  await db.prepare('UPDATE orders SET addons = ? WHERE id = ?').bind(JSON.stringify(list.slice(0, 20)), order.id).run();
  return json({ ok: true, addons: list, addons_total: addonsTotal({ addons: JSON.stringify(list) }) });
}
