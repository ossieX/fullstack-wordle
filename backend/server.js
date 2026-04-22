const path = require('path');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const Score = require('./models/Score');
const { getFeedback } = require('./utils/feedback');
const { getRandomWord } = require('./utils/wordService');

const app = express();
const PORT = 5080;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/scoreboard';

const games = new Map();

async function connectToMongo() {
  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log('Connected to MongoDB:', MONGO_URI);
  } catch (error) {
    console.error('MongoDB connection failed. Highscores will not be persisted.');
    console.error(error.message);
  }
}

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/new-game', async (req, res) => {
  try {
    const wordLength = Number(req.body.wordLength);
    const allowRepeatedLetters = Boolean(req.body.allowRepeatedLetters);

    if (!Number.isInteger(wordLength) || wordLength < 3 || wordLength > 10) {
      return res.status(400).json({ error: 'wordLength must be an integer between 3 and 10.' });
    }

    const word = await getRandomWord(wordLength, allowRepeatedLetters);
    const gameId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    games.set(gameId, {
      word,
      settings: {
        wordLength,
        allowRepeatedLetters,
      },
      guesses: [],
      solved: false,
      startedAt: Date.now(),
    });

    return res.json({ gameId, wordLength });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Could not start game.' });
  }
});

app.post('/api/guess', (req, res) => {
  const { gameId, guess } = req.body;

  if (!gameId || typeof guess !== 'string') {
    return res.status(400).json({ error: 'gameId and guess are required.' });
  }

  const game = games.get(gameId);

  if (!game) {
    return res.status(404).json({ error: 'Game not found.' });
  }

  if (game.solved) {
    return res.status(400).json({ error: 'This game is already solved.' });
  }

  const cleanedGuess = guess.trim().toLowerCase();

  if (cleanedGuess.length !== game.settings.wordLength) {
    return res.status(400).json({
      error: `Guess must be ${game.settings.wordLength} letters long.`,
    });
  }

  if (!/^[a-z]+$/.test(cleanedGuess)) {
    return res.status(400).json({ error: 'Guess may only contain letters a-z.' });
  }

  const feedback = getFeedback(game.word, cleanedGuess);
  const solved = cleanedGuess === game.word;

  game.guesses.push(cleanedGuess);
  game.solved = solved;

  return res.json({
    feedback,
    solved,
    guesses: game.guesses,
  });
});

app.post('/api/highscores', async (req, res) => {
  try {
    const { gameId, playerName, timeMs, guesses, settings } = req.body;

    const game = games.get(gameId);

    if (!game) {
      return res.status(404).json({ error: 'Game not found.' });
    }

    if (!game.solved) {
      return res.status(400).json({ error: 'Game is not solved yet.' });
    }

    if (typeof playerName !== 'string' || playerName.trim().length < 1) {
      return res.status(400).json({ error: 'playerName is required.' });
    }

    if (!Number.isFinite(timeMs) || timeMs < 0) {
      return res.status(400).json({ error: 'timeMs must be a positive number.' });
    }

    if (!Array.isArray(guesses) || guesses.length === 0) {
      return res.status(400).json({ error: 'guesses must be a non-empty array.' });
    }

    if (
      !settings ||
      !Number.isInteger(settings.wordLength) ||
      typeof settings.allowRepeatedLetters !== 'boolean'
    ) {
      return res.status(400).json({
        error: 'settings must include wordLength and allowRepeatedLetters.',
      });
    }

    const guessesMatchGame =
      guesses.length === game.guesses.length &&
      guesses.every((guess, index) => guess === game.guesses[index]);

    const settingsMatchGame =
      settings.wordLength === game.settings.wordLength &&
      settings.allowRepeatedLetters === game.settings.allowRepeatedLetters;

    if (!guessesMatchGame || !settingsMatchGame) {
      return res.status(400).json({
        error: 'Submitted guesses/settings do not match the solved game.',
      });
    }

    const score = await Score.create({
      playerName: playerName.trim(),
      timeMs,
      guesses,
      settings,
    });

    games.delete(gameId);

    return res.status(201).json({ id: score._id });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Could not save highscore.' });
  }
});

app.get('/highscores', async (req, res) => {
  try {
    const scores = await Score.find({})
      .sort({ timeMs: 1, createdAt: 1 })
      .limit(50)
      .lean();

    return res.render('highscores', { scores });
  } catch (error) {
    return res.status(500).send('Could not load highscores. Check MongoDB connection.');
  }
});

const frontendDistPath = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(frontendDistPath));

app.get('/about', (req, res) => {
  res.sendFile(path.join(frontendDistPath, 'index.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(frontendDistPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

connectToMongo();
