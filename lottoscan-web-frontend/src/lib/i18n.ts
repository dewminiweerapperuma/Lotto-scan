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

  // Additional Navbar Keys
  nav_bulk_scan: { en: "Bulk Scan", si: "තොග ස්කෑන්" },
  nav_login: { en: "Login", si: "පිවිසෙන්න" },
  nav_agent_login: { en: "Agent Login", si: "නියෝජිත පිවිසුම" },
  nav_super_admin_login: { en: "Super Admin Login", si: "ප්‍රධාන පරිපාලක පිවිසුම" },
  nav_governance_hub: { en: "Governance Hub", si: "පාලන මධ්‍යස්ථානය" },
  nav_agency_view: { en: "Agency View", si: "නියෝජිත පුවරුව" },
  nav_sign_out: { en: "Sign Out", si: "ඉවත් වන්න" },
  todays_live_results: { en: "Today's Live Results", si: "අද සජීවී ප්‍රතිඵල" },
  official_pdf_sheets: { en: "Official PDF Sheets", si: "නිල PDF පත්‍රිකා" },

  // Hero Section (Full)
  hero_badge: { en: "Sri Lanka's Official Real-Time Lottery Checker", si: "ශ්‍රී ලංකාවේ නිල සජීවී ලොතරැයි පරීක්ෂකය" },
  hero_title_ticket: { en: "Ticket", si: "පත" },
  hero_title_instant: { en: "Instantly", si: "වහාම පරීක්ෂා කරන්න" },
  hero_btn_check: { en: "Check My Ticket →", si: "මගේ ටිකට් පත පරීක්ෂා කරන්න →" },
  hero_btn_results: { en: "View Today's Results", si: "අද ප්‍රතිඵල බලන්න" },
  stat_lotteries: { en: "Lotteries Supported", si: "ලොතරැයි වර්ග" },
  stat_boards: { en: "Official Boards", si: "නිල මණ්ඩල (NLB & DLB)" },
  stat_data: { en: "Live Verified Data", si: "සජීවී තහවුරු කළ දත්ත" },

  // Live Draw Hero Card
  official_live_draws: { en: "Official Live Draws", si: "නිල සජීවී දිනුම් ඇදීම්" },
  draws_synced: { en: "Draws Synced", si: "දිනුම් ඇදීම් සමමුහුර්තයි" },
  connecting_boards: { en: "Connecting to NLB/DLB...", si: "NLB/DLB හා සම්බන්ධ වෙමින්..." },
  draw_no: { en: "Draw", si: "දිනුම් වාරය" },
  official_winning_numbers: { en: "Official Winning Numbers", si: "නිල ජයග්‍රාහී අංක" },
  top_jackpot_prize: { en: "Top Jackpot Prize", si: "ප්‍රධාන ජැක්පොට් දිනුම" },
  check_this_draw: { en: "Check This Draw →", si: "මෙම දිනුම පරීක්ෂා කරන්න →" },
  view_all_draws: { en: "View All Draws", si: "සියලුම දිනුම් බලන්න" },
  loading_draw: { en: "Loading draw results...", si: "දිනුම් ප්‍රතිඵල ලබාගනිමින්..." },

  // How It Works
  how_it_works_badge: { en: "HOW IT WORKS", si: "ක්‍රියා කරන ආකාරය" },
  how_it_works_title: { en: "Three simple steps", si: "සරල පියවර තුනක්" },
  how_it_works_subtitle: { en: "Check your lottery ticket in under 30 seconds", si: "තත්පර 30කින් ඔබේ ලොතරැයි පත පරීක්ෂා කරගන්න" },
  step_1_title: { en: "Scan or Enter", si: "ස්කෑන් කරන්න හෝ ඇතුළත් කරන්න" },
  step_1_desc: { en: "Scan the QR code on your ticket with your camera, or type your numbers manually", si: "ඔබගේ කැමරාවෙන් ටිකට් පතේ ඇති QR කේතය ස්කෑන් කරන්න, නැතහොත් අංක අතින් ඇතුළත් කරන්න" },
  step_2_title: { en: "Instant Check", si: "ක්ෂණික පරීක්ෂාව" },
  step_2_desc: { en: "We compare your numbers against today's official results from NLB and DLB automatically", si: "අප ඔබගේ අංක NLB සහ DLB නිල දිනුම් ප්‍රතිඵල සමඟ ස්වයංක්‍රීයව සංසන්දනය කරමු" },
  step_3_title: { en: "See Your Result", si: "ඔබේ ප්‍රතිඵලය බලන්න" },
  step_3_desc: { en: "Find out instantly if you've won and exactly how much your prize is worth", si: "ඔබ ජයග්‍රහණය කර ඇත්ද සහ ඔබේ ත්‍යාග මුදල කොපමණදැයි ක්ෂණිකව දැනගන්න" },
  how_it_works_btn: { en: "Check My Ticket Now →", si: "දැන්ම ටිකට් පත පරීක්ෂා කරන්න →" },

  // Ticket Checker UI Elements
  ticket_checker_badge: { en: "OFFICIAL LOTTERY VERIFIER", si: "නිල ලොතරැයි පරීක්ෂකය" },
  ticket_checker_header_title: { en: "Check Your Ticket", si: "ඔබේ ටිකට් පත පරීක්ෂා කරන්න" },
  ticket_checker_header_subtitle: { en: "Enter numbers or scan QR code", si: "අංක ඇතුළත් කරන්න හෝ QR කේතය ස්කෑන් කරන්න" },
  step_enter_numbers: { en: "Enter Numbers", si: "අංක ඇතුළත් කරන්න" },
  step_check: { en: "Check", si: "පරීක්ෂා කරන්න" },
  step_see_result: { en: "See Result", si: "ප්‍රතිඵලය බලන්න" },
  or_divider: { en: "OR", si: "හෝ" },
  draw_date: { en: "Draw Date", si: "දිනුම් ඇදීමේ දිනය" },
  lottery_optional: { en: "Lottery (optional)", si: "ලොතරැයිය (අවශ්‍ය නම්)" },
  auto_detect: { en: "Auto-detect", si: "ස්වයංක්‍රීයව හඳුනාගන්න" },
  check_numbers_btn: { en: "Check My Numbers →", si: "මගේ අංක පරීක්ෂා කරන්න →" },
  clear_btn: { en: "Clear", si: "මකන්න" },
  scan_ticket_heading: { en: "Scan Ticket with Camera or Upload", si: "කැමරාවෙන් ස්කෑන් කරන්න හෝ ඡායාරූපයක් එක් කරන්න" },
  scan_ticket_subheading: { en: "Use continuous camera QR reader or upload ticket image", si: "කැමරා QR ස්කෑනරය හෝ ටිකට් පතේ ඡායාරූපයක් භාවිත කරන්න" },
  open_camera_scanner: { en: "Open Camera Scanner", si: "කැමරා ස්කෑනරය විවෘත කරන්න" },
  upload_ticket_photo: { en: "Upload Ticket Photo / Barcode", si: "ටිකට් පතේ ඡායාරූපයක් එක් කරන්න" },
  first_zodiac_sign: { en: "1st Zodiac Sign (පළමු ලග්නය)", si: "පළමු ලග්නය" },
  second_zodiac_sign: { en: "2nd Zodiac Sign (දෙවන ලග්නය)", si: "දෙවන ලග්නය" },
  dual_zodiac_notice: {
    en: "Suba Dawasak tickets feature TWO zodiac signs. Select both signs printed on your ticket.",
    si: "සුබ දවසක් ලොතරැයි පතෙහි ලග්න දෙකක් ඇත. ටිකට් පතේ ඇති ලග්න දෙකම තෝරන්න."
  },
  you_won: { en: "YOU WON!", si: "ඔබ ජයග්‍රහණය කළා!" },
  no_match: { en: "No Match This Draw", si: "මෙම දිනුම් වාරයේ ගැලපීමක් නැත" },
  claim_expired: { en: "CLAIM PERIOD EXPIRED", si: "ත්‍යාග ලබා ගැනීමේ කාලය ඉකුත් වී ඇත" },
  your_numbers_lagna: { en: "Your Numbers & Lagna", si: "ඔබගේ අංක සහ ලග්නය" },
  winning_numbers_lagna: { en: "Winning Numbers & Lagna", si: "ජයග්‍රාහී අංක සහ ලග්නය" },
  share_my_win: { en: "🎊 Share My Win", si: "🎊 ජයග්‍රහණය බෙදාගන්න" },
  check_another: { en: "Check Another", si: "තවත් එකක් පරීක්ෂා කරන්න" },
  checking_numbers: { en: "Checking your numbers...", si: "ඔබගේ අංක පරීක්ෂා කරමින්..." },

  // Quick Check & Features Sections
  quick_check_badge: { en: "QUICK CHECK", si: "ක්ෂණික පරීක්ෂාව" },
  quick_check_title: { en: "Enter Your Numbers Here", si: "ඔබේ අංක මෙහි ඇතුළත් කරන්න" },
  quick_check_subtitle: { en: "Compare your ticket with today's winning numbers instantly", si: "අද දින ජයග්‍රාහී අංක සමඟ ඔබේ ටිකට් පත ක්ෂණිකව සසඳන්න" },
  feature_auto_update_title: { en: "Auto Updated", si: "ස්වයංක්‍රීයව යාවත්කාලීනයි" },
  feature_auto_update_desc: { en: "Results fetched at 11:15 PM nightly from official NLB & DLB servers", si: "සෑම දිනකම රාත්‍රී 11:15 ට නිල NLB සහ DLB සේවාදායකයන්ගෙන් ප්‍රතිඵල ලබා ගැනේ" },
  feature_mobile_title: { en: "Mobile Friendly", si: "ජංගම දුරකථන සඳහා පහසුයි" },
  feature_mobile_desc: { en: "Works on any device. Install as a web app on your phone home screen", si: "ඕනෑම උපාංගයක ක්‍රියා කරයි. ඔබගේ දුරකථනයේ යෙදුමක් ලෙස ස්ථාපනය කළ හැක" },
  feature_secure_title: { en: "Private & Secure", si: "පෞද්ගලික සහ ආරක්ෂිතයි" },
  feature_secure_desc: { en: "Your ticket numbers are never stored. All checks are processed anonymously", si: "ඔබගේ ටිකට් අංක කිසිවිටෙක සුරැකෙන්නේ නැත. සියලු පරීක්ෂාවන් නිර්නාමිකව සිදු කෙරේ" },
  feature_instant_title: { en: "Instant Results", si: "ක්ෂණික ප්‍රතිඵල" },
  feature_instant_desc: { en: "Get your detailed matching logs and results in under 2 seconds", si: "තත්පර 2ක් ඇතුළත ඔබේ සම්පූර්ණ දිනුම් වාර්තාව ලබා ගන්න" },
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
