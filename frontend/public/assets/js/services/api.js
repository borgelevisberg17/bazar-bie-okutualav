// frontend/public/assets/js/services/api.js

/**
 * @file api.js
 * @description Centralized API service for handling all backend communication.
 * This service encapsulates the logic for making HTTP requests to the API,
 * including error handling and data parsing. It promotes the Single Responsibility
 * Principle by separating data fetching from UI logic.
 */

/**
 * The base URL for the API, configured in config.js.
 * @type {string}
 */
import { API_URL } from '../config.js';

/**
 * A reusable fetch function to interact with the API.
 *
 * @param {string} endpoint - The API endpoint to fetch data from (e.g., "/products").
 * @param {object} [options={}] - Optional fetch options (e.g., method, headers, body).
 * @returns {Promise<any>} - A promise that resolves with the JSON data from the API.
 * @throws {Error} - Throws an error if the network response is not OK.
 */
async function fetchFromAPI(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_URL}${endpoint}`, options);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Could not fetch data from ${endpoint}:`, error);
        throw error; // Re-throw the error to be handled by the caller
    }
}

/**
 * Fetches all categories from the backend.
 * @returns {Promise<Array>} A promise that resolves to an array of category objects.
 */
export const getCategories = () => fetchFromAPI("/categories");

/**
 * Fetches all products from the backend.
 * @returns {Promise<Array>} A promise that resolves to an array of product objects.
 */
export const getProducts = () => fetchFromAPI("/products");

/**
 * Fetches all users with the "seller" role from the backend.
 * @returns {Promise<Array>} A promise that resolves to an array of seller objects.
 */
export const getSellers = () => fetchFromAPI("/users?role=seller");