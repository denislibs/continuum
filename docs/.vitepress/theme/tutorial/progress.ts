// Tutorial progress, persisted in localStorage: which steps of which track a
// learner has completed. Pure functions over one JSON blob — no reactivity,
// the UI re-reads after each mutation. Gamification (phase 4) layers badges
// and streaks on top of this.

const KEY = "continuum-tutorial-progress";

/** trackId -> completed step ids. */
export type Progress = Record<string, string[]>;

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Progress) : {};
  } catch {
    return {};
  }
}

function save(p: Progress): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* private mode / quota — progress is best-effort */
  }
}

export function markComplete(trackId: string, stepId: string): Progress {
  const p = loadProgress();
  const done = p[trackId] ?? [];
  if (!done.includes(stepId)) done.push(stepId);
  p[trackId] = done;
  save(p);
  return p;
}

export function isComplete(trackId: string, stepId: string): boolean {
  return (loadProgress()[trackId] ?? []).includes(stepId);
}

/** Percent of a track's steps completed, rounded to an integer. */
export function trackPercent(track: { id: string; steps: string[] }): number {
  if (track.steps.length === 0) return 0;
  const done = loadProgress()[track.id] ?? [];
  const hit = track.steps.filter((s) => done.includes(s)).length;
  return Math.round((hit / track.steps.length) * 100);
}
