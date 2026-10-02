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

  // ================= Agent & Admin Translations =================
  // Agency Profile Header
  agent_portal_title: { en: "Agency View", si: "නියෝජිත පුවරුව" },
  agent_dual_dealer: { en: "Dual Dealer (NLB & DLB)", si: "ද්විත්ව නියෝජිත (NLB සහ DLB)" },
  agent_nlb_dealer: { en: "NLB Dealer", si: "NLB නියෝජිත" },
  agent_dlb_dealer: { en: "DLB Dealer", si: "DLB නියෝජිත" },
  agent_verified_active: { en: "Verified Active", si: "සක්‍රීයව පවතී" },
  agent_official_id: { en: "Official Agent ID", si: "නිල නියෝජිත අංකය" },
  agent_refresh: { en: "Refresh", si: "යාවත්කාලීන කරන්න" },
  agent_sign_out: { en: "Sign Out", si: "ඉවත් වන්න" },

  // Agency Dashboard KPIs
  agent_payouts_today: { en: "Payouts Handled Today", si: "අද ගෙවූ දිනුම් මුදල්" },
  agent_tickets_paid_count: { en: "winning tickets paid", si: "ගෙවන ලද දිනුම් ටිකට්පත්" },
  agent_claims_paid: { en: "Winning Claims Paid", si: "ගෙවූ දිනුම් හිමිකම්" },
  agent_claims_tickets: { en: "Tickets", si: "ටිකට්පත්" },
  agent_recorded_payouts: { en: "Recorded counter payouts", si: "කවුන්ටර මගින් සටහන් වූ ගෙවීම්" },
  agent_registered_staff: { en: "Registered Staff & Counters", si: "ලියාපදිංචි සේවකයන් සහ කවුන්ටර" },
  agent_staff_count: { en: "Staff", si: "සේවකයින්" },
  agent_assigned_branches: { en: "Assigned to counter branches", si: "ශාඛා වෙත අනුයුක්ත" },
  agent_settlement_date: { en: "Settlement Date", si: "බේරුම්කරණ දිනය" },
  agent_active_cycle: { en: "Active Reconciliation Cycle", si: "සක්‍රීය ගිණුම්කරණ චක්‍රය" },

  // Command Center / Quick Links
  agent_command_hub: { en: "Agency Operations Command Hub", si: "නියෝජිත මෙහෙයුම් විධාන මධ්‍යස්ථානය" },
  agent_bulk_scanner_title: { en: "Continuous Bulk Scanner", si: "අඛණ්ඩ තොග ස්කෑනරය" },
  agent_bulk_scanner_desc: { en: "High-speed camera & laser barcode gun scanning with 2.5s latch & live duplicate rejection", si: "අධිවේගී කැමරා සහ බාර්කෝඩ් ස්කෑනරය මගින් ක්ෂණිකව ටිකට්පත් පරීක්ෂාව සහ ගෙවීම්" },
  agent_launch_scanner: { en: "Launch Scanner", si: "ස්කෑනරය අරඹන්න" },

  agent_orders_title: { en: "Daily Orders & Indents", si: "දෛනික ඇණවුම් සහ බෙදාහැරීම්" },
  agent_orders_desc: { en: "Counter-wise ticket distribution matrix, daily returns, and sales commission calculations", si: "කවුන්ටර අනුව ටිකට් බෙදාහැරීම, රිටන් ටිකට් සහ විකුණුම් කොමිස් ගණනය කිරීම්" },
  agent_manage_orders: { en: "Manage Orders", si: "ඇණවුම් කළමනාකරණය" },

  agent_staff_title: { en: "Counter Staff & Sellers", si: "කවුන්ටර සේවකයින් සහ අලෙවිකරුවන්" },
  agent_staff_desc: { en: "Roster of ticket sellers, counter branch locations, commission rates, and payouts", si: "ලොතරැයි අලෙවිකරුවන්, ශාඛා, කොමිස් අනුපාත සහ ගෙවීම් වාර්තා" },
  agent_view_staff: { en: "View Staff Roster", si: "සේවක නාමාවලිය බලන්න" },

  agent_claims_audit_title: { en: "Winning Claims Audit", si: "දිනුම් හිමිකම් විගණනය" },
  agent_claims_audit_desc: { en: "Reconcile paid ticket serials against QuestDB with duplicate claim fraud protection", si: "ද්විත්ව ගෙවීම් වැළැක්වීම සමඟ ගෙවූ ටිකට්පත් අංක තහවුරු කිරීම" },
  agent_audit_claims: { en: "Audit Claims", si: "හිමිකම් විගණනය" },

  // Recent Claims Ledger (Dashboard)
  agent_recent_payouts_title: { en: "Recent Winning Ticket Payouts Processed", si: "මෑතකදී ගෙවන ලද දිනුම් ටිකට්පත්" },
  agent_recent_payouts_desc: { en: "Verified ticket serials recorded under your agency code", si: "ඔබගේ නියෝජිත අංකය යටතේ සටහන් වූ තහවුරු කළ ටිකට්පත්" },
  agent_full_ledger: { en: "Full Payout Ledger →", si: "සම්පූර්ණ ගෙවීම් ලේඛනය →" },
  agent_no_payouts_today: { en: "No ticket payouts recorded today yet.", si: "අද දින මෙතෙක් කිසිදු දිනුම් ගෙවීමක් සටහන් වී නොමැත." },
  agent_no_payouts_hint: { en: "Use the Bulk Scanner or Record Claim tool to verify customer tickets.", si: "පාරිභෝගික ටිකට්පත් පරීක්ෂා කිරීමට තොග ස්කෑනරය භාවිතා කරන්න." },
  table_serial: { en: "Serial", si: "අනුක්‍රමික අංකය" },
  table_lottery: { en: "Lottery", si: "ලොතරැයිය" },
  table_board: { en: "Board", si: "මණ්ඩලය" },
  table_tier: { en: "Tier", si: "කාණ්ඩය" },
  table_counter_staff: { en: "Counter Staff", si: "කවුන්ටර සේවක" },
  table_prize: { en: "Prize (Rs.)", si: "ත්‍යාගය (රු.)" },
  table_status: { en: "Status", si: "තත්ත්වය" },
  table_paid: { en: "Paid ✓", si: "ගෙවන ලදී ✓" },

  // Daily Orders & Commission Page
  orders_page_title: { en: "Daily Orders & Commission", si: "දෛනික ඇණවුම් සහ කොමිස් මුදල්" },
  orders_page_subtitle: { en: "Create day-by-day ticket order allocations for sellers and calculate commissions automatically.", si: "අලෙවිකරුවන් සඳහා දිනෙන් දින ටිකට්පත් බෙදාහැරීම සහ කොමිස් මුදල් ස්වයංක්‍රීයව ගණනය කරන්න." },
  orders_back_dashboard: { en: "← Dashboard", si: "← පුවරුව" },
  orders_manage_sellers: { en: "Manage / Delete Sellers", si: "අලෙවිකරුවන් කළමනාකරණය / ඉවත් කිරීම" },
  orders_add_seller: { en: "Add Seller", si: "අලෙවිකරුවෙකු එක් කරන්න" },
  orders_save_sheet: { en: "Save Order Sheet", si: "ඇණවුම් පත්‍රිකාව සුරකින්න" },
  orders_export_print: { en: "Export / Print Sheet", si: "මුද්‍රණය කරන්න / පිටපත් කරන්න" },
  orders_select_date: { en: "Select Order Date:", si: "ඇණවුම් දිනය තෝරන්න:" },
  orders_today: { en: "Today", si: "අද" },
  orders_yesterday: { en: "Yesterday", si: "ඊයේ" },
  orders_2days_ago: { en: "2 Days Ago", si: "දින 2කට පෙර" },
  orders_viewing_for: { en: "Viewing Sheet For:", si: "පෙන්වන්නේ:" },

  orders_total_tickets: { en: "Total Tickets", si: "මුළු ටිකට්පත්" },
  orders_total_after_add: { en: "Total after adding additional", si: "අතිරේක ටිකට්පත් එකතු කළ පසු මුළු ගණන" },
  orders_remaining_tickets: { en: "Remaining Tickets", si: "ඉතිරි ටිකට්පත්" },
  orders_remaining_desc: { en: "End-of-day unsold tickets across sellers", si: "දිනය අවසානයේ අලෙවිකරුවන් සතු ඉතිරි ටිකට්පත්" },
  orders_unsold_returns: { en: "Unsold Returns", si: "රිටන් ටිකට්පත්" },
  orders_unsold_returns_desc: { en: "Net physical tickets returned to agency", si: "නියෝජිතායතනය වෙත ආපසු ලැබුණු රිටන් ටිකට්" },
  orders_net_sold: { en: "Net Tickets Sold", si: "ශුද්ධ විකුණුම් ටිකට්" },
  orders_net_sold_desc: { en: "Total billable lottery tickets sold", si: "විකිණූ මුළු ලොතරැයිපත් ගණන" },
  orders_total_payable: { en: "Total Payable (@ Rs. 35)", si: "ගෙවිය යුතු මුදල (@ රු. 35)" },
  orders_commission_label: { en: "Commission", si: "කොමිස් මුදල" },

  orders_sheet_title: { en: "Daily Order Allocation Sheet", si: "දෛනික ඇණවුම් බෙදාහැරීමේ පත්‍රිකාව" },
  orders_sheet_desc: { en: "Enter ticket order counts for each employee per lottery. The rightmost column aggregates total tickets for each lottery automatically.", si: "සෑම අලෙවිකරුවෙකුටම ලොතරැයිපත් වෙන් කිරීම් ඇතුළත් කරන්න. දකුණුපස තීරුවෙන් මුළු එකතුව ස්වයංක්‍රීයව ගණනය කෙරේ." },
  orders_employees_active: { en: "Employees Active", si: "සක්‍රීය සේවකයින්" },
  orders_lottery_seller: { en: "Lottery Name / Seller", si: "ලොතරැයියේ නම / අලෙවිකරු" },
  orders_total_tickets_col: { en: "TOTAL TICKETS", si: "මුළු ටිකට්පත්" },
  orders_lottery_total: { en: "Lottery Total", si: "ලොතරැයි එකතුව" },
  orders_row_total_ordered: { en: "TOTAL ORDERED", si: "මුළු ඇණවුම" },
  orders_row_additional: { en: "ADDITIONAL TICKETS", si: "අතිරේක ටිකට්පත්" },
  orders_row_total_issued: { en: "TOTAL TICKETS", si: "මුළු ටිකට්පත්" },
  orders_row_remaining: { en: "REMAINING TICKETS", si: "ඉතිරි ටිකට්පත්" },
  orders_row_returns: { en: "RETURNS", si: "රිටන් ටිකට්පත්" },
  orders_row_net_sold: { en: "NET SOLD", si: "ශුද්ධ විකුණුම" },
  orders_row_commission_rate: { en: "COMMISSION RATE (RS./TKT)", si: "කොමිස් අනුපාතය (රු./ටිකට්)" },
  orders_row_commission: { en: "COMMISSION", si: "කොමිස් මුදල" },
  orders_row_total_payable: { en: "TOTAL PAYABLE (@ RS. 35)", si: "ගෙවිය යුතු මුදල (@ රු. 35)" },

  // Daily Reports & Analytics
  reports_page_title: { en: "Daily Agency Sales & Winning Reports", si: "දෛනික නියෝජිත විකුණුම් සහ දිනුම් වාර්තා" },
  reports_tab_boards: { en: "🏛️ Board-Wise Summary (NLB & DLB)", si: "🏛️ මණ්ඩල අනුව සාරාංශය (NLB සහ DLB)" },
  reports_tab_counters: { en: "👥 Counter / Employee Summary", si: "👥 කවුන්ටර / සේවක සාරාංශය" },
  reports_tab_claims: { en: "💰 Winning Claims Ledger", si: "💰 දිනුම් ගෙවීම් ලේඛනය" },
  reports_record_claim: { en: "Record Winning Payout", si: "දිනුම් මුදල් ගෙවීමක් සටහන් කරන්න" },
  reports_add_staff: { en: "Add Counter Staff", si: "කවුන්ටර සේවකයෙකු එක් කරන්න" },
  reports_export_btn: { en: "Export / Print Report", si: "වාර්තාව මුද්‍රණය කරන්න" },
  reports_scan_detail_btn: { en: "Agent's Scan Detail", si: "නියෝජිත ස්කෑන් විස්තර" },
  reports_orders_btn: { en: "Daily Order Sheet", si: "දෛනික ඇණවුම් පත්‍රිකාව" },

  // Scan Detail Report
  scan_detail_page_title: { en: "Agent's Scan Detail Report", si: "නියෝජිතයාගේ ස්කෑන් විස්තර වාර්තාව" },
  scan_detail_nlb_title: { en: "NATIONAL LOTTERIES BOARD", si: "ජාතික ලොතරැයි මණ්ඩලය" },
  scan_detail_dlb_title: { en: "DEVELOPMENT LOTTERIES BOARD", si: "සංවර්ධන ලොතරැයි මණ්ඩලය" },
  scan_detail_prize: { en: "Prize", si: "ත්‍යාගය" },
  scan_detail_no_tkts: { en: "No of Tkts", si: "ටිකට්පත් ගණන" },
  scan_detail_amount: { en: "Amount (Rs.)", si: "මුදල (රු.)" },
  scan_detail_subtotal: { en: "Sub Total", si: "උප එකතුව" },
  scan_detail_grand_total: { en: "Grand Total", si: "සමස්ත එකතුව" },
  scan_detail_print_both: { en: "Print Both Boards (NLB + DLB)", si: "මණ්ඩල දෙකම මුද්‍රණය කරන්න (NLB + DLB)" },
  scan_detail_print_active: { en: "Print Current Board", si: "මෙම මණ්ඩලය මුද්‍රණය කරන්න" },

  // Employee Profile
  emp_profile_title: { en: "Employee Profile", si: "සේවක පැතිකඩ" },
  emp_active_staff: { en: "Active Staff", si: "ක්‍රියාකාරී සේවක" },
  emp_lifetime_scanned: { en: "Lifetime Scanned", si: "මුළු ස්කෑන් කළ ගණන" },
  emp_lifetime_payouts: { en: "Lifetime Payouts", si: "මුළු ගෙවූ ත්‍යාග" },
  emp_today_tickets: { en: "Today Tickets", si: "අද ටිකට් ගණන" },
  emp_today_payout: { en: "Today Payout", si: "අද ගෙවූ මුදල" },
  emp_tab_sessions: { en: "Scan Sessions", si: "ස්කෑන් වාරයන්" },
  emp_tab_breakdown: { en: "Prize Breakdown", si: "ත්‍යාග විශ්ලේෂණය" },
  emp_tab_claims: { en: "Winning Claims", si: "දිනුම් ටිකට්පත්" },
  emp_start_session: { en: "Start New Scan Session", si: "නව ස්කෑන් වාරයක් අරඹන්න" },

  // Super Admin Navigation
  super_nav_dashboard: { en: "National Dashboard", si: "ජාතික උපකරණ පුවරුව" },
  super_nav_agents: { en: "Area Agencies", si: "ප්‍රාදේශීය නියෝජිතායතන" },
  super_nav_draws: { en: "Draws & Overrides", si: "දිනුම් ඇදීම් සහ අංක" },
  super_nav_scrapers: { en: "Crawler & Scrapers", si: "දත්ත ලබාගැනීම් (Scrapers)" },
  super_nav_claims: { en: "Duplicate Claims", si: "ද්විත්ව හිමිකම් පරීක්ෂාව" },
  super_nav_logs: { en: "Audit Logs", si: "විගණන සටහන්" },
  super_governance_hub: { en: "Governance Hub", si: "පාලන මධ්‍යස්ථානය" },
  super_subsystems: { en: "Subsystems", si: "උප පද්ධති" },

  // Login Pages
  login_admin_access: { en: "Admin Access", si: "පරිපාලක පිවිසුම" },
  login_admin_subtitle: { en: "Sign in to manage lottery results", si: "ලොතරැයි ප්‍රතිඵල කළමනාකරණය සඳහා පිවිසෙන්න" },
  login_agent_title: { en: "Lottery Agent Sign-In", si: "ලොතරැයි නියෝජිත පිවිසුම" },
  login_agent_subtitle: { en: "Access your counter sales, live ticket scans, staff indents, and payout reconciliation", si: "කවුන්ටර විකුණුම්, සජීවී ටිකට්පත් ස්කෑන් කිරීම්, සහ ගිණුම්කරණය සඳහා පිවිසෙන්න" },
  login_email_label: { en: "Email Address", si: "විද්‍යුත් තැපැල් ලිපිනය" },
  login_password_label: { en: "Password", si: "මුරපදය" },
  login_signin_btn: { en: "Sign In", si: "පිවිසෙන්න" },
  login_dealer_code_label: { en: "Dealer Code or Email", si: "නියෝජිත අංකය හෝ විද්‍යුත් තැපෑල" },

  // Scanner Page & Controls
  scan_single_checker: { en: "← Single Checker", si: "← තනි ටිකට් පරීක්ෂාව" },
  scan_title: { en: "Bulk Ticket Scanner", si: "ලොතරැයි තොග ස්කෑනරය" },
  scan_subtitle: {
    en: "Session-wise lottery ticket scanner with live Sri Lankan prize breakdown slips (40*, 80*, 120*...) & employee profiling.",
    si: "ශ්‍රී ලංකා ත්‍යාග වවුචර් පත්‍රිකා (40*, 80*, 120*...) සහ සේවක පැතිකඩ සමඟ සජීවී ටිකට්පත් ස්කෑනරය."
  },
  scan_sound_on: { en: "Sound ON", si: "ශබ්දය ක්‍රියාත්මකයි" },
  scan_sound_off: { en: "Sound OFF", si: "ශබ්දය අක්‍රියයි" },
  scan_view_live_slip: { en: "View Live Slip", si: "ගෙවීම් පත්‍රිකාව බලන්න" },
  scan_employee_profile: { en: "Employee Profile", si: "සේවක පැතිකඩ" },
  scan_finish_save: { en: "Finish & Save Session", si: "වාරය අවසන් කර සුරකින්න" },
  scan_switch_staff: { en: "Switch Staff", si: "සේවකයා මාරු කරන්න" },
  scan_cancel_session: { en: "Cancel Session", si: "වාරය අවලංගු කරන්න" },
  scan_start_scanning_session: { en: "Start Scanning Session", si: "ස්කෑන් වාරයක් අරඹන්න" },

  // Session Banners
  scan_active_session_badge: { en: "Active Scanning Session", si: "ක්‍රියාකාරී ස්කෑන් වාරය" },
  scan_main_counter: { en: "Main Counter", si: "ප්‍රධාන කවුන්ටරය" },
  scan_no_session_title: { en: "No Active Scanning Session", si: "සක්‍රීය ස්කෑන් වාරයක් නොමැත" },
  scan_no_session_desc: {
    en: "Please enter or select an employee name before bulk scanning tickets so all results are recorded to their profile.",
    si: "සියලු ප්‍රතිඵල සේවක පැතිකඩෙහි සටහන් වීමට පෙර කරුණාකර සේවක නම ඇතුළත් කරන්න හෝ තෝරන්න."
  },
  scan_enter_emp_start_btn: { en: "Enter Employee & Start Session", si: "සේවක නම ඇතුළත් කර අරඹන්න" },

  // Metrics / KPI Cards
  scan_kpi_scanned: { en: "Total Scanned", si: "මුළු ස්කෑන් ගණන" },
  scan_kpi_tickets: { en: "Tickets", si: "ටිකට්පත්" },
  scan_kpi_winning: { en: "Winning Tickets", si: "දිනුම් ටිකට්පත්" },
  scan_kpi_win_total: { en: "Winning Total", si: "දිනුම් එකතුව" },
  scan_kpi_net_payout: { en: "Net Payout", si: "ශුද්ධ ගෙවීම" },
  scan_kpi_return_shortage: { en: "Return / Shortage (-)", si: "රිටන් / හිඟ මුදල් (-)" },
  scan_kpi_net_payout_total: { en: "Net Payout Total", si: "මුළු ගෙවීම" },
  scan_kpi_wins: { en: "wins", si: "දිනුම්" },

  // Tabs
  scan_tab_camera: { en: "Camera", si: "කැමරාව" },
  scan_tab_upload: { en: "Batch Upload", si: "තොග අප්ලෝඩ්" },
  scan_tab_gun: { en: "Barcode Gun", si: "බාර්කෝඩ් තුවක්කුව" },
  scan_tab_manual: { en: "Manual", si: "අතින් ඇතුළත්" },
  scan_tab_slip: { en: "Settlement Slip (40*, 80*...)", si: "ගෙවීම් පත්‍රිකාව (40*, 80*...)" },
  scan_tab_queue: { en: "Live Scanned List", si: "ස්කෑන් කළ ලැයිස්තුව" },
  scan_clear_all: { en: "Clear All", si: "සියල්ල ඉවත් කරන්න" },

  // LaptopQrScanner (Webcam Box)
  camera_scanner_title: { en: "Ticket Camera Scanner", si: "ටිකට්පත් කැමරා ස්කෑනරය" },
  camera_live_badge: { en: "Live Camera", si: "සජීවී කැමරාව" },
  camera_single_ticket_badge: { en: "1 Ticket at a time", si: "වරකට 1 ටිකට්පතක් පමණි" },
  camera_evaluating_ticket: { en: "Evaluating 1 Ticket... Please hold", si: "ටිකට්පත පරීක්ෂා කරමින්... කරුණාකර රැඳී සිටින්න" },
  camera_already_scanned: { en: "Already Scanned", si: "දැනටමත් ස්කෑන් කර ඇත" },
  camera_already_scanned_sub: { en: "Ticket already recorded in report", si: "මෙම ටිකට්පත දැනටමත් වාර්තාවට ඇතුළත් කර ඇත" },
  camera_ticket_scanned: { en: "Ticket Scanned", si: "ටිකට්පත ස්කෑන් කරන ලදී" },
  camera_ticket_scanned_sub: { en: "Recorded to report • Ready for next ticket", si: "වාර්තාවට සටහන් විය • ඊළඟ ටිකට්පතට සූදානම්" },
  camera_dropdown_label: { en: "Camera:", si: "කැමරාව:" },
  camera_center_qr_hint: { en: "Center QR Code or Barcode here", si: "QR කේතය හෝ බාර්කෝඩය මෙහි මධ්‍යගත කරන්න" },
  camera_connecting: { en: "Connecting to webcam...", si: "වෙබ් කැමරාවට සම්බන්ධ වෙමින්..." },
  camera_blocked_msg: {
    en: "Camera access was blocked. Please click the lock icon in your browser address bar and allow Camera access.",
    si: "කැමරා ප්‍රවේශය අවහිර කර ඇත. කරුණාකර බ්‍රවුසරයේ අගුළු (lock) අයිකනය ක්ලික් කර කැමරා ප්‍රවේශය ලබා දෙන්න."
  },
  camera_troubleshoot_title: { en: "Troubleshooting:", si: "දෝෂ නිරාකරණය:" },
  camera_troubleshoot_1: {
    en: "If using Chrome, click the lock icon next to the URL and set Camera → Allow.",
    si: "Chrome භාවිතා කරන්නේ නම්, URL අසල ඇති අගුළු (lock) අයිකනය ක්ලික් කර Camera → Allow ලෙස සකසන්න."
  },
  camera_troubleshoot_2: {
    en: "If you have OBS or other apps open, close them or select your physical webcam above.",
    si: "OBS හෝ වෙනත් යෙදුම් විවෘතව ඇත්නම්, ඒවා වසන්න හෝ ඉහතින් ඔබේ කැමරාව තෝරන්න."
  },
  camera_retry_btn: { en: "Retry Camera", si: "නැවත උත්සාහ කරන්න" },
  camera_upload_instead_btn: { en: "Upload Photo Instead", si: "ඡායාරූපයක් අප්ලෝඩ් කරන්න" },
  camera_capture_scan_btn: { en: "Capture & Scan Ticket", si: "ඡායාරූපයක් ගෙන ස්කෑන් කරන්න" },
  camera_upload_img_btn: { en: "Upload Image", si: "ඡායාරූපය අප්ලෝඩ් කරන්න" },
  camera_hold_hint_1: { en: "Hold the ticket", si: "ටිකට් පත" },
  camera_hold_hint_2: { en: "15–20 cm away", si: "සෙ.මී. 15–20ක් දුරින්" },
  camera_hold_hint_3: { en: "with good light, or tap", si: "හොඳ ආලෝකයෙන් තබන්න, නැතහොත්" },
  camera_hold_hint_4: { en: "Capture & Scan", si: "ස්කෑන් කරන්න" },
  camera_hold_hint_5: { en: "to read instantly.", si: "බොත්තම ඔබන්න." },
  camera_scanned_success: { en: "Scanned Successfully", si: "සාර්ථකව ස්කෑන් කරන ලදී" },

  // Settlement Slip View
  slip_header_title: { en: "Lottery Settlement Slip", si: "ලොතරැයි ගෙවීම් පත්‍රිකාව" },
  slip_print_btn: { en: "Print Slip", si: "මුද්‍රණය කරන්න" },
  slip_agency_name: { en: "LOTTOSCAN AGENCY", si: "ලොටෝස්කෑන් නියෝජිතායතනය" },
  slip_voucher_sub: { en: "Daily Ticket Payout & Settlement Voucher", si: "දෛනික ටිකට්පත් ගෙවීම් සහ බේරුම්කරණ වවුචරය" },
  slip_session_label: { en: "Session:", si: "වාරය:" },
  slip_emp_label: { en: "Employee:", si: "සේවක නම:" },
  slip_counter_label: { en: "Counter / Route:", si: "කවුන්ටරය / මාර්ගය:" },
  slip_datetime_label: { en: "Date & Time:", si: "දිනය සහ වේලාව:" },
  slip_scanned_label: { en: "Scanned Tickets:", si: "ස්කෑන් කළ ටිකට්පත්:" },
  slip_total_won: { en: "total", si: "මුළු" },
  slip_won_count: { en: "won", si: "දිනුම්" },
  slip_col_prize: { en: "Prize Tier", si: "දිනුම් කාණ්ඩය" },
  slip_col_qty: { en: "Qty", si: "ප්‍රමාණය" },
  slip_col_subtotal: { en: "Subtotal (Rs.)", si: "උප එකතුව (රු.)" },
  slip_winning_total: { en: "Winning Total", si: "දිනුම් එකතුව" },
  slip_return_shortage: { en: "Return / Shortage (-)", si: "රිටන් / හිඟ මුදල් (-)" },
  slip_net_payout_amount: { en: "Net Payout Amount", si: "ශුද්ධ ගෙවීම් එකතුව" },
  slip_seller_sign: { en: "Seller / Counter Staff", si: "විකුණුම්කරු / කවුන්ටර සේවක" },
  slip_officer_sign: { en: "Agency Officer Sign", si: "නියෝජිත නිලධාරී අත්සන" },
  slip_footer_notice: {
    en: "Generated via LottoScan POS • Valid Sri Lanka Lottery Settlement",
    si: "LottoScan POS මගින් නිකුත් කරන ලදී • වලංගු ශ්‍රී ලංකා ලොතරැයි බේරුම්කරණය"
  },
  slip_close_btn: { en: "Close", si: "වසන්න" },

  // Batch Upload, Laser Gun, Manual Forms
  scan_upload_title: { en: "Upload Multiple Ticket Photos", si: "ටිකට්පත් ඡායාරූප කිහිපයක් අප්ලෝඩ් කරන්න" },
  scan_upload_desc: {
    en: "Select multiple ticket photos. LottoScan will OCR and decode every ticket in parallel.",
    si: "ටිකට්පත් ඡායාරූප කිහිපයක් තෝරන්න. LottoScan මඟින් සියල්ල එකවර කියවනු ඇත."
  },
  scan_upload_browse_btn: { en: "Browse Multiple Files...", si: "ගොනු තෝරන්න..." },
  scan_gun_title: { en: "USB / Bluetooth Laser Scanner Gun Active", si: "බාර්කෝඩ් ස්කෑනර් තුවක්කුව සක්‍රීයයි" },
  scan_gun_desc: {
    en: "Point your handheld barcode scanner gun at the ticket barcode and pull the trigger.",
    si: "බාර්කෝඩ් තුවක්කුව ටිකට් පත වෙත යොමු කර බොත්තම ඔබන්න."
  },
  scan_gun_listening: { en: "Listening for hardware scanner inputs...", si: "බාර්කෝඩ් කියවීම් සඳහා සවන් දෙමින් පවතී..." },
  scan_manual_title: { en: "Manual Rapid Ticket Entry", si: "අතින් ටිකට්පත් ඇතුළත් කිරීම" },
  scan_manual_game: { en: "Lottery Game", si: "ලොතරැයි වර්ගය" },
  scan_manual_lagna: { en: "Lagna / Letter", si: "ලග්නය / අකුර" },
  scan_manual_numbers: { en: "Ticket Numbers", si: "ටිකට්පත් අංක" },
  scan_manual_serial: { en: "Ticket Serial (Optional)", si: "ටිකට්පත් අංකය (විකල්ප)" },
  scan_manual_add_btn: { en: "Add Ticket to Batch", si: "ටිකට් පත එකතු කරන්න" },

  // Audit Table & Filter Tabs
  scan_tab_all: { en: "All", si: "සියල්ල" },
  scan_tab_winners: { en: "Winners", si: "දිනුම්" },
  scan_audit_table_title: { en: "Itemized Scanned Ticket Audit Table", si: "ස්කෑන් කළ ටිකට්පත් විගණන ලැයිස්තුව" },
  scan_table_serial: { en: "Ticket Serial", si: "ටිකට් අංකය" },
  scan_table_board: { en: "Board", si: "මණ්ඩලය" },
  scan_table_game: { en: "Lottery Game", si: "ලොතරැයිය" },
  scan_table_numbers: { en: "Ticket Numbers", si: "අංක" },
  scan_table_lagna: { en: "Lagna", si: "ලග්නය" },
  scan_table_status: { en: "Result Status", si: "ප්‍රතිඵලය" },
  scan_table_tier: { en: "Prize Tier Detail", si: "ත්‍යාග කාණ්ඩය" },
  scan_table_prize: { en: "Prize Amount", si: "ත්‍යාග මුදල" },
  scan_table_action: { en: "Action", si: "ක්‍රියාව" },
  scan_status_winner: { en: "WINNER", si: "දිනුම්" },
  scan_status_no_match: { en: "No Match", si: "දිනුම් නැත" },
  scan_status_expired: { en: "EXPIRED (>6m)", si: "කල් ඉකුත් වී ඇත (>මාස 6)" },

  // Modals
  scan_modal_start_title: { en: "Start Scanning Session", si: "ස්කෑන් වාරයක් අරඹන්න" },
  scan_modal_start_desc: {
    en: "Enter the employee name before scanning tickets. All results will be recorded directly into their profile.",
    si: "ටිකට්පත් ස්කෑන් කිරීමට පෙර සේවක නම ඇතුළත් කරන්න. සියලු ප්‍රතිඵල ඔවුන්ගේ පැතිකඩෙහි සටහන් වේ."
  },
  scan_modal_choose_existing: { en: "Choose Existing Staff", si: "ලියාපදිංචි සේවකයින්" },
  scan_modal_enter_new: { en: "+ Enter New Employee", si: "+ නව සේවකයෙකු ඇතුළත් කරන්න" },
  scan_modal_select_staff: { en: "Select Registered Staff / Counter", si: "ලියාපදිංචි සේවකයා / කවුන්ටරය තෝරන්න" },
  scan_modal_emp_name: { en: "Employee / Seller Name", si: "සේවක / විකුණුම්කරු නම" },
  scan_modal_counter_name: { en: "Counter Name / Route", si: "කවුන්ටරය / මාර්ගය" },
  scan_modal_initial_return: { en: "Initial Return / Shortage (Rs.) (Optional)", si: "ආරම්භක රිටන් / හිඟ මුදල් (රු.) (විකල්ප)" },
  scan_modal_cancel: { en: "Cancel", si: "අවලංගු කරන්න" },
  scan_modal_start_btn: { en: "Start Scanning Session", si: "ස්කෑන් වාරය අරඹන්න" },
  scan_modal_complete_title: { en: "Session Saved to Profile!", si: "වාරය සේවක පැතිකඩෙහි සුරකින ලදී!" },
  scan_modal_complete_desc: {
    en: "All winning claims recorded and settlement voucher generated.",
    si: "සියලු දිනුම් හිමිකම් සටහන් කර ගෙවීම් වවුචරය සකස් කර ඇත."
  },
  scan_modal_next_session: { en: "Next Session", si: "මීළඟ වාරය" },
  scan_modal_view_profile: { en: "View Profile", si: "පැතිකඩ බලන්න" },
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
