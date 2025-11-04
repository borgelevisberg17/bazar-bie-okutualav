// frontend/public/assets/js/services/api.js
import { getSession, logout } from "../auth.js";

const isLocalhost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";
const API_URL = isLocalhost
    ? "http://localhost:4000/api"
    : "https://bie-okutuala-server.onrender.com/api";

async function fetchFromAPI(endpoint, options = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const session = getSession();
    const headers = {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...options.headers
    };

    if (session && session.token) {
        headers["Authorization"] = `Bearer ${session.token}`;
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

        return await response.json();
    } catch (error) {
        clearTimeout(timeout);
        console.error(`❌ [API Error] ${endpoint}:`, error.message);
        throw error;
    }
}

export const getProductDetails = async (productId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/products/${productId}/details`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return await response.json();
    } catch (error) {
        console.error(`Failed to fetch product details for product ${productId}:`, error);
        throw error;
    }
};

export const api = {
    get: endpoint => fetchFromAPI(endpoint),
    post: (endpoint, body) => fetchFromAPI(endpoint, { method: "POST", body: JSON.stringify(body) }),
    put: (endpoint, body) => fetchFromAPI(endpoint, { method: "PUT", body: JSON.stringify(body) }),
    delete: endpoint => fetchFromAPI(endpoint, { method: "DELETE" })
};

export const getCategories = () => api.get("/categories");
export const getProducts = (page = 1, limit = 12, category = null) => {
    const params = new URLSearchParams({ page, limit, status: "approved" });
    if (category) {
        params.append('category', category);
    }
    return api.get(`/products?${params.toString()}`);
};
export const getProductById = (id) => api.get(`/products/${id}`);
export const getProductReviews = (productId) => api.get(`/products/${productId}/reviews`);
export const getSellers = () => api.get("/users?role=seller");
export const getSellerDetails = (sellerId) => api.get(`/users/${sellerId}`);
export const getProductsBySeller = (sellerId) => api.get(`/products?sellerId=${sellerId}`);
