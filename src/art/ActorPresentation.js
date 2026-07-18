export const CHARACTER_SELECT_PORTRAIT = Object.freeze({
  frameWidth: 280,
  frameHeight: 326,
  targetHeight: 300,
  maxWidth: 280,
  baselineY: 112
});

export function fitActorDisplaySize(sourceWidth, sourceHeight, targetHeight, maxWidth = Number.POSITIVE_INFINITY) {
  if (![sourceWidth, sourceHeight, targetHeight].every((value) => Number.isFinite(value) && value > 0)) {
    return { width: 0, height: 0 };
  }

  const safeMaxWidth = Number.isFinite(maxWidth) && maxWidth > 0 ? maxWidth : Number.POSITIVE_INFINITY;
  const heightScale = targetHeight / sourceHeight;
  const widthScale = safeMaxWidth / sourceWidth;
  const scale = Math.min(heightScale, widthScale);

  return {
    width: Math.round(sourceWidth * scale),
    height: Math.round(sourceHeight * scale)
  };
}
