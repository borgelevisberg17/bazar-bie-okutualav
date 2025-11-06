// frontend/public/assets/js/config.js

// Determine the API URL based on the environment
const API_BASE_URL = window.location.hostname === 'bazar.local'
    ? 'http://api.bazar.local/api'
    : 'https://api.bazarbieokutuala.com/api';

export const API_URL = API_BASE_URL;
