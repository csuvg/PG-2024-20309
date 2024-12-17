import React, { useState, useEffect, useRef } from 'react';
import './SingleInputSpeller.css';
import { UserSettings } from './StartupMenu';
import { Suggestion } from '../../../common/types'

interface KeyboardLayout {
  layout: string[][];
}

interface SingleInputSpellerProps {
  settings: UserSettings;
  onExit: () => void;
}

const SingleInputSpeller: React.FC<SingleInputSpellerProps> = ({ settings, onExit }) => {
  const selectRef = useRef<() => void>(() => {});

  const [typedText, setTypedText] = useState('');
  const [wordSuggestions, setWordSuggestions] = useState<Suggestion[]>([]);
  const [isNewWord, setIsNewWord] = useState(true);
  const [shouldCapitalizeNextLetter, setShouldCapitalizeNextLetter] = useState(false);
  const [isCapsLock, setIsCapsLock] = useState(false);

  // Stage and selection 
  const [stage, setStage] = useState<'main' | 'recommendation' | 'keyboardRow' | 'keyboardKey'>('main');
  const [selectedMainIndex, setSelectedMainIndex] = useState(0);
  const [selectedRecommendationIndex, setSelectedRecommendationIndex] = useState(0);
  const [selectedRowIndex, setSelectedRowIndex] = useState(0);
  const [selectedKeyIndex, setSelectedKeyIndex] = useState(0);

  // Timers
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timerStarted, setTimerStarted] = useState(false);
  const [timerInterval] = useState(settings.speed);

  // Keyboard type
  const [keyboardType, setKeyboardType] = useState<'normal' | 'emoji' | 'symbol' | 'numeric'>('normal');
  const [isSpanish, setIsSpanish] = useState(settings.language === 'spanish');

  // Letters
  const [letters, setLetters] = useState<string[]>([]);
  const [first_letters, setFirstLetters] = useState<string[]>([]);

  // Initialize letters and first_letters based on settings
  useEffect(() => {
    setIsSpanish(settings.language === 'spanish');
    if (settings.language === 'custom') {
      const customLetters = settings.customAlphabet ? settings.customAlphabet.split('') : [];
      const customFirstLetters = settings.customFirstLetters ? settings.customFirstLetters.split('') : [];
      setLetters(customLetters);
      setFirstLetters(customFirstLetters);
    } else if (settings.language === 'spanish') {
      setLetters([
        'e', 'a', 'o', 's', 'r', 'n', 'i', 'd', 'l', 't', 'c', 'u',
        'm', 'p', 'b', 'h', 'g', 'y', 'v', 'q', 'ó', 'í', 'f', 'x',
        'á', 'j', 'z', 'é', 'ñ', 'ú', 'w', 'k'
      ]);
      setFirstLetters([
        'e', 'a', 'o', 's', 'r', 'n', 'i', 'd', 'l', 't', 'c', 'u',
        'm', 'p', 'b', 'h', 'g', 'y', 'v', 'q', 'ó', 'í', 'f', 'x',
        'á', 'j', 'z', 'é', 'ñ', 'ú', 'w', 'k'
      ]);
    } else {
      setLetters([
        'e', 't', 'a', 'o', 'i', 'n', 's', 'h', 'r', 'd',
        'l', 'c', 'u', 'm', 'w', 'f', 'g', 'y', 'p', 'b',
        'v', 'k', 'j', 'x', 'q', 'z'
      ]);
      setFirstLetters([
        't', 'a', 'o', 'i', 's', 'w', 'c', 'b', 'p', 'h',
        'f', 'm', 'd', 'r', 'e', 'l', 'n', 'g', 'u', 'k',
        'v', 'y', 'j', 'q', 'z', 'x'
      ]);
    }
  }, [settings]);

  const hasFirstLetters = first_letters.length > 0;

  const mainPunctuationSymbols = ['.', ',', '!', '?', '"'];
  const punctuationSymbols = ['.', ',', '!', '?', '\'', '"', ':', ';', ')', ']', '}'];
  const noSpacePunctuationSymbols = ['(', '{', '['];

  const isPunctuation = (char: string): boolean => {
    return punctuationSymbols.includes(char) || noSpacePunctuationSymbols.includes(char);
  };

  const shouldAddSpaceAfter = (char: string): boolean => {
    return punctuationSymbols.includes(char);
  };

  const isAtSentenceStart = (): boolean => {
    const trimmedText = typedText.trimEnd();
    if (trimmedText.length === 0) {
      return true;
    }
    const lastChar = trimmedText.charAt(trimmedText.length - 1);
    if (['.', '!', '?'].includes(lastChar)) {
      return true;
    }
    return false;
  };

  const isAtWordStart = (): boolean => {
    const trimmedText = typedText.trimEnd();
    if (trimmedText.length === 0) {
      return true;
    }
    const lastChar = trimmedText.charAt(trimmedText.length - 1);
    return lastChar === ' ';
  };

  const generateKeyboardLayout = (
    lettersArray: string[],
    includeSpecialKeys: boolean = true,
    fixedRows?: number,
    fixedCols?: number
  ): string[][] => {
    let specialKeys = includeSpecialKeys ? ['⇦', '␣', '😊', 'Sym', '123', '⇧', '⏎', 'Exit'] : [];

    let combinedArray = [...lettersArray];
    combinedArray.push(...specialKeys);

    const totalKeys = combinedArray.length;
    let R = 0;
    let C = 0;

    const findOptimalDimensions = () => {
      let minEmptySpaces = Infinity;
      let optimalR = 0;
      let optimalC = 0;

      const maxDimension = Math.ceil(Math.sqrt(totalKeys));
      for (let rows = 1; rows <= maxDimension + 1; rows++) {
        for (let cols = rows; cols <= maxDimension + 1; cols++) {
          if (rows * cols >= totalKeys) {
            let emptySpaces = rows * cols - totalKeys;
            let difference = Math.abs(rows - cols);

            if (
              emptySpaces < minEmptySpaces ||
              (emptySpaces === minEmptySpaces && difference < Math.abs(optimalR - optimalC))
            ) {
              minEmptySpaces = emptySpaces;
              optimalR = rows;
              optimalC = cols;
            }
          }
        }
      }
      return { optimalR, optimalC };
    };

    if (fixedRows && fixedCols) {
      R = fixedRows;
      C = fixedCols;
    } else {
      const { optimalR, optimalC } = findOptimalDimensions();
      R = optimalR;
      C = optimalC;
    }

    const keysLayout: string[][] = Array.from({ length: R }, () => Array(C).fill(''));

    const positions: { row: number; col: number; distance: number }[] = [];
    for (let r = 0; r < R; r++) {
      for (let c = 0; c < C; c++) {
        const distance = r + c;
        positions.push({ row: r, col: c, distance });
      }
    }

    positions.sort((a, b) => a.distance - b.distance || a.col - b.col);

    for (let i = 0; i < combinedArray.length; i++) {
      const pos = positions[i];
      keysLayout[pos.row][pos.col] = combinedArray[i];
    }

    return keysLayout;
  };

  const emojis = [
    '😂', '❤️', '😍', '😊', '🙏', '😭', '👍', '😅', '👏', '😁',
    '🔥', '💔', '😢', '🤔', '😆', '🙄', '💪', '😉', '👌', '🤗',
    '😔', '😎', '😇', '🤦', '🎉', '✨', '🤷', '😱', '😌', '🌸',
    '🙌', '😏', '💯', '🙈', '👀'
  ];

  const numbers = ['1', '4', '2', '7', '5', '3', '8', '6', '0', '9', '+', '-', '*', '/'];

  const symbol_table = [
    ':', ';', '&', '@', '#', '$', '%', '=', '[', ']', '{', '}', '(', ')', '<', '>', '^',
    '\'', '\\', '/', '|', '_', '~', '`'
  ];

  const emojiKeyboardLayout: KeyboardLayout = {
    layout: generateKeyboardLayout([...emojis, '←'], false, 6, 6),
  };

  const symbolKeyboardLayout: KeyboardLayout = {
    layout: generateKeyboardLayout([...symbol_table, '←'], false),
  };

  const numericKeyboardLayout: KeyboardLayout = {
    layout: generateKeyboardLayout([...numbers, '←'], false),
  };

  let currentKeysLayout: KeyboardLayout;
  if (keyboardType === 'emoji') {
    currentKeysLayout = emojiKeyboardLayout;
  } else if (keyboardType === 'symbol') {
    currentKeysLayout = symbolKeyboardLayout;
  } else if (keyboardType === 'numeric') {
    currentKeysLayout = numericKeyboardLayout;
  } else {
    const lettersArray = isNewWord && hasFirstLetters ? first_letters : letters;
    currentKeysLayout = {
      layout: generateKeyboardLayout([...lettersArray, ...mainPunctuationSymbols]),
    };
  }

  const cycle = () => {
    if (stage === 'main') {
      if (wordSuggestions.length > 0) {
        const optionsCount = 2;
        setSelectedMainIndex((prevIndex) => (prevIndex + 1) % optionsCount);
      } else {
        setStage('keyboardRow');
        setSelectedRowIndex(0);
      }
    } else if (stage === 'recommendation') {
      if (wordSuggestions.length > 0) {
        setSelectedRecommendationIndex((prevIndex) => (prevIndex + 1) % wordSuggestions.length);
      }
    } else if (stage === 'keyboardRow') {
      setSelectedRowIndex((prevIndex) => (prevIndex + 1) % currentKeysLayout.layout.length);
    } else if (stage === 'keyboardKey') {
      const keysInRow = currentKeysLayout.layout[selectedRowIndex];
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
      if (wordSuggestions.length > 0) {
        if (selectedMainIndex === 0) {
          setStage('recommendation');
          setSelectedRecommendationIndex(0);
        } else {
          setStage('keyboardRow');
          setSelectedRowIndex(0);
        }
      } else {
        setStage('keyboardRow');
        setSelectedRowIndex(0);
      }
    } else if (stage === 'recommendation') {
      const suggestion = wordSuggestions[selectedRecommendationIndex];
      await handleSuggestionClick(suggestion);
      setStage('main');
      setSelectedMainIndex(0);
      setTimerEnabled(false);
      setTimerStarted(false);
    } else if (stage === 'keyboardRow') {
      setStage('keyboardKey');
      setSelectedKeyIndex(0);
    } else if (stage === 'keyboardKey') {
      const key = currentKeysLayout.layout[selectedRowIndex][selectedKeyIndex];
      if (key === '⇦') {
        setTypedText((prevText) => {
          const newText = prevText.slice(0, -1);
          setIsNewWord(newText.endsWith(' ') || newText.length === 0);
          return newText;
        });
        await typeTextExternally('\b');
      } else if (key === '␣') {
        setTypedText((prevText) => prevText + ' ');
        await typeTextExternally(' ');
        setIsNewWord(true);
        await window.textPredictor.updateModel(typedText.trim());
      } else if (key === '😊') {
        setKeyboardType('emoji');
        setStage('keyboardRow');
        setSelectedRowIndex(0);
        setSelectedKeyIndex(0);
      } else if (key === 'Sym') {
        setKeyboardType('symbol');
        setStage('keyboardRow');
        setSelectedRowIndex(0);
        setSelectedKeyIndex(0);
      } else if (key === '123') {
        setKeyboardType('numeric');
        setStage('keyboardRow');
        setSelectedRowIndex(0);
        setSelectedKeyIndex(0);
      } else if (key === '←') {
        setKeyboardType('normal');
        setStage('keyboardRow');
        setSelectedRowIndex(0);
        setSelectedKeyIndex(0);
      } else if (key === '⇧') {
        setShouldCapitalizeNextLetter(!shouldCapitalizeNextLetter);
        setIsCapsLock(!isCapsLock);
        setStage('keyboardRow');
        setSelectedRowIndex(0);
        setSelectedKeyIndex(0);
      } else if (key === '⏎') {
        setTypedText((prevText) => prevText + '\n');
        await typeTextExternally('\n');
        setIsNewWord(true);
      } else if (key === 'Exit') {
        onExit();
      } else if (key !== '') {
        let character = key;

        const shouldCapitalize =
          isAtSentenceStart() ||
          isAtWordStart() ||
          shouldCapitalizeNextLetter ||
          isCapsLock;

        if (shouldCapitalize && /^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ]$/.test(character)) {
          character = isSpanish
            ? character.toLocaleUpperCase('es')
            : character.toUpperCase();
          if (!isCapsLock) {
            setShouldCapitalizeNextLetter(false);
          }
        } else {
          character = isSpanish
            ? character.toLocaleLowerCase('es')
            : character.toLowerCase();
        }

        if (isSpanish && isAtSentenceStart() && (character === '?' || character === '!')) {
          character = character === '?' ? '¿' : '¡';
          setShouldCapitalizeNextLetter(true);
        }

        if (isPunctuation(character)) {
          let spaceBefore = typedText.endsWith(' ');
          setTypedText((prevText) => prevText.trimEnd() + character);

          if (spaceBefore) {
            await typeTextExternally('\b' + character);
          } else {
            await typeTextExternally(character);
          }

          if (shouldAddSpaceAfter(character)) {
            setTypedText((prevText) => prevText + ' ');
            await typeTextExternally(' ');
            setIsNewWord(true);
          } else {
            setIsNewWord(false);
          }
        } else if (keyboardType === 'emoji') {
          setTypedText((prevText) => prevText + character + ' ');
          await typeTextExternally(character + ' ');
          setIsNewWord(true);
          setKeyboardType('normal');
        } else {
          setTypedText((prevText) => prevText + character);
          await typeTextExternally(character);
          setIsNewWord(false);
        }
      }
      setStage('main');
      setSelectedMainIndex(0);
      setSelectedRowIndex(0);
      setSelectedKeyIndex(0);
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

  const typeTextExternally = async (text: string) => {
    try {
      await window.keyboard.typeText(text);
    } catch (error) {
      console.error('Error typing text:', error);
    }
  };

  const handleSuggestionClick = async (suggestion: Suggestion) => {
    const tokens = typedText.trim().split(/\s+/);
    const currentWord = tokens[tokens.length - 1];

    let suggestionWord = suggestion.word;

    const shouldCapitalize =
      isAtSentenceStart() ||
      isAtWordStart() ||
      shouldCapitalizeNextLetter ||
      isCapsLock;

    if (shouldCapitalize && /^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ]/.test(suggestionWord)) {
      suggestionWord = isSpanish
        ? suggestionWord.charAt(0).toLocaleUpperCase('es') + suggestionWord.slice(1)
        : suggestionWord.charAt(0).toUpperCase() + suggestionWord.slice(1);
      if (!isCapsLock) {
        setShouldCapitalizeNextLetter(false);
      }
    } else {
      suggestionWord = isSpanish
        ? suggestionWord.toLocaleLowerCase('es')
        : suggestionWord.toLowerCase();
    }

    if (isNewWord) {
      if (isPunctuation(suggestionWord)) {
        setTypedText((prevText) => prevText.trimEnd() + suggestionWord);
        await typeTextExternally('\b' + suggestionWord);

        if (shouldAddSpaceAfter(suggestionWord)) {
          setTypedText((prevText) => prevText + ' ');
          await typeTextExternally(' ');
          setIsNewWord(true);
        } else {
          setIsNewWord(false);
        }
      } else {
        const space = typedText.endsWith(' ') || typedText.length === 0 ? '' : ' ';
        setTypedText((prevText) => prevText + space + suggestionWord + ' ');
        await typeTextExternally(space + suggestionWord + ' ');
        setIsNewWord(true);
        await window.textPredictor.updateModel(typedText.trim());
      }
    } else {
      if (isPunctuation(suggestionWord)) {
        setTypedText((prevText) => prevText.trimEnd() + suggestionWord);
        await typeTextExternally(suggestionWord);

        if (shouldAddSpaceAfter(suggestionWord)) {
          setTypedText((prevText) => prevText + ' ');
          await typeTextExternally(' ');
          setIsNewWord(true);
        } else {
          setIsNewWord(false);
        }
      } else {
        const missingChars = getMissingCharacters(currentWord, suggestionWord);
        setTypedText((prevText) => prevText + missingChars + ' ');
        await typeTextExternally(missingChars + ' ');
        setIsNewWord(true);
        await window.textPredictor.updateModel(typedText.trim());
      }
    }

    setStage('main');
    setSelectedMainIndex(0);
    setTimerEnabled(false);
    setTimerStarted(false);
  };

  const getMissingCharacters = (currentWord: string, suggestedWord: string): string => {
    let index = 0;
    const maxLength = Math.min(currentWord.length, suggestedWord.length);

    while (index < maxLength && currentWord[index].toLocaleLowerCase('es') === suggestedWord[index].toLocaleLowerCase('es')) {
      index++;
    }

    return suggestedWord.slice(index);
  };

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (window.textPredictor) {
        if (isNewWord) {
          const context = typedText.trim() + ' ';
          const suggestions = await window.textPredictor.getPredictions(context);
          setWordSuggestions(suggestions);
        } else {
          const tokens = typedText.trim().split(/\s+/);
          const currentWord = tokens[tokens.length - 1];
          const suggestions = await window.textPredictor.getWordCompletions(currentWord);
          setWordSuggestions(suggestions);
        }
      } else {
        setWordSuggestions([]);
      }
    };

    fetchSuggestions();
  }, [typedText, isNewWord]);

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

  const getDisplayText = () => {
    const sentences = typedText.split(/(?<=[.!?])\s+/);
    return sentences.slice(-2).join(' ');
  };

  return (
    <div className="single-input-speller">
      <div className="typed-text">
        {getDisplayText()}
        <span className="cursor">|</span>
      </div>

      {wordSuggestions.length > 0 && (
        <div
          className={`recommendations ${
            ((stage === 'main' && selectedMainIndex === 0) || stage === 'recommendation') ? 'focused' : ''
          }`}
        >
          {wordSuggestions.map((suggestion, index) => (
            <div
              key={index}
              className={`suggestion ${
                stage === 'recommendation' && index === selectedRecommendationIndex ? 'selected' : ''
              }`}
            >
              {suggestion.word}
            </div>
          ))}
        </div>
      )}

      <div
        className={`keyboard ${
          (stage === 'main' && selectedMainIndex === 1) ||
          stage === 'keyboardRow' ||
          stage === 'keyboardKey'
            ? 'focused'
            : ''
        }`}
      >
        {currentKeysLayout.layout.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className={`keyboard-row ${
              (stage === 'keyboardRow' && rowIndex === selectedRowIndex) ||
              (stage === 'keyboardKey' && rowIndex === selectedRowIndex)
                ? 'selected'
                : ''
            }`}
          >
            {row.map((key, keyIndex) => {
              let displayKey = key;
              if (/^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ]$/.test(key)) {
                if (
                  isAtSentenceStart() ||
                  isAtWordStart() ||
                  shouldCapitalizeNextLetter ||
                  isCapsLock
                ) {
                  displayKey = isSpanish
                    ? key.toLocaleUpperCase('es')
                    : key.toUpperCase();
                } else {
                  displayKey = isSpanish
                    ? key.toLocaleLowerCase('es')
                    : key.toLowerCase();
                }
              }
              return (
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
                  {displayKey}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="select-button">
        <button onClick={handleSelectButtonClick}>Select</button>
      </div>
    </div>
  );
};

export default SingleInputSpeller;
