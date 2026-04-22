import { useMemo, useState } from 'react'
import { Link, Route, Routes } from 'react-router-dom'
import './App.css'

const API_BASE = import.meta.env.VITE_API_BASE || ''

function GamePage() {
  const [wordLength, setWordLength] = useState(5)
  const [allowRepeatedLetters, setAllowRepeatedLetters] = useState(true)
  const [activeSettings, setActiveSettings] = useState(null)
  const [gameId, setGameId] = useState('')
  const [guessInput, setGuessInput] = useState('')
  const [rows, setRows] = useState([])
  const [solved, setSolved] = useState(false)
  const [solvedTimeMs, setSolvedTimeMs] = useState(null)
  const [playerName, setPlayerName] = useState('')
  const [status, setStatus] = useState('Välj inställningar och klicka på Starta spel.')
  const [error, setError] = useState('')
  const [gameStartedAt, setGameStartedAt] = useState(null)

  const canGuess = useMemo(() => {
    return gameId && !solved && guessInput.trim().length === Number(wordLength)
  }, [gameId, solved, guessInput, wordLength])

  async function startGame() {
    setError('')
    setRows([])
    setSolved(false)
    setSolvedTimeMs(null)
    setPlayerName('')
    setGuessInput('')
    setStatus('Startar nytt spel...')

    try {
      const response = await fetch(`${API_BASE}/api/new-game`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wordLength: Number(wordLength),
          allowRepeatedLetters,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Kunde inte starta spel.')
      }

      setGameId(data.gameId)
      setActiveSettings({
        wordLength: Number(wordLength),
        allowRepeatedLetters,
      })
      setGameStartedAt(Date.now())
      setStatus(`Spelet är igång. Gissa ett ord med ${wordLength} bokstäver.`)
    } catch (startError) {
      setError(startError.message)
      setStatus('Något gick fel vid start.')
    }
  }

  async function submitGuess(event) {
    event.preventDefault()

    if (!canGuess) {
      return
    }

    setError('')

    try {
      const response = await fetch(`${API_BASE}/api/guess`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameId,
          guess: guessInput.trim().toLowerCase(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Kunde inte skicka gissning.')
      }

      const latestGuess = {
        word: guessInput.trim().toLowerCase(),
        feedback: data.feedback,
      }

      setRows((previous) => [...previous, latestGuess])
      setGuessInput('')

      if (data.solved) {
        const finishedTimeMs = gameStartedAt ? Date.now() - gameStartedAt : 0
        setSolved(true)
        setSolvedTimeMs(finishedTimeMs)
        setStatus('Rätt ord! Skriv ditt namn för att spara score.')
      } else {
        setStatus('Bra försök. Gissa igen.')
      }
    } catch (guessError) {
      setError(guessError.message)
    }
  }

  async function submitScore(event) {
    event.preventDefault()

    if (!gameId || !solved || !Number.isFinite(solvedTimeMs)) {
      return
    }

    setError('')

    try {
      const guesses = rows.map((row) => row.word)
      const settings = activeSettings || {
        wordLength: Number(wordLength),
        allowRepeatedLetters,
      }

      const response = await fetch(`${API_BASE}/api/highscores`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameId,
          playerName,
          timeMs: solvedTimeMs,
          guesses,
          settings,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Kunde inte spara highscore.')
      }

      setStatus('Highscore sparad! Öppna highscore-listan för att se resultatet.')
      setGameId('')
    } catch (scoreError) {
      setError(scoreError.message)
    }
  }

  return (
    <div className="page">
      <header className="header">
        <h1>Wordle-spel</h1>
        <nav className="links">
          <Link to="/">Spela</Link>
          <Link to="/about">Om</Link>
          <a href="/highscores">Highscores (SSR)</a>
        </nav>
      </header>

      <section className="card">
        <h2>Inställningar</h2>
        <div className="form-grid">
          <label>
            Antal bokstäver
            <input
              type="number"
              min="3"
              max="10"
              value={wordLength}
              onChange={(event) => setWordLength(event.target.value)}
            />
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={allowRepeatedLetters}
              onChange={(event) => setAllowRepeatedLetters(event.target.checked)}
            />
            Tillåt upprepade bokstäver
          </label>
        </div>

        <button type="button" onClick={startGame}>
          Starta spel
        </button>
      </section>

      <section className="card">
        <h2>Gissa ordet</h2>
        <form onSubmit={submitGuess} className="guess-form">
          <input
            type="text"
            value={guessInput}
            disabled={!gameId || solved}
            maxLength={Number(wordLength)}
            onChange={(event) => setGuessInput(event.target.value.replace(/[^a-zA-Z]/g, ''))}
            placeholder="Skriv din gissning"
          />
          <button type="submit" disabled={!canGuess}>
            Gissa
          </button>
        </form>

        <p className="status">{status}</p>
        {error ? <p className="error">{error}</p> : null}

        <div className="board">
          {rows.map((row, rowIndex) => (
            <div key={`${row.word}-${rowIndex}`} className="row">
              {row.feedback.map((cell, cellIndex) => (
                <span key={`${cell.letter}-${cellIndex}`} className={`cell ${cell.status}`}>
                  {cell.letter}
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {solved ? (
        <section className="card">
          <h2>Spara highscore</h2>
          <form onSubmit={submitScore} className="save-form">
            <input
              type="text"
              value={playerName}
              onChange={(event) => setPlayerName(event.target.value)}
              placeholder="Ditt namn"
              required
            />
            <button type="submit">Spara</button>
          </form>
        </section>
      ) : null}
    </div>
  )
}

function AboutPage() {
  return (
    <div className="page">
      <header className="header">
        <h1>Om Projektet</h1>
        <nav className="links">
          <Link to="/">Spela</Link>
          <Link to="/about">Om</Link>
          <a href="/highscores">Highscores (SSR)</a>
        </nav>
      </header>

      <section className="card">
        <p>
          Det här projektet är ett Wordle-inspirerat spel byggt som en fullstack-applikation.
          Frontend är byggd i React och backend i Node.js/Express.
        </p>
        <p>
          Ett slumpmässigt ord hämtas via API från servern. Efter vinst kan spelaren spara
          sitt resultat i MongoDB och visa resultat på en server-side renderad highscore-sida.
        </p>
      </section>
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<GamePage />} />
      <Route path="/about" element={<AboutPage />} />
    </Routes>
  )
}

export default App
