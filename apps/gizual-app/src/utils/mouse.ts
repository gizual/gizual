export const MOUSE_BUTTON_PRIMARY = 0;
export const MOUSE_BUTTON_WHEEL = 1;
export const MOUSE_ZOOM_FACTOR = 0.05;
export const MOUSE_ZOOM_FACTOR_FINE = 0.005;

let wheelUnusedTicks = 0;
export function accumulateWheelTicks(ticks: number) {
  // If the scroll direction changed, reset the accumulated wheel ticks.
  if ((wheelUnusedTicks > 0 && ticks < 0) || (wheelUnusedTicks < 0 && ticks > 0)) {
    wheelUnusedTicks = 0;
  }
  wheelUnusedTicks += ticks;
  const wholeTicks = Math.sign(wheelUnusedTicks) * Math.floor(Math.abs(wheelUnusedTicks));
  wheelUnusedTicks -= wholeTicks;
  return wholeTicks;
}

export function normalizeWheelEventDirection(evt: WheelEvent) {
  let delta = Math.hypot(evt.deltaX, evt.deltaY);
  const angle = Math.atan2(evt.deltaY, evt.deltaX);
  if (-0.25 * Math.PI < angle && angle < 0.75 * Math.PI) {
    // All that is left-up oriented has to change the sign.
    delta = -delta;
  }
  return delta;
}
