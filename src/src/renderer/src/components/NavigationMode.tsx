import React, { useState, useEffect, useRef } from 'react';
import './NavigationMode.css';
import { UserSettings } from './StartupMenu';

interface NavigationModeProps {
  settings: UserSettings;
  onExit: () => void;
}

const NavigationMode: React.FC<NavigationModeProps> = ({ settings, onExit }) => {
  const selectRef = useRef<() => void>(() => {});
  const [stage, setStage] = useState<'main' | 'keyboardRow' | 'keyboardKey'>('main');
  const [selectedRowIndex, setSelectedRowIndex] = useState(0);
  const [selectedKeyIndex, setSelectedKeyIndex] = useState(0);
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timerStarted, setTimerStarted] = useState(false);
  const [timerInterval] = useState(settings.speed);
  const [currentKeysLayout, setCurrentKeysLayout] = useState<string[][]>([]);
  const [isBrowserCommands, setIsBrowserCommands] = useState(false);

  const mainKeys = [
    'Tab', 'Enter', '↑', '↓', '←', '→',
    'Page Up', 'Page Down', 'Home', 'End', 'Alt', 'Esc', 'Change Window', 'Close Window',
    'Browser Commands', 'Exit'
  ];

  const browserCommands = [
    'Search Bar', 'New Tab', 'Close Tab', 'Switch Tab', 'Re-open Tab', 'Go Back', 'Go Forward', '←'
  ];

  useEffect(() => {
    if (isBrowserCommands) {
      setCurrentKeysLayout(generateKeyboardLayout(browserCommands));
    } else {
      setCurrentKeysLayout(generateKeyboardLayout(mainKeys));
    }
    setSelectedRowIndex(0);
    setSelectedKeyIndex(0);
  }, [isBrowserCommands]);

  const generateKeyboardLayout = (keysArray: string[]): string[][] => {
    const totalKeys = keysArray.length;
    const cols = 4;
    const rows = Math.ceil(totalKeys / cols);
    const keysLayout: string[][] = Array.from({ length: rows }, () => []);

    let index = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (index < keysArray.length) {
          keysLayout[r][c] = keysArray[index];
          index++;
        } else {
          keysLayout[r][c] = '';
        }
      }
    }

    return keysLayout;
  };

  const cycle = () => {
    if (stage === 'main') {
      setStage('keyboardRow');
      setSelectedRowIndex(0);
    } else if (stage === 'keyboardRow') {
      setSelectedRowIndex((prevIndex) => (prevIndex + 1) % currentKeysLayout.length);
    } else if (stage === 'keyboardKey') {
      const keysInRow = currentKeysLayout[selectedRowIndex];
      setSelectedKeyIndex((prevIndex) => (prevIndex + 1) % keysInRow.length);
    }
  };

  selectRef.current = async () => {
    if (!timerStarted) {
      setTimerStarted(true);
      setTimerEnabled(true);
      return;
    }

    if (stage === 'main') {
      setStage('keyboardRow');
      setSelectedRowIndex(0);
    } else if (stage === 'keyboardRow') {
      setStage('keyboardKey');
      setSelectedKeyIndex(0);
    } else if (stage === 'keyboardKey') {
      const key = currentKeysLayout[selectedRowIndex][selectedKeyIndex];
      if (key === 'Exit') {
        onExit();
      } else if (key === 'Browser Commands') {
        setIsBrowserCommands(true);
        setStage('keyboardRow');
        setSelectedRowIndex(0);
        setSelectedKeyIndex(0);
      } else if (key === '←') {
        setIsBrowserCommands(false);
        setStage('keyboardRow');
        setSelectedRowIndex(0);
        setSelectedKeyIndex(0);
      } else if (key === 'Ctrl+L') {
        sendKeyPress(key);
        onExit();
      } else if (key !== '') {
        sendKeyPress(key);
      }
      setStage('main');
    }
  };

  const sendKeyPress = async (keyLabel: string) => {
    if (window.keyboard && window.keyboard.sendKeyPress) {
      await window.keyboard.sendKeyPress(keyLabel);
    }
  };

  useEffect(() => {
    if (timerEnabled) {
      const interval = setInterval(() => {
        cycle();
      }, timerInterval);
      return () => clearInterval(interval);
    }
    return;
  }, [timerEnabled, stage, currentKeysLayout]);

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
    <div className="navigation-mode">
      <div className="keyboard focused">
        {currentKeysLayout.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className={`keyboard-row ${
              (stage === 'keyboardRow' && rowIndex === selectedRowIndex) ||
              (stage === 'keyboardKey' && rowIndex === selectedRowIndex)
                ? 'selected'
                : ''
            }`}
          >
            {row.map((key, keyIndex) => (
              <div
                key={keyIndex}
                className={`keyboard-key ${
                  stage === 'keyboardKey' &&
                  rowIndex === selectedRowIndex &&
                  keyIndex === selectedKeyIndex
                    ? 'selected'
                    : ''
                }`}
              >
                {key}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="select-button">
        <button onClick={handleSelectButtonClick}>Select</button>
      </div>
    </div>
  );
};

export default NavigationMode;
