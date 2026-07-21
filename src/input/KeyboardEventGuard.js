export function createKeyboardEventGuard() {
  const consumedEvents = new WeakSet();

  return (event) => {
    const trackable = (typeof event === 'object' && event !== null) || typeof event === 'function';
    if (!trackable) return true;
    if (consumedEvents.has(event)) return false;
    consumedEvents.add(event);
    return true;
  };
}
