import { describe, expect, it } from 'vitest';
import { selectDifferentVerse } from './practice-round.util';
import { SlokaModel } from '../model/sloka.model';

describe('selectDifferentVerse', () => {
  it('returns undefined if no texts available', () => {
    const result = selectDifferentVerse([], null);
    expect(result).toBeUndefined();
  });

  it('returns the only verse if only one available', () => {
    const verse = new SlokaModel();
    verse.chapter = 1;
    verse.index = '1';
    verse.content = 'Test content';

    const result = selectDifferentVerse([verse], null);
    expect(result).toBe(verse);
  });

  it('returns the only verse even if it matches current verse', () => {
    const verse = new SlokaModel();
    verse.chapter = 1;
    verse.index = '1';
    verse.content = 'Test content';

    const result = selectDifferentVerse([verse], verse);
    expect(result).toBe(verse);
  });

  it('selects a different verse when multiple are available', () => {
    const verse1 = new SlokaModel();
    verse1.chapter = 1;
    verse1.index = '1';
    verse1.content = 'Content 1';

    const verse2 = new SlokaModel();
    verse2.chapter = 1;
    verse2.index = '2';
    verse2.content = 'Content 2';

    const verse3 = new SlokaModel();
    verse3.chapter = 1;
    verse3.index = '3';
    verse3.content = 'Content 3';

    const texts = [verse1, verse2, verse3];

    let differentFound = false;
    for (let i = 0; i < 20; i++) {
      const result = selectDifferentVerse(texts, verse1);
      if (result !== verse1) {
        differentFound = true;
        break;
      }
    }

    expect(differentFound).toBe(true);
  });
});

