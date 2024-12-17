import { contextBridge, ipcRenderer } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';
import { Suggestion } from '../common/types';

const api = {
  sendSettings: (settings) => ipcRenderer.send('update-settings', settings),
};

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI);
    contextBridge.exposeInMainWorld('api', api);
    contextBridge.exposeInMainWorld('textPredictor', {
      getPredictions: (context: string) => ipcRenderer.invoke('get-predictions', context) as Promise<Suggestion[]>,
      getWordCompletions: (currentWord: string) => ipcRenderer.invoke('get-word-completions', currentWord) as Promise<Suggestion[]>,
      updateModel: (sentence: string) => ipcRenderer.invoke('update-model', sentence),
      onModelLoadStatus: (callback: (status: { success: boolean; error?: string }) => void) => {
        ipcRenderer.on('model-load-status', (_, status) => {
          callback(status);
        });
      },
    });
    contextBridge.exposeInMainWorld('windowControls', {
      setTransparency: (transparency: boolean) => ipcRenderer.invoke('set-transparency', transparency),
      setWindowSize: (width: number, height: number) => ipcRenderer.invoke('set-window-size', width, height),
      setWindowPosition: (position: string) => ipcRenderer.invoke('set-window-position', position),
    });
  } catch (error) {
    console.error(error);
  }
} 

contextBridge.exposeInMainWorld('keyboard', {
  typeText: (text: string) => ipcRenderer.invoke('type-text', text),
  sendKeyPress: (keyLabel: string) => ipcRenderer.invoke('send-key-press', keyLabel),
});

contextBridge.exposeInMainWorld('controls', {
  onSelect: (callback: () => void) => {
    ipcRenderer.on('select', callback);
    return () => {
      ipcRenderer.removeListener('select', callback);
    };
  },
});
