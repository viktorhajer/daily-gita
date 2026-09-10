import { describe, expect, it } from 'vitest';
import { normalizePracticeWord } from './practice-word.util';

describe('normalizePracticeWord', () => {
  it('normalizes words case-insensitively before comparison', () => {
    expect(normalizePracticeWord('  kṛṢṆA  ')).toBe(normalizePracticeWord('Kṛṣṇa'));
  });

  it('ignores accents before comparison', () => {
    expect(normalizePracticeWord('Krsna')).toBe(normalizePracticeWord('Kṛṣṇa'));
    expect(normalizePracticeWord('arvizturo tukorfurogep')).toBe(
      normalizePracticeWord('árvíztűrő tükörfúrógép'),
    );
  });

  it('does not treat different words as equal', () => {
    expect(normalizePracticeWord('Arjuna')).not.toBe(normalizePracticeWord('Kṛṣṇa'));
  });
});



