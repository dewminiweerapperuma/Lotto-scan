export interface LotteryResult {
  ts: string;
  draw_date: string;
  day_of_week: string;
  lottery_name: string;
  draw_number: string;
  letter: string;
  zodiac: string;
  number_1: number;
  number_2: number;
  number_3: number;
  number_4: number;
  number_5: number;
  uploaded_by: string;
  source_file: string;
}

export interface TicketCheckResult {
  isWinner: boolean;
  matchedCount: number;
  matchedNumbers: number[];
  ticketNumbers: number[];
  winningNumbers: number[];
  prizeAmount: number;
  prizeAmountFormatted: string;
  prizeCategory: string;
  lotteryName: string;
  drawNumber: string;
  drawDate: string;
  letter?: string;
  zodiac?: string;
  message?: string;
}

export interface ScrapeLog {
  ts: string;
  source: string;
  status: "success" | "failed" | "empty";
  results_count: number;
  error_message: string;
}

export interface User {
  userId: string;
  email: string;
  role: "admin" | "user";
}

export const LOTTERIES = [
  { name: "Ada Kotipathi",       prize: "Rs. 50,000,000",  board: "DLB" },
  { name: "Ada Sampat",          prize: "Rs. 250,000",      board: "DLB" },
  { name: "Dhana Nidhanaya",     prize: "Rs. 80,000,000",  board: "DLB" },
  { name: "Govi Seth",           prize: "Rs. 60,000,000",  board: "DLB" },
  { name: "Handa Han",           prize: "Rs. 3,000,000",   board: "NLB" },
  { name: "Jaya Sampat",         prize: "Rs. 250,000",      board: "NLB" },
  { name: "Kapruka",             prize: "Rs. 150,000,000", board: "DLB" },
  { name: "Lagna Wasanawa",      prize: "Rs. 3,000,000",   board: "NLB" },
  { name: "Mahajana Sampat",     prize: "Rs. 20,000,000",  board: "DLB" },
  { name: "Mega Power",          prize: "Rs. 150,000,000", board: "NLB" },
  { name: "NLB Jaya",            prize: "Rs. 500,000",      board: "NLB" },
  { name: "Sasiri",              prize: "Rs. 200,000",      board: "NLB" },
  { name: "Shanida Wasanawa",    prize: "Rs. 50,000,000",  board: "DLB" },
  { name: "Suba Davasak",        prize: "Rs. 500,000",      board: "DLB" },
  { name: "Super Ball",          prize: "Rs. 50,000,000",  board: "NLB" },
  { name: "Supiri Dhana Sampatha", prize: "Rs. 20,000,000", board: "DLB" },
] as const;
