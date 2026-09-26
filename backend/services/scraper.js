const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/questdb');

const CACHE_FILE = path.join(__dirname, '..', 'data', 'lottery_cache.json');

// ─── NLB lottery slugs ───
const NLB_LOTTERIES = [
  { name: "Govisetha",         slug: "govisetha" },
  { name: "Mahajana Sampatha", slug: "mahajana-sampatha" },
  { name: "Mega Power",        slug: "mega-power" },
  { name: "Dhana Nidhanaya",   slug: "dhana-nidhanaya" },
  { name: "Handahana",         slug: "handahana" },
  { name: "Ada Sampatha",      slug: "ada-sampatha" },
  { name: "NLB Jaya",          slug: "nlb-jaya" },
  { name: "Suba Dawasak",      slug: "suba-dawasak" },
];

// ─── DLB lottery tab IDs on dlb.lk/result/en ───
const DLB_LOTTERIES = [
  { name: "Ada Kotipathi",         tabId: "lottery0" },
  { name: "Shanida Wasanawa",      tabId: "lottery1" },
  { name: "Lagna Wasanawa",        tabId: "lottery2" },
  { name: "Supiri Dhana Sampatha", tabId: "lottery3" },
  { name: "Super Ball",            tabId: "lottery4" },
  { name: "Kapruka",               tabId: "lottery5" },
  { name: "Sasiri",                tabId: "lottery7" },
  { name: "Jaya Sampatha",         tabId: "lottery8" },
];

let inMemoryPrizes = [];
let lastScrapedAt = null;

// Initialize inMemoryPrizes from file cache immediately
try {
  if (fs.existsSync(CACHE_FILE)) {
    const raw = fs.readFileSync(CACHE_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      inMemoryPrizes = parsed;
      lastScrapedAt = inMemoryPrizes[0]?.updatedAt || new Date().toISOString();
      console.log(`[Scraper] Initialized ${inMemoryPrizes.length} lotteries from disk cache.`);
    }
  }
} catch (e) {
  console.warn('[Scraper] Could not load disk cache:', e.message);
}

const HTTP_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
};

let cachedHumanCookie = '';

/**
 * Helper to fetch HTML from NLB site handling JS anti-bot cookie challenge
 */
const fetchNLBHtml = async (url) => {
  try {
    const headers = { ...HTTP_HEADERS };
    if (cachedHumanCookie) {
      headers['Cookie'] = `human=${cachedHumanCookie}`;
    }

    let res = await axios.get(url, { headers, timeout: 15000 });

    if (typeof res.data === 'string' && res.data.includes("setCookie('human'")) {
      const match = res.data.match(/setCookie\('human',\s*'([^']+)'/);
      if (match) {
        cachedHumanCookie = match[1];
        res = await axios.get(url, {
          headers: { ...HTTP_HEADERS, 'Cookie': `human=${cachedHumanCookie}` },
          timeout: 15000
        });
      }
    }
    return res.data;
  } catch (err) {
    console.warn(`Fetch error for ${url}: ${err.message}`);
    return null;
  }
};

/**
 * Scrape all NLB lotteries with anti-bot bypass and homepage/page fallback
 */
