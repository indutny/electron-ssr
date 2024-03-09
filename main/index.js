import { fileURLToPath } from 'node:url';
import { app, ipcMain, BrowserWindow } from 'electron';
import { createElement } from 'react';

import App from '../components/App.js';
import ReactIPC from './lib/react-ipc.js';

app.whenReady().then(async () => {
  const window = new BrowserWindow({
    webPreferences: {
      preload: fileURLToPath(
        new URL('../renderer/preload.js', import.meta.url),
      ),
      sandbox: true,
    },
  });

  window.loadFile(
    fileURLToPath(new URL('../renderer/index.html', import.meta.url)),
  );

  const reactIPC = new ReactIPC(window.webContents);

  reactIPC.render(createElement(App));
});
