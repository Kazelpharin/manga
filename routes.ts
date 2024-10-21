/**
 * An array of routes that are accessible to the public
 * These routes do not require authentication
 * @type {string[]}
 */
export const publicRoutes: string[] = [
  "/",
  "/login",
  "/register",
  "/error",
  "/reset",
  "/new-password",
  "/about",
  "/contact",
  "/terms-of-service",
  "/privacy-policy",
  "/manga-chapters/cm0lcesfh000jnzehd6i6e0dh",
];

/**
 * An array of routes that are used for authentication
 * These routes will redirect logged in users to /settings
 * @type {string[]}
 */
export const authRoutes: string[] = [
  "/login",
  "/register",
  "/error",
  "/reset",
  "/new-password",
];

/**
 * An array of routes that are only accessible to authenticated users
 * @type {string[]}
 */
export const protectedRoutes: string[] = [
  "/uploads",
];

/**
 * The prefix for API authentication routes
 * Routes that start with this prefix are used for API authentication purposes
 * @type {string}
 */
export const apiAuthPrefix: string = "/api/";

/**
 * The default redirect path after logging in
 * @type {string}
 */
export const DEFAULT_LOGIN_REDIRECT: string = "/";

/**
 * A function to check if a given route is public
 * @param {string} route - The route to check
 * @returns {boolean} - Whether the route is public
 */
export const isPublicRoute = (route: string): boolean => {
  return publicRoutes.includes(route) || route.startsWith('/manga-chapters/');
};