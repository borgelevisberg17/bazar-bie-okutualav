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
    const session = getSession();
    const userProfileElements = document.querySelectorAll(".menu-profile");
    const sellButton = document.querySelector(".menu-cta-button");

    if (session && session.user) {
        const { user } = session;
        userProfileElements.forEach(element => {
            element.innerHTML = `
                <div class="menu-profile-avatar">
                    <img src="${
                        user.avatar_url ||
                        "/assets/images/placeholders/avatar.png"
                    }" alt="${user.name}" class="user-avatar"/>
                </div>
                <div class="menu-profile-info">
                    <h3>Olá, ${user.name.split(" ")[0]}!</h3>
                    <a href="/profile.html">Ver Perfil</a>
                </div>
            `;
        });
        if (sellButton) {
            sellButton.textContent = "Minha Loja";
            sellButton.href = "/seller.html";
        }
    } else {
        userProfileElements.forEach(element => {
            element.innerHTML = `
                <div class="menu-profile-avatar">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                </div>
                <div class="menu-profile-info">
                    <h3>Olá, Visitante!</h3>
                    <a href="/auth/login.html">Entrar ou Cadastrar-se</a>
                </div>
            `;
        });
        if (sellButton) {
            sellButton.textContent = "Vender Agora";
            sellButton.href = "/auth/login.html";
        }
    }
}
