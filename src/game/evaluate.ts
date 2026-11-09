import type { Code, GuessEvaluation } from './types';

export const evaluateGuess = (secret: Code, guess: Code): GuessEvaluation => {
  const guessDigits = Array.from(guess);
  const bulls = Array.from(secret).filter(
    (digit, index) => digit === guessDigits[index],
  ).length;
  const shared = Array.from(guess).filter(digit =>
    Array.from(secret).includes(digit),
  ).length;
  return { bulls, cows: shared - bulls };
};
