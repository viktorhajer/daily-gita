import { SlokaModel } from '../model/sloka.model';

export function selectDifferentVerse(
  texts: SlokaModel[],
  currentVerse: SlokaModel | null,
): SlokaModel | undefined {
  if (texts.length === 0) {
    return undefined;
  }

  if (texts.length === 1) {
    return texts[0];
  }

  let selectedVerse: SlokaModel | undefined;
  let attempts = 0;
  const maxAttempts = texts.length * 2;

  do {
    selectedVerse = texts[Math.floor(Math.random() * texts.length)];
    attempts += 1;
  } while (currentVerse && selectedVerse === currentVerse && attempts < maxAttempts);

  return selectedVerse;
}

