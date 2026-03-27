/**
 * Cloudflare Service
 * Manages KV routing and DNS for deployed sites.
 *
 * KV stores the mapping:  site:{slug} → { projectSlug, deployId, projectId }
 * The Cloudflare Worker reads KV to resolve which R2 deployment to serve.
 */

const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID || "";
const CF_API_TOKEN = process.env.CF_API_TOKEN || "";
const CF_KV_NAMESPACE_ID = process.env.CF_KV_NAMESPACE_ID || "";

interface SiteRouting {
  projectSlug: string;
  deployId: string;
  projectId: string;
}

export class CloudflareService {
  /**
   * Update KV routing to point a slug to a specific deployment.
   * This is what makes `project-slug.trackcodex.com` resolve to the right R2 files.
   */
  static async updateSiteRouting(
    slug: string,
    routing: SiteRouting,
  ): Promise<void> {
    if (!CF_ACCOUNT_ID || !CF_API_TOKEN || !CF_KV_NAMESPACE_ID) {
      console.warn(
        "⚠️ [CloudflareService] Missing CF credentials, skipping KV update. " +
        "Set CF_ACCOUNT_ID, CF_API_TOKEN, CF_KV_NAMESPACE_ID in .env",
      );
      return;
    }

    const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces/${CF_KV_NAMESPACE_ID}/values/site:${slug}`;

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${CF_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(routing),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(`❌ [CloudflareService] KV write failed: ${body}`);
      throw new Error(`Failed to update Cloudflare KV: ${response.status}`);
    }

    console.log(`✅ [CloudflareService] Updated KV routing: site:${slug} → deploy ${routing.deployId.slice(0, 8)}`);
  }

  /**
   * Update KV routing for a custom domain.
   * This maps `example.com` → { projectSlug, deployId, projectId }
   */
  static async updateDomainRouting(
    domain: string,
    routing: SiteRouting,
  ): Promise<void> {
    if (!CF_ACCOUNT_ID || !CF_API_TOKEN || !CF_KV_NAMESPACE_ID) return;

    // Strip www. if present for the KV key
    const hostname = domain.startsWith("www.") ? domain.slice(4) : domain;
    const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces/${CF_KV_NAMESPACE_ID}/values/domain:${hostname}`;

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${CF_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(routing),
    });

    if (!response.ok) {
      throw new Error(`Failed to update domain KV: ${response.status}`);
    }

    console.log(`✅ [CloudflareService] Updated domain routing: domain:${hostname} → ${routing.projectSlug}`);
  }

  /**
   * Delete KV routing entry (when deleting a project).
   */
  static async deleteSiteRouting(slug: string): Promise<void> {
    if (!CF_ACCOUNT_ID || !CF_API_TOKEN || !CF_KV_NAMESPACE_ID) return;

    const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces/${CF_KV_NAMESPACE_ID}/values/site:${slug}`;

    await fetch(url, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${CF_API_TOKEN}` },
    });

    console.log(`🗑️ [CloudflareService] Deleted KV routing: site:${slug}`);
  }

  /**
   * Delete domain routing entry.
   */
  static async deleteDomainRouting(domain: string): Promise<void> {
    if (!CF_ACCOUNT_ID || !CF_API_TOKEN || !CF_KV_NAMESPACE_ID) return;

    const hostname = domain.startsWith("www.") ? domain.slice(4) : domain;
    const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces/${CF_KV_NAMESPACE_ID}/values/domain:${hostname}`;

    await fetch(url, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${CF_API_TOKEN}` },
    });

    console.log(`🗑️ [CloudflareService] Deleted domain routing: domain:${hostname}`);
  }

  /**
   * Add a custom domain DNS record pointing to the TrackCodex worker.
   */
  static async addCustomDomain(
    zoneId: string,
    domain: string,
  ): Promise<{ id: string }> {
    if (!CF_API_TOKEN) {
      console.warn("⚠️ [CloudflareService] Missing CF_API_TOKEN, skipping DNS");
      return { id: "mock-dns-record" };
    }

    const url = `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CF_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "CNAME",
        name: domain,
        content: "proxy.trackcodex.com",
        proxied: true,
        ttl: 1, // Auto
      }),
    });

    const data: any = await response.json();
    if (!data.success) {
      throw new Error(`DNS record creation failed: ${JSON.stringify(data.errors)}`);
    }

    return { id: data.result.id };
  }

  /**
   * Purge CDN cache for a specific site.
   */
  static async purgeCache(zoneId: string, slug: string): Promise<void> {
    if (!CF_API_TOKEN) return;

    const url = `https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`;

    await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CF_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prefixes: [`${slug}.trackcodex.com`],
      }),
    });

    console.log(`🔄 [CloudflareService] Cache purged for ${slug}.trackcodex.com`);
  }
}
