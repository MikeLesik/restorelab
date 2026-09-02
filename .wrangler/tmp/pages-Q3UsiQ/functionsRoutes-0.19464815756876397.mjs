import { onRequestPost as __api_orders__id__job_token_ts_onRequestPost } from "/Users/hurma/Desktop/CodeVibe/RestoreLab/functions/api/orders/[id]/job-token.ts"
import { onRequestPost as __api_orders__id__photos_ts_onRequestPost } from "/Users/hurma/Desktop/CodeVibe/RestoreLab/functions/api/orders/[id]/photos.ts"
import { onRequestPost as __api_admin_migrate_ts_onRequestPost } from "/Users/hurma/Desktop/CodeVibe/RestoreLab/functions/api/admin/migrate.ts"
import { onRequestPost as __api_stripe_create_link_ts_onRequestPost } from "/Users/hurma/Desktop/CodeVibe/RestoreLab/functions/api/stripe/create-link.ts"
import { onRequestPost as __api_stripe_webhook_ts_onRequestPost } from "/Users/hurma/Desktop/CodeVibe/RestoreLab/functions/api/stripe/webhook.ts"
import { onRequestPost as __api_wa_send_ts_onRequestPost } from "/Users/hurma/Desktop/CodeVibe/RestoreLab/functions/api/wa/send.ts"
import { onRequestGet as __api_job__token__ts_onRequestGet } from "/Users/hurma/Desktop/CodeVibe/RestoreLab/functions/api/job/[token].ts"
import { onRequestPost as __api_job__token__ts_onRequestPost } from "/Users/hurma/Desktop/CodeVibe/RestoreLab/functions/api/job/[token].ts"
import { onRequestDelete as __api_orders__id__ts_onRequestDelete } from "/Users/hurma/Desktop/CodeVibe/RestoreLab/functions/api/orders/[id].ts"
import { onRequestGet as __api_orders__id__ts_onRequestGet } from "/Users/hurma/Desktop/CodeVibe/RestoreLab/functions/api/orders/[id].ts"
import { onRequestPatch as __api_orders__id__ts_onRequestPatch } from "/Users/hurma/Desktop/CodeVibe/RestoreLab/functions/api/orders/[id].ts"
import { onRequestPatch as __api_partners__id__ts_onRequestPatch } from "/Users/hurma/Desktop/CodeVibe/RestoreLab/functions/api/partners/[id].ts"
import { onRequestGet as __api_photo___key___ts_onRequestGet } from "/Users/hurma/Desktop/CodeVibe/RestoreLab/functions/api/photo/[[key]].ts"
import { onRequestPost as __api_capi_ts_onRequestPost } from "/Users/hurma/Desktop/CodeVibe/RestoreLab/functions/api/capi.ts"
import { onRequestGet as __api_metrics_ts_onRequestGet } from "/Users/hurma/Desktop/CodeVibe/RestoreLab/functions/api/metrics.ts"
import { onRequestGet as __api_orders_index_ts_onRequestGet } from "/Users/hurma/Desktop/CodeVibe/RestoreLab/functions/api/orders/index.ts"
import { onRequestPost as __api_orders_index_ts_onRequestPost } from "/Users/hurma/Desktop/CodeVibe/RestoreLab/functions/api/orders/index.ts"
import { onRequestGet as __api_partners_index_ts_onRequestGet } from "/Users/hurma/Desktop/CodeVibe/RestoreLab/functions/api/partners/index.ts"
import { onRequestPost as __api_partners_index_ts_onRequestPost } from "/Users/hurma/Desktop/CodeVibe/RestoreLab/functions/api/partners/index.ts"
import { onRequestGet as __api_ref_ts_onRequestGet } from "/Users/hurma/Desktop/CodeVibe/RestoreLab/functions/api/ref.ts"
import { onRequestPost as __api_ref_ts_onRequestPost } from "/Users/hurma/Desktop/CodeVibe/RestoreLab/functions/api/ref.ts"
import { onRequestGet as __api_settings_ts_onRequestGet } from "/Users/hurma/Desktop/CodeVibe/RestoreLab/functions/api/settings.ts"
import { onRequestPut as __api_settings_ts_onRequestPut } from "/Users/hurma/Desktop/CodeVibe/RestoreLab/functions/api/settings.ts"
import { onRequestGet as __index_ts_onRequestGet } from "/Users/hurma/Desktop/CodeVibe/RestoreLab/functions/index.ts"

