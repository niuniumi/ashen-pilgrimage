export function isMotionEnabled(settings = {}) {
  return settings.animation !== false;
}

export function motionDuration(settings, fullMs) {
  return isMotionEnabled(settings) ? Math.max(0, Number(fullMs) || 0) : 0;
}
