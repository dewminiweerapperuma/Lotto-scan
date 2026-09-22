export interface LotteryInfo {
  id?: string;
  name: string;
  nameSi?: string;
  topPrize: string;
  board: string;
  drawNumber?: string;
  letter?: string;
  winningNumbers?: number[];
}

// Static lottery metadata — results are fetched dynamically from the scraper
export const LOTTERIES: LotteryInfo[] = [
  // NLB (National Lotteries Board)
  { name: "Govisetha",         nameSi: "ගොවිසෙත",         topPrize: "—", board: "NLB" },
  { name: "Mahajana Sampatha", nameSi: "මහජන සම්පත", topPrize: "—", board: "NLB" },
  { name: "Mega Power",        nameSi: "මෙගා පවර්",        topPrize: "—", board: "NLB" },
  { name: "Dhana Nidhanaya",   nameSi: "ධන නිධානය",   topPrize: "—", board: "NLB" },
  { name: "Handahana",         nameSi: "හඳහන",         topPrize: "—", board: "NLB" },
  { name: "Ada Sampatha",      nameSi: "අද සම්පත",      topPrize: "—", board: "NLB" },
  { name: "NLB Jaya",          nameSi: "ජය",          topPrize: "—", board: "NLB" },
  { name: "Suba Dawasak",      nameSi: "සුබ දවසක්",      topPrize: "—", board: "NLB" },
  // DLB (Development Lotteries Board)
  { name: "Ada Kotipathi",         nameSi: "අද කෝටිපති",         topPrize: "—", board: "DLB" },
  { name: "Shanida Wasanawa",      nameSi: "ශනිදා වාසනාව",      topPrize: "—", board: "DLB" },
  { name: "Lagna Wasanawa",        nameSi: "ලග්න වාසනාව",        topPrize: "—", board: "DLB" },
  { name: "Supiri Dhana Sampatha", nameSi: "සුපිරි ධන සම්පත", topPrize: "—", board: "DLB" },
  { name: "Super Ball",            nameSi: "සුපර් බෝල්",            topPrize: "—", board: "DLB" },
  { name: "Kapruka",               nameSi: "කප්රුක",               topPrize: "—", board: "DLB" },
  { name: "Sasiri",                nameSi: "සසිරි",                topPrize: "—", board: "DLB" },
  { name: "Jaya Sampatha",         nameSi: "ජය සම්පත",         topPrize: "—", board: "DLB" },
];

export const LOTTERY_EMOJIS: Record<string, string> = {
  "Ada Kotipathi": "💰", "Ada Sampatha": "🌟", "Dhana Nidhanaya": "💎",
  "Govisetha": "🌾", "Handahana": "🌙", "Jaya Sampatha": "🎯",
  "Kapruka": "🌴", "Lagna Wasanawa": "⭐", "Mahajana Sampatha": "👑",
  "Mega Power": "⚡", "NLB Jaya": "🏆", "Sasiri": "🎊",
  "Shanida Wasanawa": "🪐", "Suba Dawasak": "☀️", "Super Ball": "⚽",
  "Supiri Dhana Sampatha": "🎰",
};
