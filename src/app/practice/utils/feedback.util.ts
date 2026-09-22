export function getWordCompletionFeedbackMessage(
  correctAnswerCount: number,
  totalBlankCount: number,
): string {
  if (totalBlankCount <= 0) {
    return 'Szép munka!';
  }

  const incorrectAnswerCount = Math.max(totalBlankCount - correctAnswerCount, 0);

  if (correctAnswerCount === totalBlankCount) {
    return 'Tökéletes, szívből gratulálok!';
  }

  if (incorrectAnswerCount === 1 && totalBlankCount >= 3) {
    return 'Nagyon ügyes vagy, csak egy apró hiba csúszott be!';
  }

  if (correctAnswerCount <= 2) {
    return 'Ezt még érdemes gyakorolni, menni fog!';
  }

  return 'Szép munka, folytasd a gyakorlást!';
}

