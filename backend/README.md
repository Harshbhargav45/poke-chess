# PokeChess Lobby Server

Tiny Socket.IO matchmaking service so players can discover open games.

## Run locally

```bash
cd backend
yarn install
yarn dev
```

The server listens on `PORT` (default `8787`).

## Protocol

- `host_game` `{ host: string, stake: number }` – publish an open game
- `remove_game` `{ host: string }` – remove your entry
- `list_games` – request the latest list
- `games` – server broadcast of all open games

Use `VITE_LOBBY_URL` in the frontend to point at this service.
