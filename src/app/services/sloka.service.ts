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

  readonly texts: SlokaModel[] = [];

  constructor() {
    void this.load();
  }

  get categories(): string[] {
    if (this.storedCategories.length) {
      return this.storedCategories;
    }
    const categoriesSet = new Set<string>();
    this.texts.forEach((text) => {
      text.categories?.forEach((category) => categoriesSet.add(category));
    });
    this.storedCategories = Array.from(categoriesSet);
    return this.storedCategories;
  }

  load(): Promise<void> {
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

      const sanskrit = sanskritLines.join('\n').trim();
      currentRecord.sanskrit = sanskrit;
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

        const initialSanskrit = columns.slice(4).join('\t').trim();
        if (initialSanskrit) {
          sanskritLines.push(initialSanskrit);
        }
        continue;
      }

      if (currentRecord) {
        sanskritLines.push(line.trim());
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

  private toCapitalizedCategory(category: string): string {
    if (!category) {
      return '';
    }

    const normalized = category.toLocaleLowerCase('hu-HU');
    return normalized.charAt(0).toLocaleUpperCase('hu-HU') + normalized.slice(1);
  }
}

