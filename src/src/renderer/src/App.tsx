import React, { useState, useEffect } from 'react';
import StartupMenu, { UserSettings } from './components/StartupMenu';
import MainMenu from './components/MainMenu';
import SingleInputSpeller from './components/SingleInputSpeller';
import NavigationMode from './components/NavigationMode';

const App: React.FC = () => {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [mode, setMode] = useState<'startup' | 'mainMenu' | 'writing' | 'navigation' | 'settings'>('startup');

  useEffect(() => {
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
      setMode('mainMenu');
    }
  }, []);

  const handleStartupComplete = (userSettings: UserSettings) => {
    setSettings(userSettings);
    localStorage.setItem('userSettings', JSON.stringify(userSettings));
    applySettings(userSettings);
    setMode('mainMenu');

    if (window.api && window.api.sendSettings) {
      window.api.sendSettings(userSettings);
    }
  };

  const applySettings = (userSettings: UserSettings) => {
    if (window.windowControls && window.windowControls.setWindowSize) {
      let width = 800;
      let height = 600;
      switch (userSettings.uiSize) {
        case 'small':
          width = 600;
          height = 400;
          break;
        case 'medium':
          width = 800;
          height = 600;
          break;
        case 'large':
          width = 1000;
          height = 800;
          break;
        default:
          break;
      }
      window.windowControls.setWindowSize(width, height);
    }

    if (window.windowControls && window.windowControls.setWindowPosition) {
      window.windowControls.setWindowPosition(userSettings.windowPosition);
    }

    if (window.windowControls && window.windowControls.setTransparency) {
      window.windowControls.setTransparency(userSettings.transparency);
    }

    const root = document.getElementById('root');
    if (root) {
      if (userSettings.colorPalette === 'colorblind') {
        root.classList.add('colorblind');
      } else {
        root.classList.remove('colorblind');
      }
    }
  };

  useEffect(() => {
    if (settings) {
      applySettings(settings);
    }
  }, [settings]);
  
  useEffect(() => {
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings);
      setSettings(parsedSettings);
      setMode('mainMenu');
      if (window.api && window.api.sendSettings) {
        window.api.sendSettings(parsedSettings);
      }
    }
  }, []);

  const handleSelectMode = (selectedMode: 'writing' | 'navigation' | 'settings' | 'exit') => {
    if (selectedMode === 'settings') {
      setMode('settings');
    } else if (selectedMode === 'exit') {
      window.close();
    } else {
      setMode(selectedMode);
    }
  };

  const handleExit = () => {
    setMode('mainMenu');
  };

  if (mode === 'startup' || mode === 'settings') {
    return <StartupMenu settings={settings} onComplete={handleStartupComplete} />;
  } else if (mode === 'mainMenu') {
    return <MainMenu settings={settings!} onSelectMode={handleSelectMode} />;
  } else if (mode === 'writing') {
    return <SingleInputSpeller settings={settings!} onExit={handleExit} />;
  } else if (mode === 'navigation') {
    return <NavigationMode settings={settings!} onExit={handleExit} />;
  }

  return null;
};

export default App;
