import { describe, expect, it } from 'vitest';

import { elapsedMs, formatDuration } from './time.js';

describe('elapsedMs', () => {
  it('returns the difference between now and start', () => {
    expect(elapsedMs(100, 2_500)).toBe(2_400);
  });

  it('returns zero when now equals start', () => {
    expect(elapsedMs(500, 500)).toBe(0);
  });

  it('never returns a negative duration', () => {
    expect(elapsedMs(1_000, 900)).toBe(0);
  });
});

describe('formatDuration', () => {
  it('formats sub-minute durations as m:ss', () => {
    expect(formatDuration(0)).toBe('0:00');
    expect(formatDuration(1_000)).toBe('0:01');
    expect(formatDuration(9_000)).toBe('0:09');
  });

  it('floors milliseconds to whole seconds', () => {
    expect(formatDuration(5_999)).toBe('0:05');
    expect(formatDuration(1_999)).toBe('0:01');
  });

  it('rolls minutes over at 60 seconds', () => {
    expect(formatDuration(60_000)).toBe('1:00');
    expect(formatDuration(65_000)).toBe('1:05');
    expect(formatDuration(59_999)).toBe('0:59');
    expect(formatDuration(3_599_000)).toBe('59:59');
  });

  it('switches to h:mm:ss when hours appear', () => {
    expect(formatDuration(3_600_000)).toBe('1:00:00');
    expect(formatDuration(3_723_000)).toBe('1:02:03');
    expect(formatDuration(36_000_000)).toBe('10:00:00');
  });

  it('clamps negative durations to zero', () => {
    expect(formatDuration(-5)).toBe('0:00');
  });
});
