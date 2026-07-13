export async function waitForBootFonts(fonts, timeoutMs = 1200) {
  if (!fonts?.ready) return 'unavailable';

  let timeoutId;
  const timeout = new Promise((resolve) => {
    timeoutId = globalThis.setTimeout(() => resolve('timeout'), timeoutMs);
  });
  const ready = Promise.resolve(fonts.ready).then(
    () => 'ready',
    () => 'failed'
  );

  try {
    return await Promise.race([ready, timeout]);
  } finally {
    globalThis.clearTimeout(timeoutId);
  }
}
