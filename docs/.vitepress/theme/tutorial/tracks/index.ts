import type { Track } from "../types";
import { basics } from "./basics";

// All tutorial tracks, in learning order. Phase 3 ships Basics; Streams, DOM
// and Patterns tracks slot in here as they are written.
export const tracks: Track[] = [basics];

export function findTrack(id: string): Track | undefined {
  return tracks.find((t) => t.id === id);
}
