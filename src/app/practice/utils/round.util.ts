import { SlokaModel } from '../../model/sloka.model';

export function selectDifferentRandomItem<T>(
  items: T[],
  currentItem: T | null,
  predicate: (item: T) => boolean = () => true,
): T | undefined {
  const eligibleItems = items.filter(predicate);

  if (eligibleItems.length === 0) {
    return undefined;
  }

  if (eligibleItems.length === 1) {
    return eligibleItems[0];
  }

  let selectedItem: T | undefined;
  let attempts = 0;
  const maxAttempts = eligibleItems.length * 2;

  do {
    selectedItem = eligibleItems[Math.floor(Math.random() * eligibleItems.length)];
    attempts += 1;
  } while (currentItem && selectedItem === currentItem && attempts < maxAttempts);

  return selectedItem;
}

export function selectDifferentWordCompletionVerse(
  texts: SlokaModel[],
  currentVerse: SlokaModel | null,
): SlokaModel | undefined {
  return selectDifferentRandomItem(texts, currentVerse);
}

