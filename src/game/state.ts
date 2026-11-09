import type {
  Code,
  GameState,
  GuessEvaluation,
  RoundSettings,
  TimeMs,
} from './types';

export const startRound = (
  _settings: RoundSettings,
  _secret: Code,
  _startedAt: TimeMs,
): GameState => {
  throw new Error('not implemented');
};

export const registerAttempt = (
  _state: GameState,
  _guess: Code,
  _evaluation: GuessEvaluation,
  _now: TimeMs,
): GameState => {
  throw new Error('not implemented');
};
