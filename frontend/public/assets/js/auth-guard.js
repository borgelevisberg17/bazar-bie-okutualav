import { isLoggedIn } from './auth.js';

/**
 * Checks if the current page requires authentication and redirects to the login page if the user is not logged in.
 * @param {string[]} protectedRoutes - An array of page paths that require authentication.
 */
export function protectPage(protectedRoutes) {
    const currentPath = window.location.pathname;

    if (protectedRoutes.includes(currentPath) && !isLoggedIn()) {
        // Store the current path to redirect back after login
        localStorage.setItem('redirect_after_login', currentPath);
        window.location.href = '/auth/login.html';
    }
}
