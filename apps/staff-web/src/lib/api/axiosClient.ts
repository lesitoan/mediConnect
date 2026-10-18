import axios from "axios";

export const axiosClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: Number(process.env.NEXT_PUBLIC_API_TIMEOUT) || 10000,
  withCredentials: true,
});
