export type NumericBase = 2 | 8 | 10 | 16;

export type BaseLabel = 'bin' | 'oct' | 'dec' | 'hex';

export interface RoundSettings {
  readonly length: number;
  readonly base: NumericBase;
}

export type Code = string;

export interface GuessEvaluation {
  readonly bulls: number;
  readonly cows: number;
}

export interface HistoryEntry {
  readonly attempt: number;
  readonly guess: Code;
  readonly evaluation: GuessEvaluation;
}

export type TimeMs = number;

export interface RecordEntry {
  readonly length: number;
  readonly base: NumericBase;
  readonly date: string;
  readonly attempts: number;
  readonly timeMs: TimeMs;
}

export interface RecordsTableKey {
  readonly length: number;
  readonly base: NumericBase;
}

export interface RecordsTable {
  readonly key: RecordsTableKey;
  readonly records: readonly RecordEntry[];
}

export type GameState =
  | { readonly status: 'idle'; readonly settings: RoundSettings }
  | {
      readonly status: 'playing';
      readonly settings: RoundSettings;
      readonly secret: Code;
      readonly history: readonly HistoryEntry[];
      readonly startedAt: TimeMs;
    }
  | {
      readonly status: 'won';
      readonly settings: RoundSettings;
      readonly secret: Code;
      readonly history: readonly HistoryEntry[];
      readonly startedAt: TimeMs;
      readonly finishedAt: TimeMs;
    };

export type RoundState = Extract<GameState, { status: 'playing' | 'won' }>;
