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
  { name: "Ada Sampatha",        prize: "Rs. 250,000",      board: "NLB" },
  { name: "Dhana Nidhanya",      prize: "Rs. 80,000,000",  board: "NLB" },
  { name: "Govisetha",           prize: "Rs. 60,000,000",  board: "NLB" },
  { name: "Handahana",           prize: "Rs. 3,000,000",   board: "NLB" },
  { name: "Jaya Sampatha",       prize: "Rs. 250,000",      board: "DLB" },
  { name: "Kapruka",             prize: "Rs. 150,000,000", board: "DLB" },
  { name: "Lagna Wasanawa",      prize: "Rs. 3,000,000",   board: "DLB" },
  { name: "Mahajana Sampatha",   prize: "Rs. 20,000,000",  board: "NLB" },
  { name: "Mega Power",          prize: "Rs. 150,000,000", board: "NLB" },
  { name: "NLB Jaya",            prize: "Rs. 500,000",      board: "NLB" },
  { name: "Sasiri",              prize: "Rs. 200,000",      board: "DLB" },
  { name: "Shanida Wasanawa",    prize: "Rs. 50,000,000",  board: "DLB" },
  { name: "Suba Dawsak",         prize: "Rs. 500,000",      board: "NLB" },
  { name: "Super Ball",          prize: "Rs. 50,000,000",  board: "DLB" },
  { name: "Supiri Dhana Sampatha", prize: "Rs. 20,000,000", board: "DLB" },
] as const;
