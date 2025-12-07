// apps/web/src/lib/api.ts
import axios from "axios";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true
});

export const authHeaders = () => {
  const token = localStorage.getItem("oc_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};