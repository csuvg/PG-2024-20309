import { app, shell, BrowserWindow, ipcMain, globalShortcut, clipboard } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import icon from '../../resources/icon.png?asset';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import { Suggestion } from '../common/types';
import robot from 'robotjs';

let mainWindow: BrowserWindow;
const userModelPath = path.join(app.getPath('userData'), 'ngram-model.json');
const initialModelPath = path.join(app.getAppPath(), 'dist', 'resources', 'initial-ngram-model.json');
// const userModelPath = path.join(app.getAppPath(), 'dist', 'resources', 'initial-trigram-model.json');
let ngrams: { [key: string]: { [key: string]: number } } = {};

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 900,
    show: false,
    alwaysOnTop: true,
    frame: true,
    focusable: true, // ! Changed
    skipTaskbar: true,
    autoHideMenuBar: true,
    transparent: false,
    ...((process.platform === 'linux') ? { icon } : {}),
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      backgroundThrottling: false,
      sandbox: false,
    },
  });
  
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
    loadModel();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  mainWindow.setBackgroundColor('#00000000');
}

async function loadModel() {
  try {
    const userModelExists = await fs.access(userModelPath).then(() => true).catch(() => false);
    let initialModelExists;
    if (userModelExists) {
      const data = await fs.readFile(userModelPath, 'utf-8');
      ngrams = JSON.parse(data);
    } else {
      initialModelExists = await fs.access(initialModelPath).then(() => true).catch(() => false);
      if (initialModelExists) {
        const data = await fs.readFile(initialModelPath, 'utf-8');
        ngrams = JSON.parse(data);
      } else {
        ngrams = {};
      }
    }
    if (userModelExists || initialModelExists) {
      mainWindow.webContents.send('model-load-status', { success: true });
    } else {
      mainWindow.webContents.send('model-load-status', { success: false, error: 'Model file not found.' });
    }
  } catch (error) {
    console.error('Error loading model:', error);
    mainWindow.webContents.send('model-load-status', { success: false, error: error });
    ngrams = {};
  }
}

async function saveModel() {
  try {
    await fs.writeFile(userModelPath, JSON.stringify(ngrams));
  } catch (error) {
    console.error('Error saving model:', error);
  }
}

app.whenReady().then(async () => {
  electronApp.setAppUserModelId('com.electron');

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  ipcMain.on('ping', () => console.log('pong'));

  createWindow();
  await loadModel();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  const registered = globalShortcut.register('Space', () => {
    mainWindow.webContents.send('select');
  });

  if (!registered) {
    console.error('Failed to register global shortcut: Space');
  }

  globalShortcut.register('F12', () => {
    mainWindow.webContents.toggleDevTools();
  });
});

ipcMain.on('update-settings', (_, settings) => {
  globalShortcut.unregisterAll();

  const inputMode = settings.inputMode;
  const inputKey = settings.inputKey;

  let shortcutKey = 'Space';

  if (inputMode === 'custom') {
    if (inputKey) {
      shortcutKey = inputKey.toUpperCase();
    }
  } else if (inputMode === 'keyboard') {
    shortcutKey = 'Space';
  }

  const registered = globalShortcut.register(shortcutKey, () => {
    mainWindow.webContents.send('select');
  });

  if (!registered) {
    console.error(`Failed to register global shortcut: ${shortcutKey}`);
  }
});

ipcMain.handle('get-predictions', (_, context: string) => {
  const tokens = context.trim().split(/\s+/);
  const lastWord = tokens[tokens.length - 1].toLowerCase();

  if (ngrams[lastWord]) {
    const nextWords = ngrams[lastWord];
    const totalFrequency = Object.values(nextWords).reduce((a, b) => a + b, 0);

    const suggestions = Object.entries(nextWords)
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map((item) => ({
        word: item.word,
        percentage: ((item.count / totalFrequency) * 100).toFixed(2),
      }));

    return suggestions as Suggestion[];
  } else {
    return [];
  }
});

ipcMain.handle('get-word-completions', (_, currentWord: string) => {
  currentWord = currentWord.toLowerCase();
  const completions: { word: string; count: number }[] = [];

  for (const word in ngrams) {
    if (word.startsWith(currentWord) && word !== currentWord) {
      const totalFrequency = Object.values(ngrams[word]).reduce((a, b) => a + b, 0);
      completions.push({ word, count: totalFrequency });
    }
  }

  completions.sort((a, b) => b.count - a.count);

  const totalCounts = completions.reduce((sum, item) => sum + item.count, 0);

  const suggestions = completions.slice(0, 10).map((item) => ({
    word: item.word,
    percentage: ((item.count / totalCounts) * 100).toFixed(2),
  }));

  return suggestions as Suggestion[];
});

