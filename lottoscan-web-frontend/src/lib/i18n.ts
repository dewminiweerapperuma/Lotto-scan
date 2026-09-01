export type Language = "en" | "si";

export interface Translations {
  [key: string]: {
    en: string;
    si: string;
  };
}

export const TRANSLATIONS: Translations = {
  // Navigation
  nav_home: { en: "Home", si: "මුල් පිටුව" },
  nav_results: { en: "Results", si: "ප්‍රතිඵල" },
  nav_check: { en: "Check Ticket", si: "ටිකට් පත පරීක්ෂා කරන්න" },
  nav_about: { en: "About", si: "අප ගැන" },
  nav_admin: { en: "Admin Login", si: "ඇඩ්මින් පිවිසුම" },
  nav_dashboard: { en: "Dashboard", si: "පුවරුව" },
  nav_check_btn: { en: "Check My Ticket →", si: "මගේ ටිකට් පත පරීක්ෂා කරන්න →" },

  // Hero Section
  hero_tag: { en: "Official Sri Lanka Lottery Checker", si: "නිල ශ්‍රී ලංකා ලොතරැයි පරීක්ෂකය" },
  hero_title_1: { en: "Check Your Lottery", si: "ඔබේ ලොතරැයි පත" },
  hero_title_2: { en: "Ticket Instantly", si: "වහාම පරීක්ෂා කරන්න" },
  hero_subtitle: {
    en: "Real-time winning numbers and daily jackpot updates for all 16 official NLB & DLB Sri Lankan lotteries.",
    si: "සියලුම ජාතික ලොතරැයි මණ්ඩලයේ සහ සංවර්ධන ලොතරැයි මණ්ඩලයේ ලොතරැයි දිනුම් අංක වහාම පරීක්ෂා කරන්න."
  },

  // Lottery Grid
  grid_tag_live: { en: "Live Today's Results", si: "අද දින සජීවී ප්‍රතිඵල" },
  grid_tag_official: { en: "Official Daily Draws", si: "නිල දෛනික දිනුම් ඇදීම්" },
  grid_title: { en: "All 16 Sri Lankan Lotteries", si: "සියලුම ශ්‍රී ලංකා ලොතරැයි 16" },
  grid_subtitle: {
    en: "Today's winning jackpot prizes & results from official NLB & DLB feeds",
    si: "නිල ජාතික සහ සංවර්ධන ලොතරැයි මණ්ඩල දත්ත මගින් අද දින දිනුම් මුදල් සහ ප්‍රතිඵල"
  },
  grid_prize_label: { en: "Today's Winning Prize", si: "අද දිනුම් මුදල" },
  grid_results_label: { en: "Today's Results", si: "අද ප්‍රතිඵල" },
  grid_loading: { en: "Loading live results…", si: "සජීවී ප්‍රතිඵල ලබාගනිමින්..." },
  grid_pending: { en: "Pending", si: "බලාපොරොත්තුවෙන්" },

  // Ticket Checker
  checker_title: { en: "Check Your Ticket", si: "ඔබේ ටිකට් පත පරීක්ෂා කරන්න" },
  checker_subtitle: {
    en: "Type your ticket numbers below or scan your ticket QR code to check if you won.",
    si: "ඔබ ජයග්‍රහණය කර ඇත්දැයි බැලීමට ඔබේ අංක ඇතුළත් කරන්න හෝ QR කේතය ස්කෑන් කරන්න."
  },
  checker_scan_qr: { en: "Scan Ticket QR Code", si: "QR කේතය ස්කෑන් කරන්න" },
  checker_close_camera: { en: "Close Camera", si: "කැමරාව වසන්න" },
  checker_num_label: { en: "Ticket Numbers (Enter up to 5 numbers)", si: "ටිකට් අංක (අංක 5ක් දක්වා ඇතුළත් කරන්න)" },
  checker_letter_label: { en: "Lagna / Letter (optional)", si: "ලග්නය / අකුර (අවශ්‍ය නම් පමණි)" },
  checker_date_label: { en: "Draw Date", si: "දිනුම් ඇදීමේ දිනය" },
  checker_lottery_label: { en: "Lottery Name (optional)", si: "ලොතරැයියේ නම (අවශ්‍ය නම් පමණි)" },
  checker_button: { en: "Check My Numbers", si: "මගේ අංක පරීක්ෂා කරන්න" },
  checker_checking: { en: "Checking Ticket…", si: "පරීක්ෂා කරමින් පවතී..." },
  checker_clear: { en: "Clear All", si: "සියල්ල ඉවත් කරන්න" },

  // Quick Checker
  quick_tag: { en: "Quick Check", si: "ක්ෂණික පරීක්ෂාව" },
  quick_title: { en: "Enter Your Numbers", si: "ඔබේ අංක ඇතුළත් කරන්න" },
  quick_subtitle: { en: "Type the numbers from your ticket below", si: "ඔබේ ටිකට් පතේ ඇති අංක පහතින් ටයිප් කරන්න" },

  // Results Page
  results_title: { en: "Latest Lottery Results", si: "නවමු ලොතරැයි ප්‍රතිඵල" },
  results_subtitle: { en: "Official daily winning draw numbers for NLB & DLB lotteries", si: "නිල ලොතරැයි ජයග්‍රාහී දිනුම් අංක" },
  results_filter_search: { en: "Search Lottery", si: "ලොතරැයිය සොයන්න" },
  results_filter_type: { en: "Lottery Type", si: "ලොතරැයි වර්ගය" },
  results_all_types: { en: "All Lotteries", si: "සියලුම ලොතරැයි" },
  results_filter_from: { en: "From Date", si: "සිට දිනය" },
  results_filter_to: { en: "To Date", si: "දක්වා දිනය" },
  results_check_win: { en: "Check if you won →", si: "දිනුම් පරීක්ෂා කරන්න →" },

  // Footer
  footer_desc: {
    en: "Official real-time results and winning prize checker for National Lotteries Board (NLB) and Development Lotteries Board (DLB) of Sri Lanka.",
    si: "ජාතික ලොතරැයි මණ්ඩලයේ සහ සංවර්ධන ලොතරැයි මණ්ඩලයේ නිල සජීවී ප්‍රතිඵල පරීක්ෂකය."
  },
  footer_quick_links: { en: "Quick Links", si: "ඉක්මන් සබැඳි" },
  footer_rights: { en: "All rights reserved. Official Sri Lankan Lottery Data.", si: "සියලුම හිමිකම් ඇවිරිණි. නිල ශ්‍රී ලංකා ලොතරැයි දත්ත." },

  // PDF Download
  download_pdf: { en: "Download PDF", si: "PDF ඩවුන්ලෝඩ්" },
  download_official_pdf: { en: "Download Official PDF Results 📄", si: "නිල PDF පත්‍රිකාව ඩවුන්ලෝඩ් කරන්න 📄" },
};

