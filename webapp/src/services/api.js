import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercetor para adicionar o token JWT aos cabeçalhos
apiClient.interceptors.request.use(
  (config) => {
    const userSession = localStorage.getItem('user_session');
    if (userSession) {
      const { token } = JSON.parse(userSession);
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Funções de serviço da API

// Produtos
export const getProducts = (page = 1, limit = 10) => apiClient.get(`/products?page=${page}&limit=${limit}`);
export const getProductById = (id) => apiClient.get(`/products/${id}`);

// Autenticação
export const login = (credentials) => apiClient.post('/users/login', credentials);
export const register = (userData) => apiClient.post('/users/register', userData);
export const getProfile = () => apiClient.get('/users/profile');

// ...outras funções de serviço podem ser adicionadas aqui

export default apiClient;
