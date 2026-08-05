"use client";

import { useEffect } from "react";

/**
 * One IntersectionObserver for every entrance on the page.
 *
 * Mounted once per route that uses the reveal primitives. It unobserves
 * each element as it fires, so the observer empties itself as the visitor
 * scrolls and costs nothing afterwards.
 *
 * Elements already in the viewport are marked in the same pass, so the
 * first screen does not wait on a scroll event.
 */
export function RevealObserver() {
  useEffect(() => {
    const targets = document.querySelectorAll<HTMLElement>(
      "[data-reveal]:not(.is-in)"
    );
    if (targets.length === 0) return;

    // No support (or a browser that has already painted): show everything
    // rather than leaving content hidden.
    if (typeof IntersectionObserver === "undefined") {
      targets.forEach((el) => el.classList.add("is-in"));
      return;
    }

    const reveal = (el: Element) => {
      el.classList.add("is-in");
      observer.unobserve(el);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            reveal(entry.target);
            continue;
          }
          // Scrolled clean past without ever being reported as visible —
          // a very fast flick, or a jump to an anchor further down. Show
          // it rather than leaving it hidden above the fold.
          if (entry.boundingClientRect.bottom < 0) reveal(entry.target);
        }
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.02 }
    );

    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return null;
}
