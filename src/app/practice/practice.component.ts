import { Component, Input, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { SlokaModel } from '../model/sloka.model';
import { SlokaService } from '../services/sloka.service';

type TokenKind = 'text' | 'space' | 'blank';

interface VerseToken {
  kind: TokenKind;
  text: string;
  blankIndex?: number;
}

interface BlankState {
  word: string;
  status: 'pending' | 'correct' | 'incorrect';
  userAnswer: string;
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

  restartPractice(): void {
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

    const trimmedAnswer = this.normalizeWord(this.currentAnswer);
    if (!trimmedAnswer) {
      return;
    }

    const isCorrect = trimmedAnswer === this.normalizeWord(activeBlank.word);
    activeBlank.status = isCorrect ? 'correct' : 'incorrect';
    activeBlank.userAnswer = this.currentAnswer.trim();
    this.currentAnswer = '';
    this.currentBlankIndex += 1;

    if (this.currentBlankIndex >= this.blanks.length) {
      this.isCompleted = true;
    }
  }

  canSubmit(): boolean {
    return !!this.normalizeWord(this.currentAnswer) && !this.isCompleted && this.hasActiveBlank;
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
    const candidateTexts = this.slokaService.texts.filter(
      (text) => this.getEligibleWords(text.content).length >= this.hiddenWordCount,
    );
    const fallbackTexts = this.slokaService.texts.filter(
      (text) => this.getEligibleWords(text.content).length > 0,
    );
    const pool = candidateTexts.length
      ? candidateTexts
      : fallbackTexts.length
        ? fallbackTexts
        : this.slokaService.texts;
    const selectedVerse = pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;

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
    const tokens = this.tokenizeVerse(selectedVerse.content);
    const eligibleIndices = tokens
      .map((token, index) => ({ token, index }))
      .filter(({ token }) => token.kind === 'text' && this.isEligibleWord(token.text))
      .map(({ index }) => index);

    const blankCount = Math.min(this.hiddenWordCount, eligibleIndices.length);
    const selectedBlankIndices = this.shuffle(eligibleIndices)
      .slice(0, blankCount)
      .sort((a, b) => a - b);
    const blankIndexByTokenIndex = new Map<number, number>();

    selectedBlankIndices.forEach((tokenIndex, blankIndex) => {
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
    this.blanks = selectedBlankIndices.map((tokenIndex) => ({
      word: tokens[tokenIndex].text,
      status: 'pending',
      userAnswer: '',
    }));

    if (!this.blanks.length) {
      this.isCompleted = true;
    }
  }

  private tokenizeVerse(content: string): VerseToken[] {
    return (content.match(/(\s+|[^\s]+)/g) ?? []).map((token) =>
      /\s+/.test(token) ? { kind: 'space', text: token } : { kind: 'text', text: token },
    );
  }

  private getEligibleWords(content: string): string[] {
    return this.tokenizeVerse(content)
      .filter((token): token is VerseToken & { kind: 'text' } => token.kind === 'text')
      .map((token) => token.text)
      .filter((word) => this.isEligibleWord(word));
  }

  private isEligibleWord(word: string): boolean {
    return /^[\p{L}\p{N}]{4,}$/u.test(word);
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
