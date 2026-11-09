const createHeader = (): HTMLElement => {
  const header = document.createElement('header');
  const title = document.createElement('h1');
  title.textContent = 'Быки и коровы';
  header.append(title);
  return header;
};

const createMain = (): HTMLElement => document.createElement('main');

const mountRootLayout = (): void => {
  document.body.append(createHeader(), createMain());
};

mountRootLayout();

export {};
