// Generates the PNG app icons with no dependencies: a fretboard grid with one marked note.
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const CRC = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
};

function icon(size) {
  const px = Buffer.alloc(size * size * 3);
  const set = (x, y, [r, g, b]) => { const i = (y * size + x) * 3; px[i] = r; px[i + 1] = g; px[i + 2] = b; };
  const BG = [0x14, 0x16, 0x1a], LINE = [0xd9, 0xd6, 0xcf], NUT = [0xf2, 0xf1, 0xed], DOT = [0xfb, 0x92, 0x3c];
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) set(x, y, BG);

  // Keep artwork inside the central 70% so the maskable crop never clips it.
  const m = Math.round(size * 0.18), w = size - 2 * m;
  const rect = (x0, y0, x1, y1, c) => {
    for (let y = Math.max(0, y0); y < Math.min(size, y1); y++) for (let x = Math.max(0, x0); x < Math.min(size, x1); x++) set(x, y, c);
  };
  const t = Math.max(2, Math.round(size / 96));
  for (let s = 0; s < 6; s++) { const y = m + Math.round((w * s) / 5); rect(m, y - t / 2, m + w, y + t / 2 + 1, LINE); }
  rect(m - t * 2, m - t, m + t, m + w + t, NUT);
  for (let f = 1; f <= 4; f++) { const x = m + Math.round((w * f) / 4); rect(x - t / 2, m, x + t / 2 + 1, m + w, LINE); }
  // Dot between frets 2 and 3, on string 3.
  const cx = m + Math.round(w * 0.625), cy = m + Math.round((w * 2) / 5), r = Math.round(size * 0.075);
  for (let y = cy - r; y <= cy + r; y++) for (let x = cx - r; x <= cx + r; x++) if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) set(x, y, DOT);

  const raw = Buffer.alloc(size * (size * 3 + 1));
  for (let y = 0; y < size; y++) px.copy(raw, y * (size * 3 + 1) + 1, y * size * 3, (y + 1) * size * 3);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0)),
  ]);
}

for (const size of [180, 192, 512]) {
  const out = new URL(`../icons/icon-${size}.png`, import.meta.url);
  writeFileSync(out, icon(size));
  console.log(`wrote icons/icon-${size}.png`);
}
