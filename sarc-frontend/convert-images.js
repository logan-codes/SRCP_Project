import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const imagesDir = path.join(process.cwd(), 'public', 'images');

const files = fs.readdirSync(imagesDir);

for (const file of files) {
  if (file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg')) {
    const inputPath = path.join(imagesDir, file);
    const outputPath = path.join(imagesDir, `${path.parse(file).name}.webp`);
    
    console.log(`Converting ${file}...`);
    
    // Resize very large images. Let's cap max width to 1920 or just default compression
    sharp(inputPath)
      .resize({ width: 1920, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(outputPath)
      .then(() => {
        console.log(`Successfully converted ${file} to ${path.parse(file).name}.webp`);
        // We can optionally delete the original, but let's keep it for a moment just in case
      })
      .catch(err => {
        console.error(`Error converting ${file}:`, err);
      });
  }
}
