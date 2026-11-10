import type {
  Code,
  GameState,
  GuessEvaluation,
  RoundSettings,
  TimeMs,
} from './types';

export const startRound = (
  settings: RoundSettings,
  secret: Code,
  startedAt: TimeMs,
): GameState => ({
  status: 'playing',
  settings,
  secret,
  history: [],
  startedAt,
});

export const registerAttempt = (
  state: GameState,
  guess: Code,
  evaluation: GuessEvaluation,
  now: TimeMs,
): GameState => {
  if (state.status !== 'playing') {
    return state;
  }
  if (state.history.some(item => item.guess === guess)) {
    return state;
  }
  const next = {
    ...state,
    history: [
      ...state.history,
      { attempt: state.history.length + 1, guess, evaluation },
    ],
  };
  return evaluation.bulls === state.settings.length
    ? { ...next, status: 'won', finishedAt: now }
    : next;
};
