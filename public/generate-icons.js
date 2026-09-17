// Regenerate the app icons from the Cyberville logo mark.
// Usage: node generate-icons.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const logo = path.join(__dirname, 'cyberville/logo-mark.png');

function copyTo(size, filename) {
  const out = path.join(__dirname, filename);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  execSync(`sips -z ${size} ${size} "${logo}" --out "${out}" >/dev/null 2>&1`);
  console.log(`Generated ${out} (${size}x${size})`);
}

copyTo(512, 'icons/icon-512.png');
copyTo(192, 'icons/icon-192.png');
console.log('Done!');