const scrapeNLB = async () => {
  const results = [];
  try {
    // 1. Scrape all main latest draw results from NLB homepage in one batch
    const homeHtml = await fetchNLBHtml('https://www.nlb.lk/');
    if (!homeHtml) {
      console.warn('[Scraper] NLB homepage HTML fetch failed (anti-bot / network). Preserving existing cache.');
      return [];
    }

    const prizeMap = new Map();
    const $ = cheerio.load(homeHtml);

    $('.latest table.tbl tr').each((_, tr) => {
      const tdFirst = $(tr).find('td').first();
      const rawName = tdFirst.find('strong').text().trim();
        if (!rawName) return;

        const drawMatch = tdFirst.text().match(/(\d+)/);
        const drawNumber = drawMatch ? drawMatch[1] : '';

        let letter = '';
        const winningNumbers = [];

        const ols = $(tr).find('ol.B');
        const isAdaSampatha = rawName.toLowerCase().includes('ada sampatha');
        const targetOl = isAdaSampatha && ols.length > 0 ? ols.last() : ols.first();

        if (targetOl && targetOl.length) {
          targetOl.find('li').each((_, li) => {
            const $li = $(li);
            const title = ($li.attr('title') || '').toLowerCase();
            const cls = ($li.attr('class') || '').toLowerCase();
            const text = $li.text().trim();

            if (title.includes('letter') || cls.includes('letter') || title.includes('zodiac') || cls.includes('zodiac')) {
              letter = text;
            } else if (title.includes('number') || title.includes('super') || cls.includes('number') || cls.includes('circle')) {
              const num = parseInt(text, 10);
              winningNumbers.push(isNaN(num) ? text : num);
            }
          });
        }

        const normalizedKey = rawName.toLowerCase().replace(/[^a-z0-9]/g, '');
        prizeMap.set(normalizedKey, { drawNumber, letter, winningNumbers });
      });

    // 2. Build complete objects for each configured NLB lottery
    for (const item of NLB_LOTTERIES) {
      let drawNumber = '';
      let letter = '';
      let winningNumbers = [];
      let topPrize = '';

      const targetKey = item.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const homeData = Array.from(prizeMap.entries()).find(([k]) => k.includes(targetKey) || targetKey.includes(k))?.[1];

      if (homeData) {
        drawNumber = homeData.drawNumber;
        letter = homeData.letter;
        winningNumbers = homeData.winningNumbers;
      }

      // Fetch individual page to enrich Next Super Prize
      try {
        const pageHtml = await fetchNLBHtml(`https://www.nlb.lk/results/${item.slug}`);
        if (pageHtml) {
          const $p = cheerio.load(pageHtml);

          // 1. Check headings (e.g. Next Super Prize, Next Mega Super Prize, Next Power Super Prize, Next)
          $p('h1, h2, h3, h4, h5, .prize, strong').each((_, el) => {
            if (topPrize) return;
            const hText = $p(el).text().trim().toLowerCase();
            if (
              hText.includes('super prize') ||
              hText.includes('mega super') ||
              hText.includes('power super') ||
              hText.includes('jackpot') ||
              hText.includes('next') ||
              hText.includes('grand prize')
            ) {
              const nextEl = $p(el).next('p, div, span, strong');
              if (nextEl.length) {
                const val = nextEl.text().trim();
                if (val && (val.includes('Rs') || val.toLowerCase().includes('gold') || /\d/.test(val))) {
                  topPrize = val;
                }
              }
            }
          });

          // 2. Fallback to any prominent Rs. pattern on page
          if (!topPrize) {
            $p('.lresult, .content, .results').find('p, div, span, td, strong').each((_, el) => {
              if (topPrize) return;
              const text = $p(el).clone().children().remove().end().text().trim();
              if (/Rs\.?\s*[\d,]+(\.\d{2})?/.test(text) && text.length < 40) {
                topPrize = text;
              }
            });
          }

          // Fallback if drawNumber was missing
          if (!drawNumber) {
            const firstRow = $p('table.tbl tbody tr').first();
            if (firstRow.length) {
              const bTag = firstRow.find('td b').first();
              if (bTag.length) drawNumber = bTag.text().trim();
            }
          }
        }
      } catch (e) {}

      // Fallback from known standard prize distribution if still empty
      if (!topPrize) {
        const NLB_DEFAULT_PRIZES = {
          'ada-sampatha': 'Rs. 2,500,000',
          'nlb-jaya': 'Rs. 500,000',
          'suba-dawasak': 'Gold Coins',
        };
        topPrize = NLB_DEFAULT_PRIZES[item.slug] || '—';
      }

      const itemResult = {
        name: item.name,
        board: 'NLB',
        drawNumber,
        topPrize: topPrize || '—',
        letter,
        winningNumbers,
      };

      if ((winningNumbers && winningNumbers.length > 0) || drawNumber) {
        results.push(itemResult);
        console.log(`  NLB ${item.name}: draw=${itemResult.drawNumber || '?'}, nums=${itemResult.winningNumbers.join(',') || '?'}, letter=${itemResult.letter || '?'}, prize=${itemResult.topPrize}`);
      }
    }
  } catch (err) {
    console.error('NLB scrape error:', err.message);
  }

  return results;
};

/**
 * Scrape full prize structures for DLB lotteries from https://www.dlb.lk/lottery/en
 */
let dlbPrizeStructuresMap = {};

