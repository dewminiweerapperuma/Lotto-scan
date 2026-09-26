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

// Verified lottery metadata with live defaults
export const LOTTERIES: LotteryInfo[] = [
  // NLB (National Lotteries Board)
  { name: "Govisetha",         nameSi: "ගොවිසෙත",         topPrize: "Rs. 84,407,825.56", board: "NLB", drawNumber: "4559", letter: "O", winningNumbers: [22, 41, 49, 58] },
  { name: "Mahajana Sampatha", nameSi: "මහජන සම්පත", topPrize: "Rs. 25,649,752.00", board: "NLB", drawNumber: "6317", letter: "U", winningNumbers: [3, 8, 3, 7, 7, 7] },
  { name: "Mega Power",        nameSi: "මෙගා පවර්",        topPrize: "Rs. 307,316,322.00", board: "NLB", drawNumber: "2665", letter: "W", winningNumbers: [26, 25, 26, 28, 53] },
  { name: "Dhana Nidhanaya",   nameSi: "ධන නිධානය",   topPrize: "Rs. 85,815,083.20", board: "NLB", drawNumber: "2347", letter: "N", winningNumbers: [16, 52, 57, 61] },
  { name: "Handahana",         nameSi: "හඳහන",         topPrize: "Rs. 3,927,325.20", board: "NLB", drawNumber: "1626", letter: "CANCER", winningNumbers: [9, 12, 13, 43] },
  { name: "Ada Sampatha",      nameSi: "අද සම්පත",      topPrize: "Rs. 2,500,000", board: "NLB", drawNumber: "0892", letter: "U", winningNumbers: [3, 7, 7, 7] },
  { name: "NLB Jaya",          nameSi: "ජය",          topPrize: "Rs. 500,000", board: "NLB", drawNumber: "0585", letter: "S", winningNumbers: [0, 2, 6, 3] },
  { name: "Suba Dawasak",      nameSi: "සුබ දවසක්",      topPrize: "Gold Coins", board: "NLB", drawNumber: "0433", letter: "AQUARIUS", winningNumbers: [43, 59, 65] },
  // DLB (Development Lotteries Board)
  { name: "Ada Kotipathi",         nameSi: "අද කෝටිපති",         topPrize: "Rs. 81,308,022", board: "DLB", drawNumber: "3117", letter: "P", winningNumbers: [10, 29, 37, 56] },
  { name: "Shanida Wasanawa",      nameSi: "ශනිදා වාසනාව",      topPrize: "Rs. 52,879,018", board: "DLB", drawNumber: "5452", letter: "G", winningNumbers: [5, 13, 25, 41] },
  { name: "Lagna Wasanawa",        nameSi: "ලග්න වාසනාව",        topPrize: "Rs. 11,523,436", board: "DLB", drawNumber: "5003", letter: "", winningNumbers: [19, 47, 51, 57] },
  { name: "Supiri Dhana Sampatha", nameSi: "සුපිරි ධන සම්පත", topPrize: "Rs. 30,747,714", board: "DLB", drawNumber: "1025", letter: "A", winningNumbers: [8, 4, 2, 9, 9, 4] },
  { name: "Super Ball",            nameSi: "සුපර් බෝල්",            topPrize: "Rs. 79,187,842", board: "DLB", drawNumber: "3291", letter: "T", winningNumbers: [39, 43, 44, 66] },
  { name: "Kapruka",               nameSi: "කප්රුක",               topPrize: "Rs. 369,316,247", board: "DLB", drawNumber: "2467", letter: "O", winningNumbers: [8, 14, 38, 74, 16] },
  { name: "Sasiri",                nameSi: "සසිරි",                topPrize: "Rs. 200,000", board: "DLB", drawNumber: "1121", letter: "", winningNumbers: [8, 13, 46] },
  { name: "Jaya Sampatha",         nameSi: "ජය සම්පත",         topPrize: "Rs. 250,000", board: "DLB", drawNumber: "499", letter: "A", winningNumbers: [2, 9, 9, 4] },
];

export const LOTTERY_EMOJIS: Record<string, string> = {
  "Ada Kotipathi": "💰", "Ada Sampatha": "🌟", "Dhana Nidhanaya": "💎",
  "Govisetha": "🌾", "Handahana": "🌙", "Jaya Sampatha": "🎯",
  "Kapruka": "🌴", "Lagna Wasanawa": "⭐", "Mahajana Sampatha": "👑",
  "Mega Power": "⚡", "NLB Jaya": "🏆", "Sasiri": "🎊",
  "Shanida Wasanawa": "🪐", "Suba Dawasak": "☀️", "Super Ball": "⚽",
  "Supiri Dhana Sampatha": "🎰",
};
