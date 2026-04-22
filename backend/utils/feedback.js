function getFeedback(targetWord, guessWord) {
  const target = targetWord.toLowerCase();
  const guess = guessWord.toLowerCase();

  if (target.length !== guess.length) {
    throw new Error('Target and guess must have the same length.');
  }

  const result = Array.from({ length: guess.length }, () => ({
    letter: '',
    status: 'incorrect',
  }));

  const remainingTargetLetters = {};

  for (let i = 0; i < target.length; i += 1) {
    const t = target[i];
    const g = guess[i];

    result[i].letter = g;

    if (g === t) {
      result[i].status = 'correct';
    } else {
      remainingTargetLetters[t] = (remainingTargetLetters[t] || 0) + 1;
    }
  }

  for (let i = 0; i < guess.length; i += 1) {
    if (result[i].status === 'correct') {
      continue;
    }

    const letter = guess[i];

    if (remainingTargetLetters[letter] > 0) {
      result[i].status = 'misplaced';
      remainingTargetLetters[letter] -= 1;
    } else {
      result[i].status = 'incorrect';
    }
  }

  return result;
}

module.exports = {
  getFeedback,
};
