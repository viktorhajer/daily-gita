export function normalizePracticeWord(word: string): string {
  return word
    .trim()
    .toLocaleLowerCase('hu-HU')
    .normalize('NFD')
    .replace(/\p{M}+/gu, '')
    .normalize('NFKC');
}

