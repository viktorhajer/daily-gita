import { Component, Input, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { SlokaModel } from '../../model/sloka.model';
import { SlokaService } from '../../services/sloka.service';
import { getWordCompletionFeedbackMessage } from '../utils/feedback.util';
import { selectDifferentRandomItem } from '../utils/round.util';
import { normalizeWordCompletionWord } from '../utils/word-normalize.util';
import {
  PracticeVerseToken,
  buildMultipleChoiceOptions,
  collectPracticeEligibleWords,
  selectPracticeBlankWords,
  tokenizePracticeVerse,
} from '../utils/verse.util';

interface ChoiceBlankState {
  word: string;
  displayText: string;
  status: 'pending' | 'correct' | 'incorrect';
  userAnswer: string;
  choices: string[];
}

@Component({
  selector: 'app-multiple-choice',
  standalone: false,
  templateUrl: './multiple-choice.component.html',
  styleUrl: './multiple-choice.component.scss',
})
export class MultipleChoiceComponent implements OnInit {
  readonly slokaService = inject(SlokaService);
  private readonly route = inject(ActivatedRoute);
  private readonly maxBlankCount = 5;

  @Input() hiddenWordCount = 5;

  verse: SlokaModel | null = null;
  verseTokens: PracticeVerseToken[] = [];
  blanks: ChoiceBlankState[] = [];
  currentBlankIndex = 0;
  isCompleted = false;
  showPendingAnswers = false;

  async ngOnInit(): Promise<void> {
    const routeSloka = this.resolveVerseFromRoute();
    if (routeSloka && this.hasSelectableOptions(routeSloka)) {
      this.initVerseTokens(routeSloka);
      return;
    }

    if (this.slokaService.lastViewedSloka && this.hasSelectableOptions(this.slokaService.lastViewedSloka)) {
      this.initVerseTokens(this.slokaService.lastViewedSloka);
      return;
    }

    this.startNewRound();
  }

  get activeBlank(): ChoiceBlankState | null {
    return this.blanks[this.currentBlankIndex] ?? null;
  }

  get hasPendingBlanks(): boolean {
    return this.blanks.some((blank) => blank.status === 'pending');
  }

  get correctAnswerCount(): number {
    return this.blanks.filter((blank) => blank.status === 'correct').length;
  }

  get totalBlankCount(): number {
    return this.blanks.length;
  }

  get completionFeedbackMessage(): string {
    return getWordCompletionFeedbackMessage(this.correctAnswerCount, this.totalBlankCount);
  }

  restartMultipleChoice(): void {
    this.stopRevealPendingBlanks();

    if (!this.verse) {
      this.startNewRound();
      return;
    }

    this.initVerseTokens(this.verse);
  }

  chooseAnswer(choice: string): void {
    const activeBlank = this.activeBlank;

    if (!activeBlank || this.isCompleted) {
      return;
    }

    this.stopRevealPendingBlanks();

    const trimmedChoice = choice.trim();
    const isCorrect = !!trimmedChoice && this.normalizeWord(trimmedChoice) === this.normalizeWord(activeBlank.word);
    activeBlank.status = isCorrect ? 'correct' : 'incorrect';
    activeBlank.userAnswer = trimmedChoice;
    this.currentBlankIndex += 1;

    if (this.currentBlankIndex >= this.blanks.length) {
      this.isCompleted = true;
    }
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

  blankState(blankIndex: number | undefined): ChoiceBlankState | null {
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

    const selectedVerse = selectDifferentRandomItem(
      this.slokaService.texts,
      this.verse,
      (verse) => this.hasSelectableOptions(verse),
    );

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
    this.currentBlankIndex = 0;
    this.isCompleted = false;
    this.showPendingAnswers = false;

    const tokens = tokenizePracticeVerse(selectedVerse.content);
    const eligibleWords = collectPracticeEligibleWords(tokens);
    const optionGroups = selectedVerse.options?.filter((group) => (group?.length ?? 0) > 0) ?? [];
    const targetBlankCount = Math.min(this.hiddenWordCount, this.maxBlankCount, optionGroups.length);
    const selectedBlankWords = selectPracticeBlankWords(eligibleWords, targetBlankCount);
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

    this.blanks = selectedBlankWords.map(({ word, displayText, optionIndex }) => ({
      word,
      displayText,
      status: 'pending',
      userAnswer: '',
      choices: buildMultipleChoiceOptions(word, optionGroups[optionIndex]),
    }));


    if (!this.blanks.length) {
      this.isCompleted = true;
    }
  }

  private hasSelectableOptions(verse: SlokaModel): boolean {
    return (verse.options ?? []).some((group) => (group?.length ?? 0) > 0);
  }

  private normalizeWord(word: string): string {
    return normalizeWordCompletionWord(word);
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

