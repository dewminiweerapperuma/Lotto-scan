import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("lottoscan_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("lottoscan_token");
      localStorage.removeItem("lottoscan_user");
    }
    return Promise.reject(err);
  }
);

export const lottery = {
  getLivePrizes: () => apiClient.get("/lottery/live-prizes"),
  checkTicket: (ticketNumbers: number[], drawDate?: string, lotteryName?: string, letter?: string) =>
    apiClient.post("/lottery/check-ticket-numbers", { ticket_numbers: ticketNumbers, draw_date: drawDate, lottery_name: lotteryName || undefined, letter: letter || undefined }),
  getLatestResults: (limit = 10) => apiClient.get(`/lottery/latest-results?limit=${limit}`),
  getAllDraws: (from?: string, to?: string) => apiClient.get(`/lottery/all-draws${from ? `?from=${from}&to=${to}` : ""}`),
  uploadResults: (formData: FormData) => apiClient.post("/lottery/upload-results-pdf", formData, { headers: { "Content-Type": "multipart/form-data" } }),
  fetchToday: () => apiClient.post("/lottery/fetch-today"),
  getScrapeLogs: (limit = 30) => apiClient.get(`/lottery/scrape-logs?limit=${limit}`),
  getStatistics: (from?: string, to?: string) => apiClient.get(`/lottery/statistics${from ? `?from=${from}&to=${to}` : ""}`),
  getPrizes: (lotteryName?: string) => apiClient.get(`/lottery/prizes${lotteryName ? `?lottery_name=${lotteryName}` : ""}`),
};

export const auth = {
  login: (email: string, password: string) => apiClient.post("/auth/login", { email, password }),
  register: (email: string, password: string, role = "user") => apiClient.post("/auth/register", { email, password, role }),
  me: () => apiClient.get("/auth/me"),
};

export default apiClient;
