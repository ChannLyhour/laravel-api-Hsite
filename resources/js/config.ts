/**
 * Application-level configuration derived from Vite environment variables.
 *
 * To customize for a different restaurant owner, change VITE_OWNER_USER_ID
 * in your .env file and restart the dev server.
 *
 * For Vercel deployments, set VITE_OWNER_USER_ID in the project's
 * Environment Variables dashboard.
 */

/**
 * The database user ID of the admin who owns this restaurant instance.
 * All public-facing menu items and categories are scoped to this user.
 *
 * Default: 1 (primary admin account)
 */
export const OWNER_USER_ID: number = (() => {
  const raw = import.meta.env.VITE_OWNER_USER_ID;
  const parsed = parseInt(raw, 10);
  return isNaN(parsed) ? 1 : parsed;
})();
