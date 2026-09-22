import { Component, Input, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { SlokaModel } from '../../model/sloka.model';
import { SlokaService } from '../../services/sloka.service';
import { getWordCompletionFeedbackMessage } from '../utils/feedback.util';
import { selectDifferentWordCompletionVerse } from '../utils/round.util';
import { normalizeWordCompletionWord } from '../utils/word-normalize.util';
import {
  PracticeVerseToken,
  collectPracticeEligibleWords,
  selectPracticeBlankWords,
  tokenizePracticeVerse,
} from '../utils/verse.util';

interface BlankState {
  word: string;
  displayText: string;
  status: 'pending' | 'correct' | 'incorrect';
  userAnswer: string;
}

@Component({
  selector: 'app-word-completion',
  standalone: false,
  templateUrl: './word-completion.component.html',
  styleUrl: './word-completion.component.scss',
})
export class WordCompletionComponent implements OnInit {
  readonly slokaService = inject(SlokaService);
  private readonly route = inject(ActivatedRoute);

  @Input() hiddenWordCount = 5;

  verse: SlokaModel | null = null;
  verseTokens: PracticeVerseToken[] = [];
  blanks: BlankState[] = [];
  currentBlankIndex = 0;
  currentAnswer = '';
  isCompleted = false;
  showPendingAnswers = false;
  isInfoModalOpen = false;

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

  get correctAnswerCount(): number {
    return this.blanks.filter((blank) => blank.status === 'correct').length;
  }

  get totalBlankCount(): number {
    return this.blanks.length;
  }

  get completionFeedbackMessage(): string {
    return getWordCompletionFeedbackMessage(this.correctAnswerCount, this.totalBlankCount);
  }

  get infoModalTitle(): string {
    return 'Információ';
  }

  get infoModalText(): string {
    return [
      'A kis és nagybetű valamint az ékezet nem számít. A továbblépéshez az Ugrik vagy Validál gombokra kell kattintani.',
      '',
      'A megoldás megtekintéséhez tartsd folyamatosan lenyomva a Felfedés gombot.',
      '',
      'Tipp: az üres hely szélessége tükrözi a kimaradt szó hosszát.',
    ].join('\n');
  }


  restartWordCompletion(): void {
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

    const selectedVerse = selectDifferentWordCompletionVerse(this.slokaService.texts, this.verse);
    if (!selectedVerse) {
      this.verse = null;
      this.verseTokens = [];
      this.blanks = [];
      this.isCompleted = true;
      return;
    }

    this.initVerseTokens(selectedVerse);
  }

  openInfoModal(): void {
    this.isInfoModalOpen = true;
  }

  closeInfoModal(): void {
    this.isInfoModalOpen = false;
  }

  private initVerseTokens(selectedVerse: SlokaModel): void {
    this.currentAnswer = '';
    this.currentBlankIndex = 0;
    this.isCompleted = false;
    this.showPendingAnswers = false;
    const tokens = tokenizePracticeVerse(selectedVerse.content);
    const eligibleWords = collectPracticeEligibleWords(tokens);
    const selectedBlankWords = selectPracticeBlankWords(eligibleWords, this.hiddenWordCount);
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
