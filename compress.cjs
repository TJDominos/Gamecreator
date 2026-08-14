const sharp = require('sharp');
sharp('public/Section3background.png')
  .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
  .webp({ quality: 80 })
  .toFile('public/Section3background-optimized.webp')
  .then(info => {
    console.log('Success:', info);
  })
  .catch(err => {
    console.error('Error:', err);
  });
