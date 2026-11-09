import { el } from './dom.js';

export interface ModalConfig {
  readonly title: string;
  readonly body: readonly Node[];
  readonly onClose: () => void;
}

export interface ModalController {
  readonly element: HTMLElement;
  focus(): void;
}

export const createModal = ({
  title,
  body,
  onClose,
}: ModalConfig): ModalController => {
  const overlay = el('div', 'modal');
  const dialog = el('div', 'modal__dialog');
  dialog.tabIndex = -1;
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-label', title);

  const header = el('header', 'modal__header');
  header.append(el('h2', 'modal__title', title));
  const closeButton = el('button', 'modal__close', '✕');
  closeButton.type = 'button';
  closeButton.setAttribute('aria-label', 'Закрыть');
  closeButton.addEventListener('click', onClose);
  header.append(closeButton);

  const content = el('div', 'modal__body');
  content.append(...body);

  dialog.append(header, content);
  overlay.append(dialog);

  overlay.addEventListener('click', event => {
    if (event.target === overlay) {
      onClose();
    }
  });

  const onKeyDown = (event: KeyboardEvent): void => {
    if (!overlay.isConnected) {
      document.removeEventListener('keydown', onKeyDown);
      return;
    }
    if (event.key === 'Escape') {
      onClose();
    }
  };
  document.addEventListener('keydown', onKeyDown);

  return {
    element: overlay,
    focus: () => dialog.focus(),
  };
};
