/**
 * Routing configuration and utilities for clean store URLs.
 * Handles mapping from query parameters (?id=...&store=...) to path parameters (/:storeSlug).
 */

export const STATIC_PATHS = [
  "/",
  "/about",
  "/restaurants",
  "/features",
  "/join",
  "/pricing",
  "/register-owner",
  "/admin",
  "/owner",
  "/owner/login",
  "/owner/orders",
  "/owner/menu",
  "/menu",
  "/product",
  "/shop",
  "/checkout",
  "/profile",
  "/wishlist",
  "/categories",
  "/auth",
  "/share",
  "/policies",
];

/**
 * Checks if the application is currently running in subdomain routing mode.
 */
export function isSubdomainMode(): boolean {
  if (typeof window === 'undefined') return false;
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return false;
  }
  const platformDomains = [
    'lvh.me',
    'store-frontend-v-hsite.vercel.app',
    'vhsite-storefront.vercel.app',
    'vhsite.com',
    'yourplatform.com',
    'laravel-api-hsite.vercel.app',
    'vhsite-platform-ecommerce.brohour00044.workers.dev',
    'www.vhsite-platform-ecommerce.brohour00044.workers.dev',
    'vhsitekh.site',
    'www.vhsitekh.site'
  ];
  return !platformDomains.includes(hostname);
}

/**
 * Converts a raw store name to a URL slug.
 */
export function slugifyStoreName(name: string): string {
  if (!name) return "";
  return name.trim().replace(/\s+/g, "_");
}

/**
 * Converts a URL slug back to a readable store name.
 */
export function deslugifyStoreName(slug: string): string {
  if (!slug) return "";
  return slug.replace(/_/g, " ");
}

/**
 * Generates the storefront URL for a given store.
 */
export function getStoreUrl(
  storeName: string,
  ownerId?: number | string,
  forceLocal?: boolean,
  forceAbsolute?: boolean,
): string {
  let resolvedUrl = "";

  if (!forceLocal) {
    try {
      const saved = localStorage.getItem("store_settings");
      if (saved) {
        const parsed = JSON.parse(saved);
        const matchesOwner =
          !ownerId ||
          String(parsed.hashid) === String(ownerId) ||
          String(parsed.owner_id) === String(ownerId) ||
          String(parsed.created_by) === String(ownerId);
        if (parsed.custom_domain && matchesOwner) {
          let domain = parsed.custom_domain.trim();

          // If it is a path slug (no dots), return it as a clean path
          if (!domain.includes(".")) {
            resolvedUrl = `/${domain}`;
          } else {
            if (!domain.startsWith("http://") && !domain.startsWith("https://")) {
              domain = `http://${domain}`;
            }

            const isLocal =
              typeof window !== "undefined" &&
              (window.location.hostname === "localhost" ||
                window.location.hostname === "127.0.0.1" ||
                window.location.hostname.startsWith("192.168.") ||
                window.location.hostname.startsWith("10.") ||
                window.location.hostname.endsWith(".lvh.me"));

            if (isLocal && typeof window !== "undefined") {
              try {
                const currentPort = window.location.port;
                if (currentPort) {
                  const urlObj = new URL(domain);
                  urlObj.port = currentPort;
                  domain = urlObj.toString().replace(/\/$/, "");
                }
              } catch (e) {
                console.warn("Failed to parse custom domain URL", e);
              }
            } else {
              // In production, rewrite .lvh.me domains to path-based URL on Vercel
              if (domain.includes(".lvh.me")) {
                let slug = domain
                  .replace("http://", "")
                  .replace("https://", "")
                  .replace(".lvh.me", "");
                if (slug.includes(":")) {
                  slug = slug.split(":")[0];
                }
                const baseOrigin = typeof window !== "undefined" ? window.location.origin : "https://vhsite-platform-ecommerce.brohour00044.workers.dev";
                domain = `${baseOrigin}/${slug}`;
              } else {
                if (domain.startsWith("http://")) {
                  domain = domain.replace("http://", "https://");
                }
              }
            }
            resolvedUrl = domain;
          }
        }
      }
    } catch (e) {
      console.warn(
        "Failed to parse store_settings from localStorage inside getStoreUrl",
        e,
      );
    }
  }

  if (!resolvedUrl) {
    const slug = slugifyStoreName(storeName);
    if (!slug) return "/";

    if (typeof window !== "undefined") {
      const hostname = window.location.hostname;
      const port = window.location.port;
      const protocol = window.location.protocol;

      const isLocal =
        hostname === "localhost" ||
        hostname === "127.0.0.1" ||
        hostname.endsWith(".lvh.me") ||
        hostname.startsWith("192.168.") ||
        hostname.startsWith("10.");

      if (isLocal) {
        const portSuffix = port ? `:${port}` : "";
        resolvedUrl = `${protocol}//${slug}.lvh.me${portSuffix}`;
      } else {
        const platformDomains = [
          "store-frontend-v-hsite.vercel.app",
          "vhsite-storefront.vercel.app",
          "vhsite.com",
          "yourplatform.com",
          "laravel-api-hsite.vercel.app",
          "vhsite-platform-ecommerce.brohour00044.workers.dev",
          "vhsitekh.site"
        ];

        let baseDomain = hostname;
        if (baseDomain.startsWith("www.")) {
          baseDomain = baseDomain.substring(4);
        }

        const isPlatform = platformDomains.includes(baseDomain);
        if (isPlatform) {
          resolvedUrl = `${protocol}//${slug}.${baseDomain}`;
        }
      }
    }

    if (!resolvedUrl) {
      resolvedUrl = `https://${slug}.vhsitekh.site`;
    }
  }

  // If the resolved URL is absolute and matches the current origin, make it relative (unless forced absolute)
  if (!forceAbsolute && typeof window !== "undefined" && resolvedUrl.startsWith(window.location.origin)) {
    const relative = resolvedUrl.substring(window.location.origin.length);
    return relative || "/";
  }

  return resolvedUrl;
}

/**
 * Generates the menu URL for a given store.
 */
export function getStoreMenuUrl(
  storeName: string,
  ownerId?: number | string,
): string {
  const storeUrl = getStoreUrl(storeName, ownerId);
  if (storeUrl.startsWith("http://") || storeUrl.startsWith("https://")) {
    return `${storeUrl.replace(/\/$/, "")}/menu`;
  }
  return `${storeUrl.replace(/\/$/, "")}/menu`.replace(/\/+/g, "/");
}

/**
 * Parses a pathname to check if it matches a custom store URL pattern (/:storeSlug or /:storeSlug/menu).
 * Returns the store slug and whether it's the menu page, or null if it's a static route.
 */
export function parseStorePath(
  pathname: string,
): { storeSlug: string; isMenu: boolean } | null {
  const cleanPath = pathname.split("?")[0].split("#")[0];
  if (!cleanPath || cleanPath === "/") return null;

  const parts = cleanPath.split("/").filter(Boolean);
  if (parts.length === 0) return null;

  const firstPart = "/" + parts[0];
  // Check if first part matches or starts with static routes
  if (
    STATIC_PATHS.includes(firstPart) ||
    STATIC_PATHS.includes(cleanPath) ||
    cleanPath.startsWith("/owner") ||
    cleanPath.startsWith("/admin") ||
    cleanPath.startsWith("/auth") ||
    cleanPath.startsWith("/share")
  ) {
    return null;
  }

  const storeSlug = parts[0];
  const isMenu = parts[1] === "menu";
  return { storeSlug, isMenu };
}