const scrapeDLBPrizeStructures = async () => {
  try {
    const res = await axios.get('https://www.dlb.lk/lottery/en', { headers: HTTP_HEADERS, timeout: 20000 });
    const $ = cheerio.load(res.data);

    const prizeStructures = {};

    for (let i = 0; i <= 8; i++) {
      const container = $(`#lottery${i}`);
      if (!container.length) continue;

      const rawTitle = container.find('h1, h2, h3, h4, .lottery_name, .lot_title').first().text().trim() || container.text().split('Check')[0].trim();
      const titleKey = rawTitle.toLowerCase().replace(/[^a-z0-9]/g, '');
      const rows = [];

      container.find('table tr').each((_, tr) => {
        const cells = $(tr).find('td').map((_, cell) => $(cell).text().trim()).get();
        if (cells.length >= 2) {
          const combination = cells[0];
          const prizeStr = cells[1];
          const numMatch = prizeStr.replace(/,/g, '').match(/\d+(\.\d+)?/);
          const prizeAmount = numMatch ? parseFloat(numMatch[0]) : 0;
          rows.push({ combination, prize: prizeStr, prizeAmount });
        }
      });

      if (rows.length > 0) {
        prizeStructures[titleKey] = rows;
      }
    }

    dlbPrizeStructuresMap = prizeStructures;
    console.log(`[Scraper] Successfully scraped prize structures for ${Object.keys(prizeStructures).length} DLB lotteries.`);
    return prizeStructures;
  } catch (err) {
    console.warn('[Scraper] DLB Prize Structure scrape error:', err.message);
    return dlbPrizeStructuresMap;
  }
};

/**
 * Scrape DLB results using Cheerio
 */
const scrapeDLB = async () => {
  const results = [];
  const prizeStructures = await scrapeDLBPrizeStructures();

  try {
    const res = await axios.get('https://www.dlb.lk/result/en', { headers: HTTP_HEADERS, timeout: 20000 });
    const $ = cheerio.load(res.data);

    for (const lottery of DLB_LOTTERIES) {
      try {
        let container = $(`#${lottery.tabId}`);
        const lotKey = lottery.name.toLowerCase().replace(/[^a-z0-9]/g, '');

        // Dynamically find matching container by heading if tabId doesn't match
        for (let i = 0; i <= 10; i++) {
          const testC = $(`#lottery${i}`);
          if (testC.length) {
            const heading = testC.find('.lot_m_re_heading').text().toLowerCase().replace(/[^a-z0-9]/g, '');
            if (heading && (heading.includes(lotKey) || lotKey.includes(heading))) {
              container = testC;
              break;
            }
          }
        }

        const prizeStructure = prizeStructures[lotKey] ||
          Object.entries(prizeStructures).find(([k]) => k.includes(lotKey) || lotKey.includes(k))?.[1] || [];

        if (!container.length) {
          continue;
        }

        // Draw number
        const dateText = container.find('.lot_m_re_date').text() || '';
        const drawMatch = dateText.match(/Draw\s*Number\s*[-–]?\s*(\d+)/i);
        const drawNumber = drawMatch ? drawMatch[1] : '';

        // English letter
        let letter = '';
        const letterEl = container.find('ul.result_detail_result .eng_letter');
        if (letterEl.length) {
          letter = letterEl.text().trim();
        }

        // Zodiac sign (from image filename for Lagna Wasanawa, Handahana)
        if (!letter) {
          const imgEl = container.find('.lot_main_result img, img.imgmiddle_sub, ul.result_detail_result img');
          if (imgEl.length) {
            imgEl.each((_, el) => {
              if (letter) return;
              const src = $(el).attr('src') || '';
              const zodiacMap = {
                'mesha': '♈', 'vrushabha': '♉', 'mithuna': '♊', 'kataka': '♋',
                'simha': '♌', 'kanya': '♍', 'thula': '♎', 'vrischika': '♏',
                'dhanu': '♐', 'makara': '♑', 'kumbha': '♒', 'meena': '♓',
              };
              for (const [key, symbol] of Object.entries(zodiacMap)) {
                if (src.toLowerCase().includes(key)) { letter = symbol; break; }
              }
            });
          }
        }

        // Winning numbers
        const numberEls = container.find('ul.result_detail_result .number_shanida');
        const winningNumbers = [];
        numberEls.each((_, el) => {
          const val = $(el).text().trim();
          const n = parseInt(val, 10);
          winningNumbers.push(isNaN(n) ? val : n);
        });

        if (winningNumbers.length > 0 || drawNumber) {
          results.push({
            name: lottery.name,
            board: 'DLB',
            drawNumber,
            letter,
            winningNumbers,
            topPrize: '',
            prizeStructure,
          });
          console.log(`  DLB ${lottery.name}: draw=${drawNumber || '?'}, nums=${winningNumbers.join(',') || '?'}, letter=${letter || '?'}`);
        }
      } catch (e) {
        results.push({ name: lottery.name, board: 'DLB' });
      }
    }

    // Get jackpot prizes from the DLB homepage ticker
    try {
      const homeRes = await axios.get('https://www.dlb.lk/', { headers: HTTP_HEADERS, timeout: 15000 });
      const $h = cheerio.load(homeRes.data);

      // Try multiple selectors for jackpot prizes
      const prizeMap = new Map();

      // Method 1: ticker prices
      $h('.ticker_price, .jackpot-amount').each((_, el) => {
        const parent = $h(el).parent();
        const fullText = (parent.text() || '').trim();
        const priceText = $h(el).text().trim();
        prizeMap.set(fullText, priceText);
      });

      // Method 2: jackpot section
      $h('.jackpot_inner, .jpot_inner').each((_, el) => {
        const name = $h(el).find('.jpot_name, .lot_name').text().trim();
        const prize = $h(el).find('.jpot_prize, .lot_prize').text().trim();
        if (name && prize) prizeMap.set(name, prize);
      });

      // Match prizes to lottery results
      for (const item of results) {
        const firstName = item.name.split(' ')[0].toLowerCase();
        for (const [key, val] of prizeMap) {
          if (key.toLowerCase().includes(firstName)) {
            item.topPrize = val.replace(/RS\.?\s*/i, 'Rs. ').replace(/\/-$/, '').trim();
            break;
          }
        }
      }

      // Fallback from prizeStructure if topPrize is still missing
      for (const item of results) {
        if (!item.topPrize || item.topPrize === '—') {
          if (item.prizeStructure && item.prizeStructure.length > 0) {
            const sorted = [...item.prizeStructure].sort((a, b) => (b.prizeAmount || 0) - (a.prizeAmount || 0));
            if (sorted[0] && sorted[0].prize) {
              item.topPrize = sorted[0].prize;
            }
          }
        }
      }
    } catch (e) {
      console.warn('  DLB ticker scrape notice:', e.message);
    }
  } catch (err) {
    console.warn('DLB Cheerio scrape failed:', err.message);
  }

  return results;
};

