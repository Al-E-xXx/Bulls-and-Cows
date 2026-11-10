export const el = <Tag extends keyof HTMLElementTagNameMap>(
  tag: Tag,
  className = '',
  text?: string,
): HTMLElementTagNameMap[Tag] => {
  const node = document.createElement(tag);
  if (className !== '') {
    node.className = className;
  }
  if (text !== undefined) {
    node.textContent = text;
  }
  return node;
};

export const clearNode = (node: HTMLElement): void => {
  node.replaceChildren();
};

export const scrollToEnd = (node: HTMLElement): void => {
  node.scrollTop = node.scrollHeight;
};
