import { el } from './dom.js';

const LOGO_SRC = './assets/name.webp';
const LOGO_ALT = 'Логотип игры „Быки и коровы“';
const SAFETY_MS = 4000;

export const playLogoIntro = (blocked: readonly HTMLElement[]): void => {
  const logo = el('img', 'intro__logo');
  logo.src = LOGO_SRC;
  logo.alt = LOGO_ALT;

  const overlay = el('div', 'intro');
  overlay.append(logo);

  const finish = (): void => {
    overlay.remove();
    blocked.forEach(node => {
      node.inert = false;
    });
  };

  blocked.forEach(node => {
    node.inert = true;
  });

  logo.addEventListener('animationend', finish, { once: true });
  window.setTimeout(finish, SAFETY_MS);
  document.body.append(overlay);
};
