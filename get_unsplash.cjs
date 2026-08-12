const https = require('https');

function search(query) {
  return new Promise((resolve) => {
    https.get(`https://unsplash.com/napi/search/photos?query=${encodeURIComponent(query)}&per_page=3`, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.results.map(r => r.id));
        } catch (e) {
          resolve([]);
        }
      });
    }).on('error', () => resolve([]));
  });
}

(async () => {
  console.log("steering:", await search("steering wheel"));
  console.log("gauge:", await search("car dashboard gauge"));
  console.log("timing:", await search("f1 racing timing board"));
})();
