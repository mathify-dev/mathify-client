import axios from 'axios';

// Get the base URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'; // Fallback for local dev

// Setup Axios interceptors
const setupAxiosInterceptors = () => {
  // Request interceptor to add JWT token
  axios.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor for handling errors
  axios.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      if (error.response && error.response.status === 401) {
        localStorage.removeItem('token');
        
      }
      return Promise.reject(error);
    }
  );
};

// Initialize interceptors
setupAxiosInterceptors();

/**
 * Makes an API request with the specified method, URL, payload, and params
 * @param {string} method - HTTP method ('get', 'post', 'put', 'delete', etc.)
 * @param {string} url - API endpoint path (e.g., '/users')
 * @param {Object} [payload] - Request body data (for POST, PUT, etc.)
 * @param {Object} [params] - Query parameters (for GET, etc.)
 * @param {Object} [axiosConfig] - Additional Axios config (e.g., responseType)
 * @returns {Promise} - Resolves with response data or rejects with error
 */
const makeRequest = async (method, url, payload = null, params = null, axiosConfig = {}) => {
  try {
    // Prepend the base URL to the provided endpoint
    const fullUrl = `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;

    const config = {
      method: method.toLowerCase(),
      url: fullUrl,
      ...(payload && { data: payload }),
      ...(params && { params }),
      ...axiosConfig
    };

    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`${method.toUpperCase()} Error:`, error.response?.data || error.message);
    throw error;
  }
};

export default makeRequest;

// Example usage:
/*
// GET request with params
makeRequest('get', '/users', null, { id: 123, filter: 'active' })
  .then(data => console.log('GET Response:', data))
  .catch(error => console.error('GET Failed:', error));

// POST request with payload
const userData = { name: 'John Doe', email: 'john@example.com', age: 30 };
makeRequest('post', '/users', userData)
  .then(data => console.log('POST Response:', data))
  .catch(error => console.error('POST Failed:', error));
*/