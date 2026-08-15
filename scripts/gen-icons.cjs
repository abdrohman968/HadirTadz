// Script sekali pakai: generate ikon PWA (512 & 192) sebagai PNG murni (tanpa library).
// Ikon: kotak hijau emerald dengan tanda centang putih.
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

function makePng(size) {
  const px = Buffer.alloc(size * size * 4);
  // isi default transparent
  px.fill(0);
  const emerald = [16, 185, 129, 255]; // tailwind emerald-500 -> rgb(16,185,129)
  const dark = [4, 120, 87, 255]; // emerald-700
  const white = [255, 255, 255, 255];

  const cx = size / 2;
  const r = size / 2;
  const inR = r * 0.92;
  // rounded-square radius
  const corner = size * 0.18;
  const drawBar = (x0, y0, w, h, color) => {
    for (let y = y0; y < y0 + h; y++)
      for (let x = x0; x < x0 + w; x++) {
        if (x < 0 || y < 0 || x >= size || y >= size) continue;
        px[(y * size + x) * 4] = color[0];
        px[(y * size + x) * 4 + 1] = color[1];
        px[(y * size + x) * 4 + 2] = color[2];
        px[(y * size + x) * 4 + 3] = color[3];
      }
  };

  // rounded square background (emerald gradient-ish: base emerald + darker bottom)
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      // rounded corners test
      const dxC = Math.max(Math.abs(x - (size - corner)), Math.abs(x - corner));
      const dyC = Math.max(Math.abs(y - (size - corner)), Math.abs(y - corner));
      const inCorner = dxC > 0 && dyC > 0 && Math.sqrt((corner - dxC) ** 2 + (corner - dyC) ** 2) > corner;
      if (inCorner) continue;
      const t = y / size;
      const c = t < 0.5 ? emerald : dark;
      // dither blend
      const blend = Math.min(1, t * 2);
      const col = [
        Math.round(emerald[0] * (1 - blend) + dark[0] * blend),
        Math.round(emerald[1] * (1 - blend) + dark[1] * blend),
        Math.round(emerald[2] * (1 - blend) + dark[2] * blend),
        255,
      ];
      px[(y * size + x) * 4] = col[0];
      px[(y * size + x) * 4 + 1] = col[1];
      px[(y * size + x) * 4 + 2] = col[2];
      px[(y * size + x) * 4 + 3] = col[3];
    }

  // white check mark
  const cw = size * 0.26; // bar thickness
  const x1 = size * 0.28, y1 = size * 0.5;
  const x2 = size * 0.44, y2 = size * 0.66;
  const x3 = size * 0.72, y3 = size * 0.36;
  // draw as two rotated bars via point-in-polygon approx:
  // Bar1: from (x1,y1) to (x2,y2)
  const bar = (ax, ay, bx, by, w, color) => {
    const len = Math.hypot(bx - ax, by - ay);
    const nx = -(by - ay) / len, ny = (bx - ax) / len;
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        const dx = x - ax, dy = y - ay;
        const proj = (dx * (bx - ax) + dy * (by - ay)) / len;
        if (proj < -w || proj > len + w) continue;
        const dist = Math.abs(dx * nx + dy * ny);
        if (dist > w / 2) continue;
        px[(y * size + x) * 4] = color[0];
        px[(y * size + x) * 4 + 1] = color[1];
        px[(y * size + x) * 4 + 2] = color[2];
        px[(y * size + x) * 4 + 3] = color[3];
      }
  };
  bar(x1, y1, x2, y2, cw, white); // kecup
  bar(x2, y2, x3, y3, cw, white); // ekor

  // PNG encode
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const chunk = (type, data) => {
    const t = Buffer.from(type, 'ascii');
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const crc = zlib.crc32(Buffer.concat([t, data]));
    const c = Buffer.alloc(4);
    c.writeUInt32BE(crc >>> 0);
    return Buffer.concat([len, t, data, c]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  // scanlines with filter byte 0
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    px.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  const idat = zlib.deflateSync(raw);
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

const outDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
for (const s of [192, 512, 180]) {
  const f = path.join(outDir, `icon-${s}.png`);
  fs.writeFileSync(f, makePng(s));
  console.log('wrote', f, fs.statSync(f).size, 'bytes');
}