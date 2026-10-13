import { useEffect, useState } from "react";

export type ChartTransitionTarget = {
  start: number;
  span: number;
};

export type ChartTransitionState = {
  /** Live interpolated values, ready to feed straight into the x-scale. */
  start: number;
  span: number;
  /** Raw endpoints and progress, for callers (e.g. team-label tweening) that need their own
   * interpolation using a different quantity than start/span. */
  fromStart: number;
  fromSpan: number;
  toStart: number;
  toSpan: number;
  /** Linear 0..1 time-progress; apply `interpolate`/`easeInOutCubic` to it, don't use it raw. */
  progress: number;
  reducedMotion: boolean;
};

const DURATION_MS = 300;

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** The one interpolation formula every consumer of this hook should share, so the scale and
 * anything else driven by `progress` (e.g. team-label Y) move on the exact same curve.
 * Special-cases the endpoints rather than relying on `from + (to - from) * 1 === to`, which
 * floating-point arithmetic doesn't actually guarantee — FR-004 requires the settled state to
 * be identical to the non-animated one, not merely close to it. */
export function interpolate(from: number, to: number, progress: number): number {
  if (progress >= 1) return to;
  if (progress <= 0) return from;
  return from + (to - from) * easeInOutCubic(progress);
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

type Tween = {
  fromStart: number;
  fromSpan: number;
  toStart: number;
  toSpan: number;
  progress: number;
};

/**
 * Animates toward whatever `target` currently is, from wherever the chart was previously
 * rendered — whether `target` changed because the zoom toggle flipped or because panning moved
 * `start`. A retarget mid-flight continues from the current interpolated position rather than
 * resetting. See specs/003-zoom-transition-animation/research.md §1, §5.
 */
export function useChartTransition(target: ChartTransitionTarget): ChartTransitionState {
  const [tween, setTween] = useState<Tween>(() => ({
    fromStart: target.start,
    fromSpan: target.span,
    toStart: target.start,
    toSpan: target.span,
    progress: 1,
  }));
  // Tracks `target` as of the last render so a change can be caught and reacted to *during*
  // render (React's "adjusting state when a prop changes" pattern) rather than in a `useEffect`
  // — the same fix `002-view-full-season` needed for its `set-state-in-effect` lint failure
  // (research.md §7), which turns out to apply here too, just for a different effect.
  const [prevTarget, setPrevTarget] = useState(target);

  if (prevTarget.start !== target.start || prevTarget.span !== target.span) {
    setPrevTarget(target);
    // A new (or changed) target starts a tween, retargeting from the *current* interpolated
    // position — not the original pre-transition one — if one was already in flight.
    setTween((prev) => {
      const currentStart = interpolate(prev.fromStart, prev.toStart, prev.progress);
      const currentSpan = interpolate(prev.fromSpan, prev.toSpan, prev.progress);
      return {
        fromStart: currentStart,
        fromSpan: currentSpan,
        toStart: target.start,
        toSpan: target.span,
        progress: prefersReducedMotion() ? 1 : 0,
      };
    });
  }

  // Drive the rAF loop whenever a tween is in flight. setState only happens inside the frame
  // callback (never synchronously in the effect body) — see research.md §7.
  useEffect(() => {
    if (tween.progress >= 1) return;
    const beginTime = performance.now();
    const beginProgress = tween.progress;
    let frame: number;
    const step = (now: number) => {
      const elapsed = now - beginTime;
      const next = Math.min(1, beginProgress + elapsed / DURATION_MS);
      setTween((prev) => (prev.progress >= 1 ? prev : { ...prev, progress: next }));
      if (next < 1) {
        frame = requestAnimationFrame(step);
      }
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
    // Only (re)start when a new tween begins (toStart/toSpan change) or a retarget resets
    // progress below 1 again; progress ticking up on its own shouldn't restart this effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tween.toStart, tween.toSpan]);

  return {
    start: interpolate(tween.fromStart, tween.toStart, tween.progress),
    span: interpolate(tween.fromSpan, tween.toSpan, tween.progress),
    fromStart: tween.fromStart,
    fromSpan: tween.fromSpan,
    toStart: tween.toStart,
    toSpan: tween.toSpan,
    progress: tween.progress,
    reducedMotion: prefersReducedMotion(),
  };
}
