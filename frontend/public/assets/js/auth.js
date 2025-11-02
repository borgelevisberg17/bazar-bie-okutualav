// frontend/public/assets/js/auth.js

import { api } from "./services/api.js";

const USER_STORAGE_KEY = "user_session";

/**
 * Stores user session data in localStorage.
 * @param {object} sessionData - The user session data to store.
 */
export function storeSession(sessionData) {
    try {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(sessionData));
    } catch (error) {
        console.error("Error storing session data:", error);
    }
}

/**
 * Retrieves user session data from localStorage.
 * @returns {object|null} The user session data or null if not found.
 */
export function getSession() {
    try {
        const sessionData = localStorage.getItem(USER_STORAGE_KEY);
        return sessionData ? JSON.parse(sessionData) : null;
    } catch (error) {
        console.error("Error retrieving session data:", error);
        return null;
    }
}

/**
 * Clears user session data from localStorage.
 */
export function clearSession() {
    try {
        localStorage.removeItem(USER_STORAGE_KEY);
    } catch (error) {
        console.error("Error clearing session data:", error);
    }
}

/**
 * Checks if a user is currently logged in.
 * @returns {boolean} True if the user is logged in, false otherwise.
 */
export function isLoggedIn() {
    return !!getSession();
}

/**
 * Logs out the user by clearing session data and redirecting to the login page.
 */
export function logout() {
    clearSession();
    window.location.href = "/auth/login.html";
}

/**
 * Updates the UI to reflect the user's login status.
 */
export function updateUserUI() {
    // This function is now handled by theme.js to centralize UI updates.
    // Kept for compatibility, but the logic is in theme.js.
}
