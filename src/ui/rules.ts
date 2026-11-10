import { el } from './dom.js';
import { RULES_BLOCKS } from './rulesContent.js';
import type { RulesBlock } from './rulesContent.js';

const createRulesList = (items: readonly string[]): HTMLElement => {
  const list = el('ul', 'rules__list');
  list.append(...items.map(item => el('li', 'rules__item', item)));
  return list;
};

const renderRulesBlock = (block: RulesBlock): HTMLElement => {
  if (block.type === 'heading') {
    return el('h2', 'rules__heading', block.text);
  }
  if (block.type === 'list') {
    return createRulesList(block.items);
  }
  return el('p', 'rules__text', block.text);
};

export const createRulesPanel = (
  blocks: readonly RulesBlock[] = RULES_BLOCKS,
): HTMLElement => {
  const panel = el('div', 'rules');
  panel.append(...blocks.map(renderRulesBlock));
  return panel;
};
