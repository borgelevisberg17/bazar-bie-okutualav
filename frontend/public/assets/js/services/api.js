// frontend/public/assets/js/services/api.js
import { getSession, logout } from "../auth.js";

/**
 * @file api.js
 * @description Centralized API service for handling all backend communication.
 * Includes intelligent error handling, environment-based base URLs, and
 * helper methods for RESTful API calls.
 */

// =============================================================
// 🌐 Environment configuration
// =============================================================
const isLocalhost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";
const API_URL = isLocalhost
    ? "http://localhost:4000/api" // Dev mode
    : "https://bie-okutuala-server.onrender.com/api"; // Production

// =============================================================
// 🧩 Generic fetch wrapper
// =============================================================
async function fetchFromAPI(endpoint, options = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // 8s timeout

    const session = getSession();
    const headers = {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...options.headers
    };

    if (session && session.accessToken) {
        headers["Authorization"] = `Bearer ${session.accessToken}`;
    }

    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers,
            signal: controller.signal
        });

        clearTimeout(timeout);

        if (response.status === 401) {
            logout();
            return;
        }

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(
                `HTTP ${response.status} - ${response.statusText} → ${errText}`
            );
        }

        const data = await response.json();
        console.log(`✅ [API] ${options.method || "GET"} ${endpoint}`, data);
        return data;
    } catch (error) {
        clearTimeout(timeout);
        console.error(`❌ [API Error] ${endpoint}:`, error.message);

        // Fallback para ambiente local ou sem rede
        if (isLocalhost && error.name === "AbortError") {
            console.warn(`⚠️ Timeout atingido ao acessar ${endpoint}.`);
        }
        throw error;
    }
}

// =============================================================
// 🧠 REST Helpers
// =============================================================
export const api = {
    get: endpoint => fetchFromAPI(endpoint),
    post: (endpoint, body) =>
        fetchFromAPI(endpoint, {
            method: "POST",
            body: JSON.stringify(body)
        }),
    put: (endpoint, body) =>
        fetchFromAPI(endpoint, {
            method: "PUT",
            body: JSON.stringify(body)
        }),
    delete: endpoint => fetchFromAPI(endpoint, { method: "DELETE" })
};

// =============================================================
// 📦 Entity-specific functions
// =============================================================
export const getCategories = () => api.get("/categories");
export const getProducts = (page = 1, limit = 12, status = "approved") => {
    const params = new URLSearchParams({ page, limit, status });
    return api.get(`/products?${params.toString()}`);
};
export const getSellers = () => api.get("/users/sellers?role=seller");

// =============================================================
// 🧰 Example of a POST helper (if needed later)
// =============================================================
// export const createProduct = (productData) => api.post("/products", productData);
