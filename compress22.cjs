const sharp = require('sharp');
async function compress() {
  try {
    await sharp('public/websitesection2.2new.png')
      .resize(1200, undefined, { withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile('public/websitesection2.2new-optimized.webp');
    console.log('Processed 2.2new');
  } catch (err) {
    console.error('Error:', err);
  }
}
compress();
