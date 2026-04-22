const https = require('https');

const WORDS_URL =
  'https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt';

const fallbackWords = [
  'apple',
  'house',
  'water',
  'stone',
  'robot',
  'planet',
  'school',
  'garden',
  'puzzle',
  'button',
  'letter',
  'window',
  'banana',
  'travel',
  'friend',
];

let cachedWords = null;

function hasUniqueLetters(word) {
  return new Set(word).size === word.length;
}

function fetchWordsFromDwyl() {
  return new Promise((resolve, reject) => {
    https
      .get(WORDS_URL, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error('Could not download word list.'));
          return;
        }

        let raw = '';

        response.on('data', (chunk) => {
          raw += chunk;
        });

        response.on('end', () => {
          const words = raw
            .split('\n')
            .map((word) => word.trim().toLowerCase())
            .filter((word) => /^[a-z]+$/.test(word));

          resolve(words);
        });
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

async function getAllWords() {
  if (cachedWords && cachedWords.length > 0) {
    return cachedWords;
  }

  try {
    cachedWords = await fetchWordsFromDwyl();
  } catch (error) {
    cachedWords = fallbackWords;
  }

  return cachedWords;
}

async function getRandomWord(length, allowRepeatedLetters) {
  const words = await getAllWords();

  const options = words.filter((word) => {
    if (word.length !== length) {
      return false;
    }

    if (!allowRepeatedLetters && !hasUniqueLetters(word)) {
      return false;
    }

    return true;
  });

  if (options.length === 0) {
    throw new Error('No words found with those settings.');
  }

  const randomIndex = Math.floor(Math.random() * options.length);
  return options[randomIndex];
}

module.exports = {
  getRandomWord,
  hasUniqueLetters,
};
