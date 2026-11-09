import { describe, expect, it } from 'vitest';

import { registerAttempt, startRound } from './state';
import type {
  Code,
  GameState,
  GuessEvaluation,
  HistoryEntry,
  NumericBase,
  RoundSettings,
} from './types';

type Playing = Extract<GameState, { status: 'playing' }>;
type Won = Extract<GameState, { status: 'won' }>;

const settings: RoundSettings = { length: 4, base: 10 };
const secret: Code = '1234';
const startedAt = 1000;

const hit: GuessEvaluation = { bulls: 1, cows: 1 };
const win: GuessEvaluation = { bulls: settings.length, cows: 0 };

const entry = (attempt: number, guess: Code): HistoryEntry => ({
  attempt,
  guess,
  evaluation: hit,
});

const playing = (history: readonly HistoryEntry[] = []): Playing => ({
  status: 'playing',
  settings,
  secret,
  history,
  startedAt,
});

const won: Won = {
  status: 'won',
  settings,
  secret,
  history: [entry(1, '1234')],
  startedAt,
  finishedAt: 5000,
};

const idle: GameState = { status: 'idle', settings };

const asPlaying = (state: GameState): Playing => {
  if (state.status !== 'playing') {
    throw new Error(`expected a playing state, got ${state.status}`);
  }
  return state;
};

const asWon = (state: GameState): Won => {
  if (state.status !== 'won') {
    throw new Error(`expected a won state, got ${state.status}`);
  }
  return state;
};

describe('startRound', () => {
  it('returns a playing state with settings, secret and empty history', () => {
    expect(startRound(settings, secret, startedAt)).toStrictEqual({
      status: 'playing',
      settings,
      secret,
      history: [],
      startedAt,
    });
  });

  it('gives every round its own empty history array', () => {
    const first = asPlaying(startRound(settings, '1234', 0));
    const second = asPlaying(startRound(settings, '5678', 0));
    expect(first.history).not.toBe(second.history);
    expect(first.history).toHaveLength(0);
    expect(second.history).toHaveLength(0);
  });

  it('keeps settings of each round separate', () => {
    const bin: RoundSettings = { length: 2, base: 2 };
    const hex: RoundSettings = { length: 6, base: 16 };
    expect(asPlaying(startRound(bin, '01', 0)).settings).toStrictEqual(bin);
    expect(asPlaying(startRound(hex, 'a1b2c3', 0)).settings).toStrictEqual(hex);
  });

  it('does not mutate the settings object passed in', () => {
    const original: RoundSettings = { length: 3, base: 8 };
    startRound(original, '123', 0);
    expect(original).toStrictEqual({ length: 3, base: 8 });
  });
});

