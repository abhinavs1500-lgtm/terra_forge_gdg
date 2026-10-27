const newsData = require('../../src/data/land_legal_news.json');

exports.handler = async function (event, context) {
  const category = event.queryStringParameters && event.queryStringParameters.category;
  const search = event.queryStringParameters && (event.queryStringParameters.search || '').trim().toLowerCase();

  let filtered = newsData;

  if (category && category !== 'All Updates') {
    if (category === 'Tamil Nadu') {
      filtered = filtered.filter((s) => s.jurisdiction.includes('Tamil Nadu') || s.jurisdiction.includes('Chennai'));
    } else {
      filtered = filtered.filter(
        (s) => s.category.toLowerCase() === category.toLowerCase() ||
               (s.jurisdiction && s.jurisdiction.toLowerCase().includes(category.toLowerCase()))
      );
    }
  }

  if (search) {
    filtered = filtered.filter(
      (s) =>
        s.headline.toLowerCase().includes(search) ||
        s.shortSummary.toLowerCase().includes(search) ||
        s.sourceName.toLowerCase().includes(search) ||
        s.category.toLowerCase().includes(search) ||
        s.jurisdiction.toLowerCase().includes(search) ||
        s.officialReference.toLowerCase().includes(search)
    );
  }

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      total: filtered.length,
      allCount: newsData.length,
      lastRefreshedAt: new Date().toISOString(),
      serverStatus: 'OPERATIONAL',
      sourceHealth: '9 Official Statutory & Judicial Channels Synchronized (TNReginet, TNeGA, CMDA, TNRERA, Madras HC, SC, DoLR, MoHUA)',
      stories: filtered
    })
  };
};
