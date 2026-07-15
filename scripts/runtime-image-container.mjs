import assert from 'node:assert/strict';

export function inspectPngDimensions(data, label = 'PNG master') {
  if (!Buffer.isBuffer(data) || data.length < 24) throw new Error(`invalid PNG header: ${label}`);
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (!data.subarray(0, 8).equals(signature) || data.toString('ascii', 12, 16) !== 'IHDR') {
    throw new Error(`invalid PNG header: ${label}`);
  }
  return { width: data.readUInt32BE(16), height: data.readUInt32BE(20) };
}

export function inspectLosslessWebp(data, label = 'runtime WebP') {
  if (!Buffer.isBuffer(data) || data.length < 20 || data.toString('ascii', 0, 4) !== 'RIFF' || data.toString('ascii', 8, 12) !== 'WEBP') {
    throw new Error(`invalid WebP container: ${label}`);
  }
  const declaredLength = data.readUInt32LE(4) + 8;
  if (declaredLength !== data.length) throw new Error(`invalid WebP RIFF length: ${label}`);

  const chunkTypes = [];
  let dimensions = null;
  for (let offset = 12; offset < data.length;) {
    if (offset + 8 > data.length) throw new Error(`truncated WebP chunk header: ${label}`);
    const type = data.toString('ascii', offset, offset + 4);
    const size = data.readUInt32LE(offset + 4);
    const payload = offset + 8;
    const payloadEnd = payload + size;
    if (payloadEnd > data.length) throw new Error(`truncated WebP chunk: ${label}`);
    chunkTypes.push(type);

    if (type === 'VP8L') {
      if (size < 5 || data[payload] !== 0x2f) throw new Error(`invalid VP8L header: ${label}`);
      const bits = data.readUInt32LE(payload + 1);
      dimensions = {
        width: (bits & 0x3fff) + 1,
        height: ((bits >>> 14) & 0x3fff) + 1
      };
    }
    offset = payloadEnd + (size % 2);
  }

  if (!dimensions || chunkTypes.includes('VP8 ') || chunkTypes.includes('ANIM') || chunkTypes.includes('ANMF')) {
    throw new Error(`runtime WebP must contain a VP8L lossless image only: ${label} (${chunkTypes.join(',')})`);
  }
  return { chunkTypes, ...dimensions };
}

export function assertMatchingImageDimensions(pngData, webpData, label) {
  const png = inspectPngDimensions(pngData, label);
  const webp = inspectLosslessWebp(webpData, label);
  assert.deepEqual(
    { width: webp.width, height: webp.height },
    png,
    `dimension mismatch for ${label}`
  );
  return webp;
}
