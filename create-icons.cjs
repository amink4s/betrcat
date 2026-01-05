// Simple script to create placeholder PNG icons
const fs = require('fs');

// Create minimal valid PNG files (1x1 cyan pixel)
const tinyPNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
  'base64'
);
fs.writeFileSync('public/icon-192.png', tinyPNG);
fs.writeFileSync('public/icon-512.png', tinyPNG);
console.log('Created placeholder icons')
