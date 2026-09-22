import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { SlokaModel } from '../model/sloka.model';

@Injectable({
  providedIn: 'root',
})
export class SlokaService {
  private readonly http = inject(HttpClient);
  private loadPromise: Promise<void> | null = null;
  private storedCategories: string[] = [];
  private storedChapters: string[] = [];
  private readonly optionWordPattern = String.raw`[\p{L}][\p{L}\p{M}'’-]*`;
  private readonly optionsColumnPattern =
    new RegExp(
      String.raw`^\[(?:\s*\[\s*${this.optionWordPattern}(?:\s*,\s*${this.optionWordPattern})*\s*\]\s*(?:,\s*\[\s*${this.optionWordPattern}(?:\s*,\s*${this.optionWordPattern})*\s*\]\s*)*)\]$`,
      'u'
    );

  readonly texts: SlokaModel[] = [];
  lastViewedSloka: SlokaModel | null = null;

  constructor() {
    void this.load();
  }

  get chapters(): string[] {
    if (this.storedChapters.length) {
      return this.storedChapters;
    }
    const chaptersSet = new Set<string>();
    this.texts.forEach((text) => {
      chaptersSet.add(text.chapter.toString());
    });
    this.storedChapters = Array.from(chaptersSet).sort((a, b) => Number.parseInt(a, 10) - Number.parseInt(b, 10));
    return this.storedChapters;
  }

  get categories(): string[] {
    if (this.storedCategories.length) {
      return this.storedCategories;
    }
    const categoriesSet = new Set<string>();
    this.texts.forEach((text) => {
      text.categories?.forEach((category) => categoriesSet.add(category));
    });
    this.storedCategories = Array.from(categoriesSet).sort((a, b) => a.localeCompare(b, 'hu-HU'));
    return this.storedCategories;
  }

  load(): Promise<void> {

    if (this.texts.length > 0) {
      return Promise.resolve();
    }

    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = firstValueFrom(
      this.http.get('assets/data/data.tsv', {
        responseType: 'text',
      })
    )
      .then((tsv) => {
        const parsedTexts = this.parseTexts(tsv);
        this.texts.splice(0, this.texts.length, ...parsedTexts);
      })
      .catch((error) => {
        this.texts.splice(0, this.texts.length);
        this.loadPromise = null;
        console.error('Failed to load sloka data:', error);
      });

    return this.loadPromise;
  }

  private parseTexts(tsv: string): SlokaModel[] {
    const records: SlokaModel[] = [];
    const lines = tsv.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').split('\n');
    let currentRecord: SlokaModel | null = null;
    let sanskritLines: string[] = [];

    const flushRecord = () => {
      if (!currentRecord) {
        return;
      }

      currentRecord.sanskrit = sanskritLines.join('\n').trim();
      records.push(currentRecord);
      currentRecord = null;
      sanskritLines = [];
    };

    for (const rawLine of lines) {
      const line = rawLine ?? '';

      if (!line.trim()) {
        if (currentRecord && sanskritLines.length) {
          sanskritLines.push('');
        }
        continue;
      }

      const columns = line.split('\t');
      const isNewRecord =
        columns.length >= 4 && /^\d+$/.test(columns[0]?.trim() ?? '') && !!columns[1]?.trim();

      if (isNewRecord) {
        flushRecord();

        currentRecord = new SlokaModel();
        currentRecord.chapter = Number.parseInt(columns[0].trim(), 10);
        currentRecord.index = columns[1].trim();
        currentRecord.categories = this.parseCategories(columns[2] ?? '');
        currentRecord.content = (columns[3] ?? '').trim();

        const { text: initialSanskrit, options } = this.parseTextAndOptions(columns.slice(4));
        if (initialSanskrit) {
          sanskritLines.push(initialSanskrit);
        }
        if (options) {
          currentRecord.options = options;
        }
        continue;
      }

      if (currentRecord) {
        const { text: sanskritLine, options } = this.parseTextAndOptions(columns);
        if (sanskritLine) {
          sanskritLines.push(sanskritLine);
        }
        if (options) {
          currentRecord.options = options;
        }
      }
    }

    flushRecord();
    return records;
  }

  private parseCategories(rawCategories: string): string[] {
    return rawCategories
      .split(',')
      .map((category) => this.toCapitalizedCategory(category.trim()))
      .filter((category) => !!category);
  }

  private parseTextAndOptions(columns: string[]): { text: string; options?: string[][] } {
    if (columns.length === 0) {
      return { text: '' };
    }

    const lastColumn = columns.at(-1)?.trim() ?? '';
    if (!this.optionsColumnPattern.test(lastColumn)) {
      return { text: columns.join('\t').trim() };
    }

    return {
      text: columns.slice(0, -1).join('\t').trim(),
      options: this.parseOptions(lastColumn),
    };
  }

  private parseOptions(rawOptions: string): string[][] {
    const optionGroupPattern = new RegExp(
      String.raw`\[\s*((${this.optionWordPattern})(?:\s*,\s*${this.optionWordPattern})*)\s*\]`,
      'gu'
    );

    return Array.from(rawOptions.matchAll(optionGroupPattern), ([, group]) =>
      group.split(',').map((word) => word.trim())
    );
  }

  private toCapitalizedCategory(category: string): string {
    if (!category) {
      return '';
    }

    const normalized = category.toLocaleLowerCase('hu-HU');
    return normalized.charAt(0).toLocaleUpperCase('hu-HU') + normalized.slice(1);
  }
}

