# Wordle Fullstack (Backend + Frontend)

Detta projekt innehaller:

- Frontend i React
- Backend i Node.js + Express
- MongoDB for bestandig highscore-lista
- Server-side renderad highscore-sida (EJS)

## Krav

- Node.js installerat
- MongoDB installerat lokalt och igang

## Struktur

- `frontend/` React-klient
- `backend/` Express-server, API, SSR och MongoDB

## 1) Installera MongoDB lokalt

Installera MongoDB Community Server
Databasen som appen anvander ar:

`mongodb://127.0.0.1:27017/scoreboard`

## 2) Installera 

```bash
npm install
```

## 3) Starta appen (bygger frontend + startar backend på port 5080)

```bash
npm start
```

## Routes

- `http://localhost:5080/` - Spelsida (React)
- `http://localhost:5080/about` - Statisk informationssida (React)
- `http://localhost:5080/highscores` - Server-side renderad highscore-lista

## API

- `POST /api/new-game`
  - body: `{ "wordLength": 5, "allowRepeatedLetters": true }`
- `POST /api/guess`
  - body: `{ "gameId": "...", "guess": "apple" }`
- `POST /api/highscores`
  - body: `{ "gameId": "...", "playerName": "Anna", "timeMs": 12345 }`

## Obs

- Slumpord hamtas fran datafilen i `dwyl/english-words` via backend.
- Om nedladdning misslyckas anvands en liten fallback-lista.