describe('registerAttempt', () => {
  it('adds a history entry with the attempt number and evaluation', () => {
    const next = asPlaying(registerAttempt(playing(), '4321', hit, 2000));
    expect(next.history).toStrictEqual([
      { attempt: 1, guess: '4321', evaluation: hit },
    ]);
  });

  it('returns a new state object with a new history array', () => {
    const before = playing([entry(1, '1112')]);
    const next = registerAttempt(before, '3456', hit, 2000);
    expect(next).not.toBe(before);
    expect(asPlaying(next).history).not.toBe(before.history);
  });

  it('does not change the previous state', () => {
    const before = playing([entry(1, '1112')]);
    const historyBefore = before.history;
    registerAttempt(before, '3456', hit, 2000);
    expect(before.history).toBe(historyBefore);
    expect(before.history).toHaveLength(1);
  });

  it('keeps previous history entries unmutated', () => {
    const first = entry(1, '1112');
    const next = asPlaying(
      registerAttempt(playing([first]), '3456', hit, 2000),
    );
    expect(next.history[0]).toBe(first);
    expect(next.history[1]).toStrictEqual({
      attempt: 2,
      guess: '3456',
      evaluation: hit,
    });
  });

  it('numbers attempts sequentially', () => {
    const one = registerAttempt(playing(), '1112', hit, 1500);
    const two = registerAttempt(one, '1113', hit, 1600);
    const three = registerAttempt(two, '1114', hit, 1700);
    const history = asPlaying(three).history;
    expect(history.map(item => item.attempt)).toStrictEqual([1, 2, 3]);
    expect(history.map(item => item.guess)).toStrictEqual([
      '1112',
      '1113',
      '1114',
    ]);
  });

  it('preserves settings, secret and startedAt', () => {
    const next = asPlaying(registerAttempt(playing(), '4321', hit, 2000));
    expect(next.settings).toStrictEqual(settings);
    expect(next.secret).toBe(secret);
    expect(next.startedAt).toBe(startedAt);
    expect(next).not.toHaveProperty('finishedAt');
  });

  it('branches independently from the same previous state', () => {
    const before = playing([entry(1, '1112')]);
    const left = asPlaying(registerAttempt(before, '3334', hit, 2000));
    const right = asPlaying(registerAttempt(before, '5556', hit, 3000));
    expect(left.history.map(item => item.guess)).toStrictEqual([
      '1112',
      '3334',
    ]);
    expect(right.history.map(item => item.guess)).toStrictEqual([
      '1112',
      '5556',
    ]);
    expect(before.history).toHaveLength(1);
  });

  it('stays playing while bulls is below the code length', () => {
    const near: GuessEvaluation = { bulls: settings.length - 1, cows: 1 };
    const next = registerAttempt(playing(), '4321', near, 2000);
    expect(next).toStrictEqual({
      status: 'playing',
      settings,
      secret,
      history: [{ attempt: 1, guess: '4321', evaluation: near }],
      startedAt,
    });
  });

  it('transitions to won when bulls equals the code length', () => {
    const next = registerAttempt(playing(), '1234', win, 2000);
    expect(next).toStrictEqual({
      status: 'won',
      settings,
      secret,
      history: [{ attempt: 1, guess: '1234', evaluation: win }],
      startedAt,
      finishedAt: 2000,
    });
  });

  it('keeps the full history when the round is won', () => {
    const first = registerAttempt(playing(), '1112', hit, 1500);
    const second = registerAttempt(first, '1113', { bulls: 2, cows: 1 }, 1600);
    const third = asWon(registerAttempt(second, '1234', win, 1700));
    expect(third.history.map(item => item.attempt)).toStrictEqual([1, 2, 3]);
    expect(third.history.map(item => item.evaluation.bulls)).toStrictEqual([
      1, 2, 4,
    ]);
    expect(third.finishedAt).toBe(1700);
  });

  const winCases: Array<[number, NumericBase, Code]> = [
    [2, 2, '10'],
    [4, 10, '1234'],
    [6, 16, 'abcdef'],
  ];

  it.each(winCases)(
    'wins at length %i in base %i',
    (length, base, winningGuess) => {
      const round: Playing = {
        status: 'playing',
        settings: { length, base },
        secret: '012345'.slice(0, length),
        history: [],
        startedAt: 0,
      };
      const next = registerAttempt(
        round,
        winningGuess,
        { bulls: length, cows: 0 },
        100,
      );
      expect(asWon(next).status).toBe('won');
    },
  );

  it('rejects a repeated guess and returns the same state', () => {
    const first = registerAttempt(playing(), '1234', hit, 2000);
    const second = registerAttempt(first, '1234', hit, 3000);
    expect(second).toBe(first);
  });

  it('rejects a guess seen earlier in the history', () => {
    const state = playing([
      entry(1, '1112'),
      entry(2, '3334'),
      entry(3, '5556'),
    ]);
    expect(registerAttempt(state, '1112', hit, 4000)).toBe(state);
  });

  it('ignores the evaluation when the guess repeats', () => {
    const state = playing([entry(1, '1112')]);
    const next = registerAttempt(state, '1112', win, 4000);
    expect(next).toBe(state);
  });

  it('ignores an attempt made in the idle state', () => {
    expect(registerAttempt(idle, '1234', win, 2000)).toBe(idle);
  });

  it('ignores an attempt made after the round is won', () => {
    expect(registerAttempt(won, '5678', hit, 9000)).toBe(won);
  });
});
