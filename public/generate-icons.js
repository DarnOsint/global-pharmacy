const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

function generateIcon(size, filename) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Background
  ctx.fillStyle = '#f97316';
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, size * 0.18);
  ctx.fill();
  
  // Pharmacy cross
  ctx.fillStyle = '#ffffff';
  const cx = size / 2;
  const cy = size / 2;
  const cw = size * 0.55;
  const ch = size * 0.14;
  
  // Horizontal bar
  ctx.beginPath();
  ctx.roundRect(cx - cw/2, cy - ch/2, cw, ch, ch * 0.3);
  ctx.fill();
  
  // Vertical bar
  ctx.beginPath();
  ctx.roundRect(cx - ch/2, cy - cw/2, ch, cw, ch * 0.3);
  ctx.fill();
  
  // Orange accent circle
  ctx.fillStyle = '#f97316';
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.06, 0, Math.PI * 2);
  ctx.fill();
  
  const buffer = canvas.toBuffer('image/png');
  const out = path.join(__dirname, filename);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, buffer);
  console.log(`Generated ${out} (${size}x${size})`);
}

generateIcon(192, 'icons/icon-192.png');
generateIcon(512, 'icons/icon-512.png');
console.log('Done!');