ipcMain.handle('update-model', (_, sentence: string) => {
  const tokens = sentence.trim().split(/\s+/).map((token) => token.toLowerCase());
  for (let i = 0; i < tokens.length - 1; i++) {
    const word = tokens[i];
    const nextWord = tokens[i + 1];

    if (!ngrams[word]) {
      ngrams[word] = {};
    }
    if (!ngrams[word][nextWord]) {
      ngrams[word][nextWord] = 0;
    }
    ngrams[word][nextWord] += 1;
  }
  saveModel();
});

ipcMain.handle('type-text', async (_, text: string) => {
  try {
    globalShortcut.unregister('Space');
    robot.setKeyboardDelay(0);

    const isEmoji = /[\u{1F600}-\u{1F64F}]/u.test(text);

    if (isEmoji || text === '¿' || text === '¡' || text.length > 3) {
      clipboard.writeText(text);
      robot.keyTap('v', process.platform === 'darwin' ? 'command' : 'control');
      clipboard.clear()
    } else {
      await robot.typeString(text); // * Probably optimization or bug
    }
  } catch (error) {
    console.error('Error typing text:', error);
  } finally {
    globalShortcut.register('Space', () => {
      mainWindow.webContents.send('select');
    });
  }
});

ipcMain.handle('send-key-press', (_, keyLabel: string) => {
  try {
    robot.setKeyboardDelay(0);
    switch (keyLabel) {
      case 'Tab':
        robot.keyTap('tab');
        break;
      case 'Enter':
        robot.keyTap('enter');
        break;
      case '↑':
        robot.keyTap('up');
        break;
      case '↓':
        robot.keyTap('down');
        break;
      case '←':
        robot.keyTap('left');
        break;
      case '→':
        robot.keyTap('right');
        break;
      case 'Page Up':
        robot.keyTap('pageup');
        break;
      case 'Page Down':
        robot.keyTap('pagedown');
        break;
      case 'Home':
        robot.keyTap('home');
        break;
      case 'End':
        robot.keyTap('end');
        break;
      case 'Alt':
        robot.keyTap('alt');
        break;
      case 'Esc':
        robot.keyTap('escape');
        break;
      case 'Change Window':
        robot.keyTap(`escape`,`alt`);
        break;
      case 'Close Window':
        robot.keyTap('f4', 'alt');
        break;
      case 'Search Bar':
        robot.keyTap('l', 'control');
        break;
      case 'New Tab':
        robot.keyTap('t', 'control');
        break;
      case 'Close Tab':
        robot.keyTap('w', 'control');
        break;
      case 'Switch Tab':
        robot.keyTap('tab', 'control');
        break;
      case 'Go Forward':
        robot.keyTap('browserforward');
        break;
      case 'Re-open Tab':
        robot.keyTap('t', ['shift', 'control']);
        break;
      case 'Shift+Space':
        robot.keyTap('space', 'shift');
        break;
      case 'Go Back':
        robot.keyTap('browserback');
        break;
      case 'Backspace':
        robot.keyTap('backspace');
        break;
      default:
        break;
    }
  } catch (error) {
    console.error('Error sending key press:', error);
  }
});

ipcMain.handle('set-transparency', (_, transparency: boolean) => {
  mainWindow.setOpacity(transparency ? 0.8 : 1.0); 
});

ipcMain.handle('set-window-size', (_, width: number, height: number) => {
  mainWindow.setSize(width, height);
});

ipcMain.handle('set-window-position', (_, position: string) => {
  const { width, height } = mainWindow.getBounds();
  const { width: screenWidth, height: screenHeight } = require('electron').screen.getPrimaryDisplay().workAreaSize;
  let x = 0;
  let y = 0;

  switch (position.toLowerCase()) {
    case '◰':
      x = 0;
      y = 0;
      break;
    case '◳':
      x = screenWidth - width;
      y = 0;
      break;
    case '◱':
      x = 0;
      y = screenHeight - height;
      break;
    case '◲':
      x = screenWidth - width;
      y = screenHeight - height;
      break;
    case '☐':
    default:
      x = (screenWidth - width) / 2;
      y = (screenHeight - height) / 2;
      break;
  }
  mainWindow.setPosition(x, y);
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
