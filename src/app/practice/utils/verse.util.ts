import { normalizeWordCompletionWord } from './word-normalize.util';

export type PracticeTokenKind = 'text' | 'space' | 'blank';
export type SelectionBranch = 'include' | 'skip';

export const MIN_BLANK_DISTANCE_CHARACTERS = 5;
const BLANK_MARKER_PATTERN = /\*([^*]+)\*/gu;

export interface PracticeVerseToken {
  kind: PracticeTokenKind;
  text: string;
  blankIndex?: number;
  markedWord?: string;
}

export interface PracticeEligibleWord {
  tokenIndex: number;
  optionIndex: number;
  word: string;
  displayText: string;
  startOffset: number;
  endOffset: number;
}

export function tokenizePracticeVerse(content: string): PracticeVerseToken[] {
  return (content.match(/(\s+|[^\s]+)/g) ?? []).flatMap((token) => {
    if (/\s+/.test(token)) {
      return [{ kind: 'space', text: token }];
    }

    return tokenizePracticeWordSegment(token);
  });
}

export function collectPracticeEligibleWords(tokens: PracticeVerseToken[]): PracticeEligibleWord[] {
  let currentOffset = 0;
  let currentOptionIndex = 0;

  return tokens.flatMap((token, tokenIndex) => {
    const startOffset = currentOffset;
    const endOffset = startOffset + token.text.length;
    currentOffset = endOffset;

    if (token.kind !== 'text') {
      return [];
    }

    if (!token.markedWord) {
      return [];
    }

    const eligibleWord: PracticeEligibleWord = {
      tokenIndex,
      optionIndex: currentOptionIndex,
      word: token.markedWord,
      displayText: token.text,
      startOffset,
      endOffset,
    };

    currentOptionIndex += 1;
    return [eligibleWord];
  });
}

export function selectPracticeBlankWords(
  eligibleWords: PracticeEligibleWord[],
  requestedBlankCount: number,
): PracticeEligibleWord[] {
  const orderedWords = [...eligibleWords].sort((left, right) => left.startOffset - right.startOffset);
  const maxRequestedBlankCount = Math.min(requestedBlankCount, orderedWords.length);

  for (let blankCount = maxRequestedBlankCount; blankCount > 0; blankCount -= 1) {
    const selection = pickPracticeWordsWithMinimumDistance(orderedWords, blankCount);

    if (selection) {
      return selection.sort((left, right) => left.tokenIndex - right.tokenIndex);
    }
  }

  return [];
}

export function shufflePracticeItems<T>(items: T[]): T[] {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }

  return result;
}

export function buildMultipleChoiceOptions(
  correctWord: string,
  primaryOptions: string[] | undefined,
  desiredChoiceCount = 3,
): string[] {
  const normalizedCorrectWord = normalizeWordCompletionWord(correctWord);
  const candidateWords: string[] = [];

  console.log('primaryOptions', primaryOptions);

  const addCandidateWords = (words: string[] | undefined): void => {
    words?.forEach((word) => {
      const trimmedWord = word.trim();
      if (!trimmedWord) {
        return;
      }

      if (normalizeWordCompletionWord(trimmedWord) === normalizedCorrectWord) {
        return;
      }

      const normalizedCandidate = normalizeWordCompletionWord(trimmedWord);
      if (candidateWords.some((existingWord) => normalizeWordCompletionWord(existingWord) === normalizedCandidate)) {
        return;
      }

      candidateWords.push(trimmedWord);
    });
  };

  addCandidateWords(primaryOptions);

  const answers = shufflePracticeItems(candidateWords).slice(0, Math.max(desiredChoiceCount - 1, 0));
  return shufflePracticeItems([correctWord.trim(), ...answers].filter((value) => !!value));
}

function tokenizePracticeWordSegment(token: string): PracticeVerseToken[] {
  const tokens: PracticeVerseToken[] = [];
  let lastIndex = 0;

  for (const match of token.matchAll(BLANK_MARKER_PATTERN)) {
    const matchIndex = match.index ?? 0;
    const prefix = token.slice(lastIndex, matchIndex).replace(/\*/g, '');
    const markedWord = match[1]?.trim() ?? '';

    if (prefix) {
      tokens.push({ kind: 'text', text: prefix });
    }

    if (markedWord) {
      tokens.push({ kind: 'text', text: markedWord, markedWord });
    }

    lastIndex = matchIndex + match[0].length;
  }

  const suffix = token.slice(lastIndex).replace(/\*/g, '');
  if (suffix) {
    tokens.push({ kind: 'text', text: suffix });
  }

  if (tokens.length) {
    return tokens;
  }

  const sanitizedToken = token.replace(/\*/g, '');
  return sanitizedToken ? [{ kind: 'text', text: sanitizedToken }] : [];
}

function pickPracticeWordsWithMinimumDistance(
  words: PracticeEligibleWord[],
  blankCount: number,
): PracticeEligibleWord[] | null {
  const failedStates = new Set<string>();

  const trySelect = (
    index: number,
    remaining: number,
    previousWordEndOffset: number | null,
  ): PracticeEligibleWord[] | null => {
    if (remaining === 0) {
      return [];
    }

    if (index >= words.length) {
      return null;
    }

    const stateKey = `${index}|${remaining}|${previousWordEndOffset ?? -1}`;
    if (failedStates.has(stateKey)) {
      return null;
    }

    const currentWord = words[index];
    const canInclude =
      previousWordEndOffset === null ||
      currentWord.startOffset - previousWordEndOffset >= MIN_BLANK_DISTANCE_CHARACTERS;
    const branchOrder: SelectionBranch[] = canInclude
      ? shufflePracticeItems<SelectionBranch>(['include', 'skip'])
      : ['skip'];

    for (const branch of branchOrder) {
      if (branch === 'include' && canInclude) {
        const selectedTail = trySelect(index + 1, remaining - 1, currentWord.endOffset);

        if (selectedTail) {
          return [currentWord, ...selectedTail];
        }
      }

      if (branch === 'skip') {
        const skippedTail = trySelect(index + 1, remaining, previousWordEndOffset);

        if (skippedTail) {
          return skippedTail;
        }
      }
    }

    failedStates.add(stateKey);
    return null;
  };

  return trySelect(0, blankCount, null);
}