/**
 * Main: scrapes both NLB & DLB
 */
const scrapeLivePrizes = async () => {
  console.log('[Scraper] Starting live scrape...');

  let nlbResults = [];
  let dlbResults = [];

  try {
    nlbResults = await scrapeNLB();
    console.log(`[Scraper] NLB: scraped ${nlbResults.length} lotteries`);
  } catch (e) {
    console.warn('[Scraper] NLB scrape error:', e.message);
  }

  try {
    dlbResults = await scrapeDLB();
    console.log(`[Scraper] DLB: scraped ${dlbResults.length} lotteries`);
  } catch (e) {
    console.warn('[Scraper] DLB scrape error:', e.message);
  }

  // Smart Non-Destructive Merge:
  // If an upstream board was down or an item returned empty, PRESERVE previously cached valid data!
  const resultMap = new Map();
  inMemoryPrizes.forEach(p => resultMap.set(p.name, p));

  const freshList = [...nlbResults, ...dlbResults];
  freshList.forEach(fresh => {
    if (!fresh || !fresh.name) return;
    const existing = resultMap.get(fresh.name);
    const hasFreshNums = fresh.winningNumbers && fresh.winningNumbers.length > 0;
    const hasFreshDraw = Boolean(fresh.drawNumber);

    if (!existing) {
      if (hasFreshNums || hasFreshDraw) {
        resultMap.set(fresh.name, { ...fresh, updatedAt: new Date().toISOString() });
      }
    } else {
      resultMap.set(fresh.name, {
        ...existing,
        drawNumber: hasFreshDraw ? fresh.drawNumber : existing.drawNumber,
        letter: (fresh.letter && fresh.letter !== '?') ? fresh.letter : (existing.letter || fresh.letter || ''),
        winningNumbers: hasFreshNums ? fresh.winningNumbers : existing.winningNumbers,
        topPrize: (fresh.topPrize && fresh.topPrize !== '—') ? fresh.topPrize : existing.topPrize,
        prizeStructure: (fresh.prizeStructure && fresh.prizeStructure.length > 0) ? fresh.prizeStructure : existing.prizeStructure,
        updatedAt: hasFreshNums ? new Date().toISOString() : existing.updatedAt,
      });
    }
  });

  const mergedResults = Array.from(resultMap.values());

  if (mergedResults.length > 0) {
    inMemoryPrizes = mergedResults;
    lastScrapedAt = new Date().toISOString();

    // Persist to disk cache
    try {
      const dataDir = path.dirname(CACHE_FILE);
      if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
      fs.writeFileSync(CACHE_FILE, JSON.stringify(mergedResults, null, 2), 'utf8');
      console.log(`[Scraper] Saved ${mergedResults.length} lotteries to disk cache (${CACHE_FILE})`);
    } catch (fsErr) {
      console.warn('[Scraper] Could not write disk cache:', fsErr.message);
    }
  }

  // Persist to QuestDB (both live_prizes and draws tables)
  try {
    const now = new Date().toISOString();
    for (const item of mergedResults) {
      // Only insert into live_prizes if we got valid winning numbers or valid draw data
      if (item.winningNumbers && item.winningNumbers.length > 0) {
        await db.query(
          'INSERT INTO live_prizes (lottery_name, top_prize, board, draw_number, letter, winning_numbers, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [item.name, item.topPrize || '', item.board || '', item.drawNumber || '', item.letter || '', JSON.stringify(item.winningNumbers || []), now]
        );
      }

      // 2. Insert into draws table for historical records and ticket checking
      if (item.drawNumber && item.winningNumbers && item.winningNumbers.length > 0) {
        const drawId = uuidv4();
        const prizeDist = {
          first: { numbers: item.winningNumbers, prize: item.topPrize || 'Jackpot' },
          letter: item.letter || '',
        };
        await db.query(
          `INSERT INTO draws (id, draw_date, draw_name, draw_number, prize_distribution, uploaded_at, uploaded_by, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [drawId, now, item.name, item.drawNumber, JSON.stringify(prizeDist), now, 'automated_scraper', 'active']
        );
      }
    }
    console.log(`[Scraper] Successfully persisted draw results to QuestDB database.`);
  } catch (dbErr) {
    console.warn('[Scraper] DB persist notice:', dbErr.message);
  }

  return {
    success: true,
    nlbScraped: nlbResults.length > 0,
    dlbScraped: dlbResults.length > 0,
    count: mergedResults.length,
    prizes: mergedResults,
    lastUpdated: lastScrapedAt,
  };
};

/**
 * Get current live prizes (from DB or memory)
 */
const getLivePrizes = async () => {
  try {
    const res = await db.query(
      'SELECT lottery_name, top_prize, board, draw_number, letter, winning_numbers, updated_at FROM live_prizes ORDER BY updated_at DESC LIMIT 100'
    );
    if (res.rows && res.rows.length > 0) {
      const dbMap = new Map();
      res.rows.forEach(r => {
        let nums = [];
        try { nums = JSON.parse(r.winning_numbers || '[]'); } catch { nums = []; }
        
        // Prioritize entries with valid winning numbers
        if (!dbMap.has(r.lottery_name) || (dbMap.get(r.lottery_name).winningNumbers.length === 0 && nums.length > 0)) {
          dbMap.set(r.lottery_name, {
            name: r.lottery_name,
            topPrize: r.top_prize,
            board: r.board,
            drawNumber: r.draw_number,
            letter: r.letter,
            winningNumbers: nums,
            updatedAt: r.updated_at,
          });
        }
      });
      if (dbMap.size > 0) return Array.from(dbMap.values());
    }
  } catch (e) {
    // fallback to memory
  }

  // Safety net: reload disk cache if memory is somehow empty
  if (!inMemoryPrizes || inMemoryPrizes.length === 0) {
    try {
      if (fs.existsSync(CACHE_FILE)) {
        inMemoryPrizes = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
      }
    } catch (e) {}
  }

  return inMemoryPrizes;
};

const getDLBPrizeStructures = () => dlbPrizeStructuresMap;

module.exports = {
  scrapeLivePrizes,
  getLivePrizes,
  scrapeDLBPrizeStructures,
  getDLBPrizeStructures,
  NLB_LOTTERIES,
  DLB_LOTTERIES,
};
