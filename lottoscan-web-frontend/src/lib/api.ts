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
  checkTicket: (
    ticketNumbers: number[],
    drawDate?: string,
    lotteryName?: string,
    letter?: string,
    extra?: { drawNumber?: string; ticketSerial?: string; promotionalNumber?: string; zodiac?: string; zodiac2?: string }
  ) =>
    apiClient.post("/lottery/check", {
      ticket_numbers: ticketNumbers,
      draw_date: drawDate,
      lottery_name: lotteryName || undefined,
      letter: letter || undefined,
      draw_number: extra?.drawNumber || undefined,
      ticket_serial: extra?.ticketSerial || undefined,
      promotional_number: extra?.promotionalNumber || undefined,
      zodiac: extra?.zodiac || undefined,
      zodiac2: extra?.zodiac2 || undefined,
    }),
  getLatestResults: (limit = 10) => apiClient.get(`/lottery/latest-results?limit=${limit}`),
  getAllDraws: (from?: string, to?: string, lotteryName?: string, date?: string) => {
    const params = new URLSearchParams();
    if (date && date.trim()) params.set("date", date.trim());
    if (from && from.trim()) params.set("from", from.trim());
    if (to && to.trim()) params.set("to", to.trim());
    if (lotteryName && lotteryName.trim()) params.set("lottery_name", lotteryName.trim());
    const qs = params.toString();
    return apiClient.get(`/lottery/all-draws${qs ? `?${qs}` : ""}`);
  },
  uploadResults: (formData: FormData) => apiClient.post("/lottery/upload-results-pdf", formData, { headers: { "Content-Type": "multipart/form-data" } }),
  fetchToday: () => apiClient.post("/lottery/fetch-today"),
  getScrapeLogs: (limit = 30) => apiClient.get(`/lottery/scrape-logs?limit=${limit}`),
  getStatistics: (from?: string, to?: string) => apiClient.get(`/lottery/statistics${from ? `?from=${from}&to=${to}` : ""}`),
  getPrizes: (lotteryName?: string) => apiClient.get(`/lottery/prizes${lotteryName ? `?lottery_name=${lotteryName}` : ""}`),
  batchCheckTickets: (tickets: any[]) => apiClient.post("/lottery/batch-check", { tickets }),
};

export const auth = {
  login: (identifier: string, password: string) => apiClient.post("/auth/login", { identifier, password }),
  register: (data: any) => apiClient.post("/auth/register", data),
  agentLogin: (identifier: string, password: string) => apiClient.post("/auth/agent/login", { identifier, password }),
  agentRegister: (data: any) => apiClient.post("/auth/agent/register", data),
  me: () => apiClient.get("/auth/me"),
};

export const agent = {
  getDailyReport: (date?: string, agentId?: string) =>
    apiClient.get(`/agent/reports/daily?date=${date || ""}&agentId=${agentId || "default-agent"}`),
  getClaims: (date?: string, agentId?: string) =>
    apiClient.get(`/agent/claims?date=${date || ""}&agentId=${agentId || "default-agent"}`),
  recordClaim: (data: any) => apiClient.post("/agent/claims", data),
  getEmployees: (agentId?: string) =>
    apiClient.get(`/agent/employees?agentId=${agentId || "default-agent"}`),
  createEmployee: (data: any) => apiClient.post("/agent/employees", data),
  deleteEmployee: (id: string) => apiClient.delete(`/agent/employees/${id}`),
  getDailyOrders: (date?: string, agentId?: string) =>
    apiClient.get(`/agent/orders?date=${date || ""}&agentId=${agentId || "default-agent"}`),
  saveDailyOrders: (data: any) => apiClient.post("/agent/orders", data),
  getScanDetailReport: (date?: string, board?: string, agentId?: string) =>
    apiClient.get(`/agent/reports/scan-detail?date=${date || ""}${board ? `&board=${board}` : ""}&agentId=${agentId || "default-agent"}`),
};

export const superAdmin = {
  getMetrics: () => apiClient.get("/super/metrics"),
  getAgents: () => apiClient.get("/super/agents"),
  updateAgentStatus: (id: string, status: string) => apiClient.patch(`/super/agents/${id}/status`, { status }),
  overrideDraw: (data: {
    lotteryName: string;
    drawNumber: string;
    drawDate?: string;
    winningNumbers: string[] | string;
    letter?: string;
    zodiac?: string;
    promotionalCode?: string;
    topPrize?: string;
    board?: string;
  }) => apiClient.post("/super/draws/override", data),
  triggerScraper: (board: string = "ALL") => apiClient.post("/super/scraper/trigger", { board }),
  getDuplicateClaims: () => apiClient.get("/super/claims/duplicates"),
  getAuditLogs: (limit = 100) => apiClient.get(`/super/logs?limit=${limit}`),
};

export default apiClient;

