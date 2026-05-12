import axios from 'axios';
import Cookies from 'js-cookie';

const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

const axiosInstance = axios.create({
  baseURL: `${backendUrl}/api`
});

// Request interceptor to add token to headers
axiosInstance.interceptors.request.use(
  (config) => {
    const token = Cookies.get('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;
