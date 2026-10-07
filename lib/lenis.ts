import type Lenis from "lenis";

// Shared Lenis instance so nav links can scroll smoothly.
let instance: Lenis | null = null;

export const setLenis = (l: Lenis | null) => {
  instance = l;
};

export const getLenis = () => instance;

export function scrollToHash(hash: string) {
  const target = document.querySelector(hash) as HTMLElement | null;
  if (!target) return;
  if (instance) instance.scrollTo(target, { offset: 0, duration: 1.6 });
  else target.scrollIntoView({ behavior: "smooth" });
}
