const axios = require('axios');
const cheerio = require('cheerio');

async function findNLBApi() {
  const cookie = 'human=9b90f22df889f001b226a65ce524689da468a9e2';
  const r = await axios.get('https://www.nlb.lk/results/govisetha', {
    headers: { 'User-Agent': 'Mozilla/5.0', 'Cookie': cookie },
    timeout: 15000
  });
  
  const $ = cheerio.load(r.data);
  
  // Find all script src
  console.log('=== External Scripts ===');
  $('script[src]').each(function() {
    console.log($(this).attr('src'));
  });
  
  // Find all inline scripts
  console.log('\n=== Inline Script Snippets ===');
  $('script:not([src])').each(function() {
    const text = $(this).html() || '';
    if (text.length > 10 && text.length < 5000) {
      console.log('---');
      console.log(text.substring(0, 800));
    }
  });

  // Look for data attributes or JSON embedded in page  
  console.log('\n=== Data Attributes ===');
  $('[data-result], [data-draw], [data-lottery], [data-numbers]').each(function() {
    console.log($(this).attr('data-result') || $(this).attr('data-draw') || $(this).attr('data-lottery'));
  });

  // Check for JSON-LD or embedded data
  console.log('\n=== JSON-LD ===');
  $('script[type="application/json"], script[type="application/ld+json"]').each(function() {
    console.log($(this).html());
  });

  // Check the full HTML of the .lresult container
  console.log('\n=== .lresult HTML ===');
  console.log($('.lresult').html()?.substring(0, 2000) || 'NO .lresult FOUND');

  // Check for any element with "result" in its class or id
  console.log('\n=== Result-like elements ===');
  $('[class*="result"], [id*="result"]').each(function() {
    const cls = $(this).attr('class') || '';
    const id = $(this).attr('id') || '';
    console.log(`class="${cls}" id="${id}" text="${$(this).text().substring(0, 100)}"`);
  });
}

findNLBApi().catch(e => console.error(e));
