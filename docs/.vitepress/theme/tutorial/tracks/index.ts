import type { Track } from "../types";
import { basics } from "./basics";
import { streams } from "./streams";
import { dom } from "./dom";
import { patterns } from "./patterns";
import { asyncTrack } from "./async";
import { router } from "./router";
import { forms } from "./forms";

// All tutorial tracks, in learning order.
export const tracks: Track[] = [
  basics,
  streams,
  dom,
  patterns,
  asyncTrack,
  router,
  forms,
];

export function findTrack(id: string): Track | undefined {
  return tracks.find((t) => t.id === id);
}
