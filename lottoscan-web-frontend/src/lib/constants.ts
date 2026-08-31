export interface LotteryInfo {
  name: string;
  topPrize: string;
  board: string;
  drawNumber?: string;
  letter?: string;
  winningNumbers?: number[];
}

// Static lottery metadata — results are fetched dynamically from the scraper
export const LOTTERIES: LotteryInfo[] = [
  // NLB (National Lotteries Board)
  { name: "Govisetha",         topPrize: "—", board: "NLB" },
  { name: "Mahajana Sampatha", topPrize: "—", board: "NLB" },
  { name: "Mega Power",        topPrize: "—", board: "NLB" },
  { name: "Dhana Nidhanaya",   topPrize: "—", board: "NLB" },
  { name: "Handahana",         topPrize: "—", board: "NLB" },
  { name: "Ada Sampatha",      topPrize: "—", board: "NLB" },
  { name: "NLB Jaya",          topPrize: "—", board: "NLB" },
  { name: "Suba Dawasak",      topPrize: "—", board: "NLB" },
  // DLB (Development Lotteries Board)
  { name: "Ada Kotipathi",         topPrize: "—", board: "DLB" },
  { name: "Shanida Wasanawa",      topPrize: "—", board: "DLB" },
  { name: "Lagna Wasanawa",        topPrize: "—", board: "DLB" },
  { name: "Supiri Dhana Sampatha", topPrize: "—", board: "DLB" },
  { name: "Super Ball",            topPrize: "—", board: "DLB" },
  { name: "Kapruka",               topPrize: "—", board: "DLB" },
  { name: "Sasiri",                topPrize: "—", board: "DLB" },
  { name: "Jaya Sampatha",         topPrize: "—", board: "DLB" },
];

export const LOTTERY_EMOJIS: Record<string, string> = {
  "Ada Kotipathi": "💰", "Ada Sampatha": "🌟", "Dhana Nidhanaya": "💎",
  "Govisetha": "🌾", "Handahana": "🌙", "Jaya Sampatha": "🎯",
  "Kapruka": "🌴", "Lagna Wasanawa": "⭐", "Mahajana Sampatha": "👑",
  "Mega Power": "⚡", "NLB Jaya": "🏆", "Sasiri": "🎊",
  "Shanida Wasanawa": "🪐", "Suba Dawasak": "☀️", "Super Ball": "⚽",
  "Supiri Dhana Sampatha": "🎰",
};
