import React, { useState, useEffect, useRef } from 'react';
import './MainMenu.css';
import { UserSettings } from './StartupMenu';

interface MainMenuProps {
  settings: UserSettings;
  onSelectMode: (mode: 'writing' | 'navigation' | 'settings' | 'exit') => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ settings, onSelectMode }) => {
  const selectRef = useRef<() => void>(() => {});
  const [options] = useState(['Writing Mode', 'Navigation Mode', 'Settings', 'Exit']);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timerStarted, setTimerStarted] = useState(false);
  const [timerInterval] = useState(settings.speed);

  const cycle = () => {
    setSelectedIndex((prevIndex) => (prevIndex + 1) % options.length);
  };

  selectRef.current = () => {
    if (!timerStarted) {
      setTimerStarted(true);
      setTimerEnabled(true);
      return;
    }
    const selectedOption = options[selectedIndex];
    if (selectedOption === 'Writing Mode') {
      onSelectMode('writing');
    } else if (selectedOption === 'Navigation Mode') {
      onSelectMode('navigation');
    } else if (selectedOption === 'Settings') {
      onSelectMode('settings');
    } else if (selectedOption === 'Exit') {
      onSelectMode('exit');
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
  }, [timerEnabled]);

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
    <div className="main-menu">
      <div className="options">
        {options.map((option, index) => (
          <div
            key={index}
            className={`option ${index === selectedIndex ? 'selected' : ''}`}
          >
            {option}
          </div>
        ))}
      </div>
      <div className="select-button">
        <button onClick={handleSelectButtonClick}>Select</button>
      </div>
    </div>
  );
};

export default MainMenu;
