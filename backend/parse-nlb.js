const cheerio = require('cheerio');
const fs = require('fs');

const html = fs.readFileSync('./nlb-govisetha.html', 'utf8');
const $ = cheerio.load(html);

console.log('--- ALL RS MENTIONS IN GOVISETHA PAGE ---');
$('*').each((i, el) => {
  const text = $(el).clone().children().remove().end().text().trim();
  if (text.includes('Rs') || text.includes('Prize') || text.includes('Jackpot') || text.includes('Super')) {
    if (text.length < 100) {
      console.log(`Elem <${el.name}>: "${text}"`);
    }
  }
});
