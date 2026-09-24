import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
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
  tokenizePracticeVerse,
} from '../utils/verse.util';

interface TroubleshooterBlankState {
  word: string;
  displayText: string;
  optionIndex: number;
  isDisplayedCorrect: boolean;
  isSelected: boolean;
}

@Component({
  selector: 'app-troubleshooter',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './troubleshooter.component.html',
  styleUrl: './troubleshooter.component.scss',
})
export class TroubleshooterComponent implements OnInit {
  readonly slokaService = inject(SlokaService);
  private readonly route = inject(ActivatedRoute);

  verse: SlokaModel | null = null;
  verseTokens: PracticeVerseToken[] = [];
  blanks: TroubleshooterBlankState[] = [];
  isCompleted = false;

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

  get totalBlankCount(): number {
    return this.blanks.length;
  }

  get correctAnswerCount(): number {
    return this.blanks.filter((blank) => this.isBlankActionCorrect(blank)).length;
  }

  get completionFeedbackMessage(): string {
    return getWordCompletionFeedbackMessage(this.correctAnswerCount, this.totalBlankCount);
  }

  restartTroubleshooter(): void {
    if (!this.verse) {
      this.startNewRound();
      return;
    }

    this.initVerseTokens(this.verse);
  }

  startNewRound(): void {
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

  finishTroubleshooter(): void {
    if (this.isCompleted) {
      return;
    }

    this.isCompleted = true;
  }

  toggleBlankSelection(blankIndex: number | undefined): void {
    if (blankIndex === undefined || this.isCompleted) {
      return;
    }

    const blank = this.blanks[blankIndex];
    if (!blank) {
      return;
    }

    blank.isSelected = !blank.isSelected;
  }

  blankState(blankIndex: number | undefined): TroubleshooterBlankState | null {
    if (blankIndex === undefined) {
      return null;
    }

    return this.blanks[blankIndex] ?? null;
  }

  isBlankActionCorrect(blank: TroubleshooterBlankState): boolean {
    return blank.isDisplayedCorrect ? !blank.isSelected : blank.isSelected;
  }

  shouldShowCorrection(blank: TroubleshooterBlankState): boolean {
    return this.isCompleted && !blank.isDisplayedCorrect;
  }

  getBlankWidth(word: string): number {
    return Math.max(word.length + 2, 8);
  }

  trackByIndex(index: number): number {
    return index;
  }

  private initVerseTokens(selectedVerse: SlokaModel): void {
    const tokens = tokenizePracticeVerse(selectedVerse.content);
    const eligibleWords = collectPracticeEligibleWords(tokens);
    const optionGroups = selectedVerse.options?.filter((group) => (group?.length ?? 0) > 0) ?? [];

    this.verse = selectedVerse;
    this.verseTokens = tokens.map((token, index) => {
      if (token.kind !== 'text') {
        return token;
      }

      const eligibleWord = eligibleWords.find((word) => word.tokenIndex === index);
      if (!eligibleWord) {
        return token;
      }

      return {
        kind: 'blank',
        text: token.text,
        blankIndex: eligibleWord.optionIndex,
      };
    });

    this.blanks = eligibleWords.map(({ word, optionIndex }) => {
      const filledWord = this.selectFilledWord(word, optionGroups[optionIndex]);

      return {
        word,
        displayText: filledWord,
        optionIndex,
        isDisplayedCorrect: this.normalizeWord(filledWord) === this.normalizeWord(word),
        isSelected: false,
      };
    });

    this.isCompleted = false;
  }

  private selectFilledWord(correctWord: string, primaryOptions: string[] | undefined): string {
    const choices = buildMultipleChoiceOptions(correctWord, primaryOptions);
    return choices[0]?.trim() || correctWord.trim();
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