export const LOTTERY_SINHALA_NAMES: Record<string, string> = {
  "Govisetha": "ගොවිසෙත",
  "Mahajana Sampatha": "මහජන සම්පත",
  "Mega Power": "මෙගා පවර්",
  "Dhana Nidhanaya": "ධන නිධානය",
  "Handahana": "හඳහන",
  "Ada Sampatha": "අද සම්පත",
  "NLB Jaya": "ජය",
  "Suba Dawasak": "සුබ දවසක්",
  "Ada Kotipathi": "අද කෝටිපති",
  "Shanida Wasanawa": "ශනිදා වාසනාව",
  "Lagna Wasanawa": "ලග්න වාසනාව",
  "Supiri Dhana Sampatha": "සුපිරි ධන සම්පත",
  "Super Ball": "සුපර් බෝල්",
  "Kapruka": "කප්රුක",
  "Sasiri": "සසිරි",
  "Jaya Sampatha": "ජය සම්පත",
};

export function getTranslation(key: string, lang: Language): string {
  const item = TRANSLATIONS[key];
  if (!item) return key;
  return item[lang] || item.en || key;
}

export function getLotteryName(item?: string | { name?: string; nameSi?: string; lottery_name?: string }, lang: Language = "en"): string {
  if (!item) return "";
  const name = typeof item === "string" ? item : item.name || item.lottery_name || "";
  const nameSi = typeof item === "object" ? item.nameSi : undefined;

  if (lang === "si") {
    if (nameSi) return nameSi;
    for (const [enName, siName] of Object.entries(LOTTERY_SINHALA_NAMES)) {
      if (enName.toLowerCase() === name.toLowerCase()) {
        return siName;
      }
    }
  }
  return name;
}
