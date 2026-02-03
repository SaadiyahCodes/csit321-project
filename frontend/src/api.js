//frontend/src/api.js
import axios from "axios";

const api = axios.create({
  baseURL: "", /*url of backend http://192.168.0.109:8000*/
});

// attach token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
