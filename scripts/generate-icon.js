const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ICO_PATH = path.join(ROOT, 'desktop', 'resources', 'logo.ico');
const ICON_SIZES = [256, 128, 64, 48, 32, 24, 16];

function drawShield(size) {
  const raw = Buffer.alloc(size * size * 4);
  const cx = size / 2;
  const cy = size / 2 - size * 0.02;
  const r = size / 2 - 2;
  const border = Math.max(2, size / 16);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = ((size - 1 - y) * size + x) * 4;
      const dx = x - cx;
      const dy = y - cy;

      // Shield shape: wider at top, tapering to point at bottom
      const halfW = r * (1 - (dy / (r * 1.25)) * 0.35);
      const halfH = r * 0.9;
      const cornerR = size / 7;
      const inRectX = Math.abs(dx) <= halfW;
      const inRectY = Math.abs(dy) <= halfH;
      let inShape = false;

      if (inRectX && inRectY) {
        // Top corners
        if (dy < -halfH + cornerR) {
          const edgeX = halfW - Math.abs(dx);
          const edgeY = -halfH - dy;
          const cornerDist = Math.sqrt((cornerR - edgeX) ** 2 + (cornerR - edgeY) ** 2);
          inShape = cornerDist <= cornerR;
        } else {
          inShape = true;
        }
        // Bottom point
        if (dy > halfH - size / 6 && Math.abs(dx) < halfW * 0.3) {
          inShape = true;
        }
      }

      if (inShape && dy > 0) {
        // Taper toward bottom point
        const taperW = halfW * (1 - (dy / (r * 1.1)) * 0.5);
        if (Math.abs(dx) > taperW) inShape = false;
      }

      if (inShape) {
        const edgeDistX = halfW - Math.abs(dx);
        const edgeDistY = dy < 0 ? halfH + dy : halfH - dy;
        const onBorder = edgeDistX < border || (edgeDistY < border && dy < halfH - size / 8);

        // Orange outer border
        if (onBorder) {
          raw[idx] = 0xFF; raw[idx + 1] = 0x6B; raw[idx + 2] = 0x00; raw[idx + 3] = 255;
        } else {
          // Navy fill with subtle gradient (lighter toward center)
          const distFromCenter = Math.sqrt(dx * dx + dy * dy) / r;
          const shade = Math.min(255, Math.max(0, 30 + (1 - distFromCenter) * 20));
          raw[idx] = Math.round(11 - distFromCenter * 5);
          raw[idx + 1] = Math.round(31 - distFromCenter * 15);
          raw[idx + 2] = Math.round(59 - distFromCenter * 20);
          raw[idx + 3] = 255;
        }

        // Checkmark: two strokes forming ✓
        const checkSize = size / 5;
        const checkX = Math.abs(dx - size * 0.03);
        const checkY1 = -(dy + size * 0.02) / checkSize;
        const checkY2 = -(dy - size * 0.02) / checkSize;
        const isCheckShort = dx > 0 && dx < halfW * 0.5 && dy < size * 0.06 && dy > -size * 0.14;
        const isCheckLong = dx < 0 && dx > -halfW * 0.35 && dy < size * 0.12 && dy > -size * 0.06;

        if ((isCheckShort || isCheckLong) && !onBorder) {
          raw[idx] = 0x4A; raw[idx + 1] = 0xDE; raw[idx + 2] = 0x80; raw[idx + 3] = 255;
        }
      } else {
        raw[idx] = 0; raw[idx + 1] = 0; raw[idx + 2] = 0; raw[idx + 3] = 0;
      }
    }
  }
  return raw;
}

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  const table = new Int32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    table[i] = c;
  }
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function pngChunk(type, data) {
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, 'ascii');
  const combined = Buffer.concat([typeBuf, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(combined));
  return Buffer.concat([lenBuf, combined, crcBuf]);
}

function makePNG(size) {
  const raw = drawShield(size);
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  const idatData = Buffer.alloc(size * (1 + size * 4));
  for (let y = 0; y < size; y++) {
    idatData[y * (1 + size * 4)] = 0;
    raw.slice(y * size * 4, (y + 1) * size * 4).copy(idatData, y * (1 + size * 4) + 1);
  }

  const zlib = require('zlib');
  const compressed = zlib.deflateSync(idatData);

  return Buffer.concat([
    signature,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', compressed),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

function writeICO() {
  console.log('[ISHGuard] Generating multi-resolution icon...');
  fs.mkdirSync(path.dirname(ICO_PATH), { recursive: true });

  const pngs = ICON_SIZES.map(s => ({ size: s, data: makePNG(s) }));

  const headerSize = 6;
  const dirEntrySize = 16;
  let dataOffset = headerSize + dirEntrySize * pngs.length;
  let totalSize = dataOffset;

  for (const p of pngs) totalSize += p.data.length;

  const ico = Buffer.alloc(totalSize);
  let off = 0;

  ico.writeUInt16LE(0, off); off += 2;
  ico.writeUInt16LE(1, off); off += 2;
  ico.writeUInt16LE(pngs.length, off); off += 2;

  for (const p of pngs) {
    ico.writeUInt8(p.size >= 256 ? 0 : p.size, off); off += 1;
    ico.writeUInt8(p.size >= 256 ? 0 : p.size, off); off += 1;
    ico.writeUInt8(0, off); off += 1;
    ico.writeUInt8(0, off); off += 1;
    ico.writeUInt16LE(1, off); off += 2;
    ico.writeUInt16LE(32, off); off += 2;
    ico.writeUInt32LE(p.data.length, off); off += 4;
    ico.writeUInt32LE(dataOffset, off); off += 4;
    dataOffset += p.data.length;
  }

  for (const p of pngs) {
    p.data.copy(ico, off);
    off += p.data.length;
  }

  fs.writeFileSync(ICO_PATH, ico);
  console.log(`  ✓ ${path.relative(ROOT, ICO_PATH)} (${ico.length} bytes, ${pngs.length} resolutions)`);

  const svgDest = path.join(ROOT, 'desktop', 'resources', 'logo.svg');
  fs.copyFileSync(path.join(ROOT, 'branding', 'logo.svg'), svgDest);
  console.log(`  ✓ ${path.relative(ROOT, svgDest)}`);

  console.log('[ISHGuard] Icon generation complete.');
}

writeICO();
