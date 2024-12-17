import { ElectronAPI } from '@electron-toolkit/preload'
import { Suggestion } from '../common/types';

export {};

declare global {
  interface Window {
    textPredictor: {
      getPredictions: (context: string) => Promise<Suggestion[]>;
      updateModel: (sentence: string) => Promise<void>;
      onModelLoadStatus: (callback: (status: { success: boolean; error?: string }) => void) => void;
      getWordCompletions: (currentWord: string) => Promise<Suggestion[]>;
    };
    keyboard: {
      typeText: (text: string) => Promise<void>;
      sendKeyPress: (keyLabel: string) => Promise<void>;
    };
    controls: {
      onSelect: (callback: () => void) => () => void;
    };
    windowControls: {
      setTransparency: (transparency: boolean) => Promise<void>;
      setWindowSize: (width: number, height: number) => Promise<void>;
      setWindowPosition: (position: string) => Promise<void>;
    };
    electron: ElectronAPI
    api: {
      sendSettings?: (settings: UserSettings) => void;
    }
  }
}