export const routes = [
    {
      routePath: "/api/orders/:id/job-token",
      mountPath: "/api/orders/:id",
      method: "POST",
      middlewares: [],
      modules: [__api_orders__id__job_token_ts_onRequestPost],
    },
  {
      routePath: "/api/orders/:id/photos",
      mountPath: "/api/orders/:id",
      method: "POST",
      middlewares: [],
      modules: [__api_orders__id__photos_ts_onRequestPost],
    },
  {
      routePath: "/api/admin/migrate",
      mountPath: "/api/admin",
      method: "POST",
      middlewares: [],
      modules: [__api_admin_migrate_ts_onRequestPost],
    },
  {
      routePath: "/api/stripe/create-link",
      mountPath: "/api/stripe",
      method: "POST",
      middlewares: [],
      modules: [__api_stripe_create_link_ts_onRequestPost],
    },
  {
      routePath: "/api/stripe/webhook",
      mountPath: "/api/stripe",
      method: "POST",
      middlewares: [],
      modules: [__api_stripe_webhook_ts_onRequestPost],
    },
  {
      routePath: "/api/wa/send",
      mountPath: "/api/wa",
      method: "POST",
      middlewares: [],
      modules: [__api_wa_send_ts_onRequestPost],
    },
  {
      routePath: "/api/job/:token",
      mountPath: "/api/job",
      method: "GET",
      middlewares: [],
      modules: [__api_job__token__ts_onRequestGet],
    },
  {
      routePath: "/api/job/:token",
      mountPath: "/api/job",
      method: "POST",
      middlewares: [],
      modules: [__api_job__token__ts_onRequestPost],
    },
  {
      routePath: "/api/orders/:id",
      mountPath: "/api/orders",
      method: "DELETE",
      middlewares: [],
      modules: [__api_orders__id__ts_onRequestDelete],
    },
  {
      routePath: "/api/orders/:id",
      mountPath: "/api/orders",
      method: "GET",
      middlewares: [],
      modules: [__api_orders__id__ts_onRequestGet],
    },
  {
      routePath: "/api/orders/:id",
      mountPath: "/api/orders",
      method: "PATCH",
      middlewares: [],
      modules: [__api_orders__id__ts_onRequestPatch],
    },
  {
      routePath: "/api/partners/:id",
      mountPath: "/api/partners",
      method: "PATCH",
      middlewares: [],
      modules: [__api_partners__id__ts_onRequestPatch],
    },
  {
      routePath: "/api/photo/:key*",
      mountPath: "/api/photo",
      method: "GET",
      middlewares: [],
      modules: [__api_photo___key___ts_onRequestGet],
    },
  {
      routePath: "/api/capi",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_capi_ts_onRequestPost],
    },
  {
      routePath: "/api/metrics",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_metrics_ts_onRequestGet],
    },
  {
      routePath: "/api/orders",
      mountPath: "/api/orders",
      method: "GET",
      middlewares: [],
      modules: [__api_orders_index_ts_onRequestGet],
    },
  {
      routePath: "/api/orders",
      mountPath: "/api/orders",
      method: "POST",
      middlewares: [],
      modules: [__api_orders_index_ts_onRequestPost],
    },
  {
      routePath: "/api/partners",
      mountPath: "/api/partners",
      method: "GET",
      middlewares: [],
      modules: [__api_partners_index_ts_onRequestGet],
    },
  {
      routePath: "/api/partners",
      mountPath: "/api/partners",
      method: "POST",
      middlewares: [],
      modules: [__api_partners_index_ts_onRequestPost],
    },
  {
      routePath: "/api/ref",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_ref_ts_onRequestGet],
    },
  {
      routePath: "/api/ref",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_ref_ts_onRequestPost],
    },
  {
      routePath: "/api/settings",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_settings_ts_onRequestGet],
    },
  {
      routePath: "/api/settings",
      mountPath: "/api",
      method: "PUT",
      middlewares: [],
      modules: [__api_settings_ts_onRequestPut],
    },
  {
      routePath: "/",
      mountPath: "/",
      method: "GET",
      middlewares: [],
      modules: [__index_ts_onRequestGet],
    },
  ]