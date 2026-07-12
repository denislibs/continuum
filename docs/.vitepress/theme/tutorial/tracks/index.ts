import type { Track } from "../types";
import { basics } from "./basics";
import { streams } from "./streams";
import { dom } from "./dom";
import { patterns } from "./patterns";

// All tutorial tracks, in learning order.
export const tracks: Track[] = [basics, streams, dom, patterns];

export function findTrack(id: string): Track | undefined {
  return tracks.find((t) => t.id === id);
}
