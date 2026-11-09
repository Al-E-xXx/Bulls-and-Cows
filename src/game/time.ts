import type { TimeMs } from './types.js';

export const elapsedMs = (startedAt: TimeMs, now: TimeMs): TimeMs =>
  Math.max(0, now - startedAt);

const pad = (value: number): string => String(value).padStart(2, '0');

export const formatDuration = (durationMs: TimeMs): string => {
  const totalSeconds = Math.floor(Math.max(0, durationMs) / 1_000);
  const hours = Math.floor(totalSeconds / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${minutes}:${pad(seconds)}`;
};
