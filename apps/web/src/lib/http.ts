// apps/web/src/lib/http.ts
import axios from "axios";
import { getToken } from "./storage";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";

export const http = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true
});

http.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});