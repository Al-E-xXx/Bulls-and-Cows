export type RulesBlock =
  | { readonly type: 'heading'; readonly text: string }
  | { readonly type: 'text'; readonly text: string }
  | { readonly type: 'list'; readonly items: readonly string[] };

export interface RulesExample {
  readonly secret: string;
  readonly guess: string;
  readonly bulls: number;
  readonly cows: number;
}

export const RULES_EXAMPLE: RulesExample = {
  secret: '4271',
  guess: '4712',
  bulls: 1,
  cows: 3,
};

const exampleText = (example: RulesExample): string =>
  `Например: задумано ${example.secret}, вы ввели ${example.guess} — ` +
  `${example.bulls} быка и ${example.cows} коровы.`;

export const RULES_BLOCKS: readonly RulesBlock[] = [
  {
    type: 'heading',
    text: 'Как играть',
  },
  {
    type: 'text',
    text: 'Компьютер задумывает число: все цифры в нём разные. Ваша задача — отгадать его за минимальное число попыток.',
  },
  {
    type: 'list',
    items: [
      'Выберите длину числа и систему счисления: 2, 8, 10 или 16.',
      'Для двоичной системы доступна только длина 2 — больше различных цифр в ней не помещается.',
      'Введите свою версию числа и нажмите «Проверить».',
    ],
  },
  {
    type: 'heading',
    text: 'Оценка попытки',
  },
  {
    type: 'list',
    items: [
      'бык — цифра угадана и стоит на своём месте.',
      'корова — цифра есть в числе, но стоит на другом месте.',
      'цифра не встречается в задуманном числе — она не даёт ни быков, ни коров.',
    ],
  },
  {
    type: 'text',
    text: exampleText(RULES_EXAMPLE),
  },
  {
    type: 'heading',
    text: 'Ответы компьютера',
  },
  {
    type: 'list',
    items: [
      'число отформатировано неверно — проверьте длину и символы.',
      'повторная попытка — такое число уже было, вводите новое.',
      'нет быков и нет коров — ни одной общей цифры с загадкой.',
      'N быков и M коров — обычный ответ по ходу игры.',
      'поздравляем, число угадано — вы выиграли, счёт закрывается.',
    ],
  },
  {
    type: 'heading',
    text: 'Полезные детали',
  },
  {
    type: 'list',
    items: [
      'все цифры версии разные: повторная попытка не засчитывается и не тратится.',
      'буквы шестнадцатеричной системы вводите в любом регистре — a и A равнозначны.',
      'история попыток показана в левой колонке, там же идут сообщения об ошибках.',
      'результат попытки — это быки и коровы, а не сами попытки: их не сохранить.',
      'лучшие результаты по длине и системе счисления откроются в «Рекордах».',
      'новая игра во время раунда запрашивает подтверждение.',
    ],
  },
];
