// Lets sections wait for the preloader to finish before running entrance animations.
let done = false;
const listeners = new Set<() => void>();

export function markIntroDone() {
  if (done) return;
  done = true;
  listeners.forEach((fn) => fn());
  listeners.clear();
}

/** Called by each page's preloader so client-side navigation replays the intro. */
export function resetIntro() {
  done = false;
}

export function onIntroDone(fn: () => void) {
  if (done) fn();
  else listeners.add(fn);
  return () => listeners.delete(fn);
}
