import React, { useState, useEffect, useRef } from 'react';
import './StartupMenu.css';
import translations from '../assets/translations';

interface StartupMenuProps {
  settings: UserSettings | null;
  onComplete: (settings: UserSettings) => void;
}

export interface UserSettings {
  speed: number;
  speedValue: string;
  language: string;
  languageValue: string;
  customAlphabet?: string;
  customFirstLetters?: string;
  uiSize: string;
  uiSizeValue: string;
  inputMode: string;
  inputModeValue: string;
  inputKey?: string;
  transparency: boolean;
  transparencyValue: string;
  colorPalette: string;
  colorPaletteValue: string;
  windowPosition: string;
  windowPositionValue: string;
}

const StartupMenu: React.FC<StartupMenuProps> = ({ settings, onComplete }) => {
  const selectRef = useRef<() => void>(() => {});
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timerStarted, setTimerStarted] = useState(false);
  const [timerInterval] = useState(500);
  const [stage, setStage] = useState<'setting' | 'option' | 'inputKeyCapture'>('setting');
  const [selectedSettingIndex, setSelectedSettingIndex] = useState(0);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(0);

  const defaultSettings: UserSettings = {
    speed: 500,
    speedValue: '🚶Normal',
    language: 'english',
    languageValue: '🇬🇧 English',
    uiSize: 'medium',
    uiSizeValue: '🔸Medium',
    inputMode: 'keyboard',
    inputModeValue: '⌨️ Keyboard',
    transparency: false,
    transparencyValue: '🚫 Off',
    colorPalette: 'default',
    colorPaletteValue: '🌈 Default',
    windowPosition: '☐',
    windowPositionValue: '☐',
  };

  const [currentSettings, setCurrentSettings] = useState<UserSettings>(settings || defaultSettings);

  const settingsOptions = [
    {
      name: 'Cycle Speed',
      values: ['🐢Slow', '🚶Normal', '🐇Fast'],
      key: 'speed',
    },
    {
      name: 'Language',
      values: ['🇬🇧 English', '🇪🇸 Español'],
      key: 'language',
    },
    {
      name: 'UI Size',
      values: ['🔹Small', '🔸Medium', '🔶Large'],
      key: 'uiSize',
    },
    {
      name: 'Input Mode',
      values: ['⌨️ Keyboard', '🖱️ Mouse', 'Custom'],
      key: 'inputMode',
    },
    {
      name: 'Transparency',
      values: ['🚫 Off', '✅ On'],
      key: 'transparency',
    },
    {
      name: 'Color Palette',
      values: ['🌈 Default', '👓 Colorblind'],
      key: 'colorPalette',
    },
    {
      name: 'Window Position',
      values: ['◰', '◳', '◱', '◲', '☐'],
      key: 'windowPosition',
    },
    {
      name: 'Continue',
      values: [],
      key: 'continue',
    },
  ];

  const t = (key: string): string => {
    const lang = currentSettings.language || 'english';
    return translations[lang][key] || key;
  };

  const cycle = () => {
    if (stage === 'setting') {
      setSelectedSettingIndex((prevIndex) => (prevIndex + 1) % settingsOptions.length);
    } else if (stage === 'option') {
      const setting = settingsOptions[selectedSettingIndex];
      setSelectedOptionIndex((prevIndex) => (prevIndex + 1) % setting.values.length);
    }
  };

  selectRef.current = () => {
    if (!timerStarted) {
      setTimerStarted(true);
      setTimerEnabled(true);
      return;
    }

    if (stage === 'setting') {
      const setting = settingsOptions[selectedSettingIndex];
      if (setting.values.length > 0) {
        setStage('option');
        setSelectedOptionIndex(0);
      } else {
        onComplete({ ...currentSettings });
        if (window.api && window.api.sendSettings) {
          window.api.sendSettings(currentSettings);
        }
      }
    } else if (stage === 'option') {
      const setting = settingsOptions[selectedSettingIndex];
      const selectedValue = setting.values[selectedOptionIndex];

      const newSettings = { ...currentSettings };
      if (setting.key === 'speed') {
        newSettings.speed = { '🐢Slow': 800, '🚶Normal': 500, '🐇Fast': 250 }[selectedValue] || 500;
        newSettings.speedValue = selectedValue;
      } else if (setting.key === 'transparency') {
        newSettings.transparency = selectedValue === '✅ On';
        newSettings.transparencyValue = selectedValue;
      } else if (setting.key === 'language') {
        newSettings.language = selectedValue === '🇪🇸 Español' ? 'spanish' : 'english';
        newSettings.languageValue = selectedValue;
      } else if (setting.key === 'uiSize') {
        const sizeMap = { '🔹Small': 'small', '🔸Medium': 'medium', '🔶Large': 'large' };
        newSettings.uiSize = sizeMap[selectedValue];
        newSettings.uiSizeValue = selectedValue;
      } else if (setting.key === 'inputMode') {
        if (selectedValue === 'Custom') {
          setStage('inputKeyCapture');
          return;
        } else {
          const inputModeMap = { '⌨️ Keyboard': 'keyboard', '🖱️ Mouse': 'mouse', 'Custom': 'custom' };
          newSettings.inputMode = inputModeMap[selectedValue];
          newSettings.inputModeValue = selectedValue;
        }
      } else if (setting.key === 'colorPalette') {
        const colorPaletteMap = { '🌈 Default': 'default', '👓 Colorblind': 'colorblind' };
        newSettings.colorPalette = colorPaletteMap[selectedValue];
        newSettings.colorPaletteValue = selectedValue;
      } else if (setting.key === 'windowPosition') {
        newSettings.windowPosition = selectedValue;
        newSettings.windowPositionValue = selectedValue;
      } else {
        newSettings[setting.key] = selectedValue;
      }
      setCurrentSettings(newSettings);
      setStage('setting');
    }
  };

  useEffect(() => {
    if (stage === 'inputKeyCapture') {
      const handleKeyDown = (event: KeyboardEvent) => {
        const key = event.key;
        currentSettings.inputKey = key;
        currentSettings.inputMode = 'custom';
        currentSettings.inputModeValue = 'Custom';
        setCurrentSettings({ ...currentSettings });
        setStage('setting');
      };

      window.addEventListener('keydown', handleKeyDown);

      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
    return;
  }, [stage]);

  useEffect(() => {
    if (timerEnabled) {
      const interval = setInterval(() => {
        cycle();
      }, timerInterval);
      return () => clearInterval(interval);
    }
    return;
  }, [timerEnabled, stage]);

  const handleSelectButtonClick = () => {
    selectRef.current();
  };

  useEffect(() => {
    if (window.controls && window.controls.onSelect) {
      const unsubscribe = window.controls.onSelect(() => {
        selectRef.current();
      });
      return () => {
        unsubscribe();
      };
    }
    return;
  }, []);

  return (
    <div className={`startup-menu ${currentSettings.colorPalette === 'colorblind' ? 'colorblind' : ''}`}>
      <h1>{t('Settings')}</h1>
      {stage === 'inputKeyCapture' ? (
        <div className="input-capture-message">{t('Press any key to select as input')}</div>
      ) : (
        <>
          <div className="settings-grid">
            {settingsOptions.map((setting, index) => (
              <div
                key={index}
                className={`setting-row ${
                  index === selectedSettingIndex && stage === 'setting' ? 'selected' : ''
                } ${setting.key === 'continue' ? 'continue-row' : ''}`}
              >
                <div className="setting-name">{t(setting.name)}{setting.values.length > 0 ? ':' : ''}</div>
                {setting.values.length > 0 ? (
                  <div className="setting-values">
                    {setting.values.map((value, idx) => (
                      <div
                        key={idx}
                        className={`setting-value ${
                          index === selectedSettingIndex && stage === 'option' && idx === selectedOptionIndex
                            ? 'selected'
                            : ''
                        } ${
                          ((setting.key === 'speed' && currentSettings.speedValue === value) ||
                          (setting.key === 'transparency' && currentSettings.transparencyValue === value) ||
                          (setting.key === 'language' && currentSettings.languageValue === value) ||
                          (setting.key === 'uiSize' && currentSettings.uiSizeValue === value) ||
                          (setting.key === 'inputMode' && currentSettings.inputModeValue === value) ||
                          (setting.key === 'colorPalette' && currentSettings.colorPaletteValue === value) ||
                          (setting.key === 'windowPosition' && currentSettings.windowPositionValue === value))
                            ? 'current'
                            : ''
                        }`}
                      >
                        {t(value)}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
          <div className="select-button">
            <button onClick={handleSelectButtonClick}>{t('Select')}</button>
          </div>
        </>
      )}
    </div>
  );
};

export default StartupMenu;
