// Load orchestration for option E.
// Heavy 3D scenes are built one at a time, each in its own task, so the main thread never freezes for
// seconds (a long freeze made the intro jump to its end). The preloader waits only for what the opening
// needs (the hero's globe, its Earth textures, the live content): the scenes further down the page are queued
// as deferred builds, which start once the opening has been revealed (releaseDeferred) and run one at a time
// in idle moments, top of the page first, long before the visitor scrolls down to them.

type Job = { run: () => (() => void) | void; cleanup?: (() => void) | void; done: boolean; deferred: boolean };

const queue: Job[] = [];
let running = false;
let held = false;
let released = false;
let assetsPending = 0;
let total = 0;
let finished = 0;
const waiters = new Set<() => void>();

function settle() {
  if (held || running || queue.some((j) => !j.done && !j.deferred) || assetsPending > 0) return;
  waiters.forEach((w) => w());
  waiters.clear();
}

/**
 * Holds every queued build (and the preloader) until the returned function is called: the live content is
 * fetched first, so each scene is built once, with it (see content.tsx).
 */
export function holdBuilds() {
  held = true;
  return () => {
    if (!held) return;
    held = false;
    pump();
  };
}

/** Lets the deferred builds start: called once the opening has been revealed. */
export function releaseDeferred() {
  if (released) return;
  released = true;
  pump();
}

function pump() {
  if (running || held) return;
  // what the opening needs comes first; the deferred builds only once released
  const next = queue.find((j) => !j.done && !j.deferred) ?? (released ? queue.find((j) => !j.done) : undefined);
  if (!next) return settle();
  running = true;
  const go = () => {
    // (a build cancelled while it waited, e.g. its section unmounted, is skipped)
    if (queue.includes(next)) {
      try {
        next.cleanup = next.run();
      } catch {
        // a scene that fails to build (e.g. no WebGL) must not block the rest of the page
      }
      next.done = true;
      if (!next.deferred) finished++;
    }
    running = false;
    pump();
  };
  // a fresh task per build, so the browser can paint (and the preloader can animate) in between; the
  // deferred ones wait for an idle moment, so they do not interrupt the page as it is being used
  if (next.deferred && typeof window !== "undefined" && "requestIdleCallback" in window) window.requestIdleCallback(go, { timeout: 1500 });
  else setTimeout(go, 0);
}

/**
 * Queues a scene build; returns the effect cleanup (cancels it if not built yet, else runs its cleanup).
 * `defer`: a scene further down the page, built after the opening is revealed rather than before.
 */
export function queueBuild(run: () => (() => void) | void, opts: { defer?: boolean } = {}) {
  const job: Job = { run, done: false, deferred: Boolean(opts.defer) };
  queue.push(job);
  if (!job.deferred) total++;
  pump();
  return () => {
    const i = queue.indexOf(job);
    if (i >= 0) queue.splice(i, 1);
    if (job.done) job.cleanup?.();
    else {
      if (!job.deferred) total--;
      settle();
    }
  };
}

/** Marks an asset as loading; call the returned function once it has loaded (or failed). */
export function trackAsset() {
  assetsPending++;
  total++;
  let called = false;
  return () => {
    if (called) return;
    called = true;
    assetsPending--;
    finished++;
    settle();
  };
}

/** Share of queued work done so far (0–1), for the preloader's bar. */
export const loadProgress = () => (total ? finished / total : 0);

/** Runs `fn` once everything the opening needs has finished. */
export function whenLoaded(fn: () => void) {
  waiters.add(fn);
  // let effects that mount in the same commit register their work first
  setTimeout(settle, 0);
  return () => waiters.delete(fn);
}
