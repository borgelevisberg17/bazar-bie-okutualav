// frontend/public/assets/js/services/api.js
import { getSession, logout } from "../auth.js";
import { API_URL } from "../config.js";

async function fetchFromAPI(endpoint, options = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const session = getSession();
    const headers = {
        "Accept": "application/json",
        ...options.headers
    };

    if (session && session.token) {
        headers["Authorization"] = `Bearer ${session.token}`;
    }

    if (!(options.body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
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

export const api = {
    get: endpoint => fetchFromAPI(endpoint),
    post: (endpoint, body) => fetchFromAPI(endpoint, { method: "POST", body: JSON.stringify(body) }),
    put: (endpoint, body) => fetchFromAPI(endpoint, { method: "PUT", body: JSON.stringify(body) }),
    delete: endpoint => fetchFromAPI(endpoint, { method: "DELETE" }),
    postWithFile: (endpoint, formData) => fetchFromAPI(endpoint, { method: "POST", body: formData }),
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
export const getProductDetails = (productId) => api.get(`/products/${productId}/details`);
export const getProductReviews = (productId) => api.get(`/products/${productId}/reviews`);
export const getSellers = () => api.get("/users?role=seller");
export const getSellerDetails = (sellerId) => api.get(`/users/${sellerId}`);
export const getProductsBySeller = (sellerId) => api.get(`/products?sellerId=${sellerId}`);
export const getWishlist = () => api.get("/wishlist");
export const removeFromWishlist = (productId) => api.delete(`/wishlist/${productId}`);
export const getConversations = () => api.get("/messages/conversations");
export const getMessagesWithUser = (userId) => api.get(`/messages/${userId}`);
export const createMessage = (message) => api.post("/messages", message);
export const likeProduct = (productId) => api.post(`/products/${productId}/like`);
export const unlikeProduct = (productId) => api.post(`/products/${productId}/unlike`);
export const addComment = (productId, comment) => api.post(`/products/${productId}/comments`, { comment });
export const login = (email, password) => api.post('/auth/login', { email, password });
export const register = (name, email, password) => api.post('/auth/register', { name, email, password });
export const getSubscriptionStatus = () => api.get('/users/me/subscription');
export const getAllUsers = () => api.get("/users");
export const getAllProducts = () => api.get("/products");
