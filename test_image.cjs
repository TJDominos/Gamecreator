const https = require('https');
const ids = ['photo-1549399542-7e3f8b79c341', 'photo-1601362840469-51e4d8d58785', 'photo-1530053969600-caedc5a19eca', 'photo-1541348263662-e068362d8217', 'photo-1512749491228-caef5a7831d7'];
ids.forEach(id => {
  https.get('https://unsplash.com/photos/'+id.replace('photo-',''), (res) => {
    console.log(id, res.statusCode);
  });
});
