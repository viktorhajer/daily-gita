import { Component, Input, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { SlokaModel } from '../model/sloka.model';
import { SlokaService } from '../services/sloka.service';

type TokenKind = 'text' | 'space' | 'blank';
type SelectionBranch = 'include' | 'skip';

const MIN_BLANK_DISTANCE_CHARACTERS = 8;
const BLANK_MARKER_PATTERN = /\*([^*]+)\*/gu;

interface VerseToken {
  kind: TokenKind;
  text: string;
  blankIndex?: number;
  markedWord?: string;
}

interface BlankState {
  word: string;
  displayText: string;
  status: 'pending' | 'correct' | 'incorrect';
  userAnswer: string;
}

interface EligibleWord {
  tokenIndex: number;
  word: string;
  displayText: string;
  startOffset: number;
  endOffset: number;
}

@Component({
  selector: 'app-practice',
  standalone: false,
  templateUrl: './practice.component.html',
  styleUrl: './practice.component.scss',
})
export class PracticeComponent implements OnInit {
  readonly slokaService = inject(SlokaService);
  private readonly route = inject(ActivatedRoute);

  @Input() hiddenWordCount = 3;

  verse: SlokaModel | null = null;
  verseTokens: VerseToken[] = [];
  blanks: BlankState[] = [];
  currentBlankIndex = 0;
  currentAnswer = '';
  isCompleted = false;
  showPendingAnswers = false;

  async ngOnInit(): Promise<void> {
    const routeSloka = this.resolveVerseFromRoute();
    if (routeSloka) {
      this.initVerseTokens(routeSloka);
      return;
    }
    if (this.slokaService.lastViewedSloka) {
      this.initVerseTokens(this.slokaService.lastViewedSloka);
      return;
    }
    this.startNewRound();
  }

  get activeBlank(): BlankState | null {
    return this.blanks[this.currentBlankIndex] ?? null;
  }

  get hasActiveBlank(): boolean {
    return !!this.activeBlank;
  }

  get hasPendingBlanks(): boolean {
    return this.blanks.some((blank) => blank.status === 'pending');
  }

  restartPractice(): void {
    this.stopRevealPendingBlanks();

    if (!this.verse) {
      this.startNewRound();
      return;
    }
    this.initVerseTokens(this.verse);
  }

  submitAnswer(): void {
    const activeBlank = this.activeBlank;

    if (!activeBlank || this.isCompleted) {
      return;
    }

    this.stopRevealPendingBlanks();

    const trimmedAnswer = this.normalizeWord(this.currentAnswer);
    const isCorrect = !!trimmedAnswer && trimmedAnswer === this.normalizeWord(activeBlank.word);
    activeBlank.status = isCorrect ? 'correct' : 'incorrect';
    activeBlank.userAnswer = this.currentAnswer.trim();
    this.currentAnswer = '';
    this.currentBlankIndex += 1;

    if (this.currentBlankIndex >= this.blanks.length) {
      this.isCompleted = true;
    }
  }

  canSubmit(): boolean {
    return !this.isCompleted && this.hasActiveBlank;
  }

  shouldRevealBlank(blankIndex: number | undefined): boolean {
    if (blankIndex === undefined) {
      return false;
    }

    return this.showPendingAnswers && this.blanks[blankIndex]?.status === 'pending';
  }

  startRevealPendingBlanks(): void {
    if (this.isCompleted || !this.hasPendingBlanks) {
      return;
    }

    this.showPendingAnswers = true;
  }

  stopRevealPendingBlanks(): void {
    this.showPendingAnswers = false;
  }

  blankState(blankIndex: number | undefined): BlankState | null {
    if (blankIndex === undefined) {
      return null;
    }

    return this.blanks[blankIndex] ?? null;
  }

  isBlankActive(blankIndex: number): boolean {
    return this.currentBlankIndex === blankIndex && !this.isCompleted;
  }

  getBlankWidth(word: string): number {
    return Math.max(word.length + 2, 8);
  }

  trackByIndex(index: number): number {
    return index;
  }

  startNewRound(): void {
    this.stopRevealPendingBlanks();

    const selectedVerse = this.slokaService.texts[Math.floor(Math.random() * this.slokaService.texts.length)];
    if (!selectedVerse) {
      this.verse = null;
      this.verseTokens = [];
      this.blanks = [];
      this.isCompleted = true;
      return;
    }
    this.initVerseTokens(selectedVerse);
  }

  private initVerseTokens(selectedVerse: SlokaModel): void {
    this.currentAnswer = '';
    this.currentBlankIndex = 0;
    this.isCompleted = false;
    this.showPendingAnswers = false;
    const tokens = this.tokenizeVerse(selectedVerse.content);
    const eligibleWords = this.collectEligibleWords(tokens);
    const selectedBlankWords = this.selectRandomBlankWords(eligibleWords, this.hiddenWordCount);
    const blankIndexByTokenIndex = new Map<number, number>();

    selectedBlankWords.forEach(({ tokenIndex }, blankIndex) => {
      blankIndexByTokenIndex.set(tokenIndex, blankIndex);
    });

    this.verse = selectedVerse;
    this.verseTokens = tokens.map((token, index) => {
      if (token.kind !== 'text' || !blankIndexByTokenIndex.has(index)) {
        return token;
      }

      return {
        kind: 'blank',
        text: token.text,
        blankIndex: blankIndexByTokenIndex.get(index),
      };
    });
    this.blanks = selectedBlankWords.map(({ word, displayText }) => ({
      word,
      displayText,
      status: 'pending',
      userAnswer: '',
    }));

    if (!this.blanks.length) {
      this.isCompleted = true;
    }
  }

  private tokenizeVerse(content: string): VerseToken[] {
    return (content.match(/(\s+|[^\s]+)/g) ?? []).flatMap((token) => {
      if (/\s+/.test(token)) {
        return [{ kind: 'space', text: token }];
      }

      return this.tokenizeWordSegment(token);
    });
  }

  private tokenizeWordSegment(token: string): VerseToken[] {
    const tokens: VerseToken[] = [];
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

  private collectEligibleWords(tokens: VerseToken[]): EligibleWord[] {
    let currentOffset = 0;

    return tokens.flatMap((token, tokenIndex) => {
      const startOffset = currentOffset;
      const endOffset = startOffset + token.text.length;
      currentOffset = endOffset;

      if (token.kind !== 'text') {
        return [];
      }

      return token.markedWord
        ? [{ tokenIndex, word: token.markedWord, displayText: token.text, startOffset, endOffset }]
        : [];
    });
  }

  private selectRandomBlankWords(eligibleWords: EligibleWord[], requestedBlankCount: number): EligibleWord[] {
    const orderedWords = [...eligibleWords].sort((left, right) => left.startOffset - right.startOffset);
    const maxRequestedBlankCount = Math.min(requestedBlankCount, orderedWords.length);

    for (let blankCount = maxRequestedBlankCount; blankCount > 0; blankCount -= 1) {
      const selection = this.pickWordsWithMinimumDistance(orderedWords, blankCount);

      if (selection) {
        return selection.sort((left, right) => left.tokenIndex - right.tokenIndex);
      }
    }

    return [];
  }


  private pickWordsWithMinimumDistance(words: EligibleWord[], blankCount: number): EligibleWord[] | null {
    const failedStates = new Set<string>();

    const trySelect = (
      index: number,
      remaining: number,
      previousWordEndOffset: number | null,
    ): EligibleWord[] | null => {
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
        ? this.shuffle<SelectionBranch>(['include', 'skip'])
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


  private normalizeWord(word: string): string {
    return word.trim().toLocaleLowerCase('hu-HU').normalize('NFKC');
  }

  private shuffle<T>(items: T[]): T[] {
    const result = [...items];

    for (let index = result.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
    }

    return result;
  }

  private resolveVerseFromRoute(): SlokaModel | null {
    const chapterText =
      this.route.snapshot.paramMap.get('chapter') ??
      this.route.snapshot.queryParamMap.get('chapter');
    const indexText =
      this.route.snapshot.paramMap.get('index') ??
      this.route.snapshot.queryParamMap.get('index');

    if (!chapterText || !indexText) {
      return null;
    }

    const chapter = Number.parseInt(chapterText.trim(), 10);
    const index = indexText.trim().toLocaleLowerCase('hu-HU');

    if (Number.isNaN(chapter) || !index) {
      return null;
    }

    return (
      this.slokaService.texts.find(
        (sloka) =>
          sloka.chapter === chapter &&
          sloka.index.trim().toLocaleLowerCase('hu-HU') === index,
      ) ?? null
    );
  }
}
