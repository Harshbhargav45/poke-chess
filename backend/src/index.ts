import cors from "cors";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

type LobbyGame = {
  host: string;
  stake: number;
  createdAt: number;
};

const app = express();
app.use(cors());

app.get("/health", (_req, res) => res.json({ ok: true }));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

const games: Record<string, LobbyGame> = {};

io.on("connection", (socket) => {
  socket.emit("games", Object.values(games));

  socket.on("list_games", () => {
    socket.emit("games", Object.values(games));
  });

  socket.on("host_game", ({ host, stake }: LobbyGame) => {
    if (!host) return;
    games[host] = { host, stake: Number(stake) || 0, createdAt: Date.now() };
    io.emit("games", Object.values(games));
  });

  socket.on("remove_game", ({ host }: { host: string }) => {
    if (host && games[host]) {
      delete games[host];
      io.emit("games", Object.values(games));
    }
  });
});

setInterval(() => {
  const cutoff = Date.now() - 1000 * 60 * 30;
  Object.values(games).forEach((game) => {
    if (game.createdAt < cutoff) {
      delete games[game.host];
    }
  });
}, 60_000);

const PORT = process.env.PORT || 8787;
httpServer.listen(PORT, () => {
  console.log(`PokeChess lobby listening on ${PORT}`);
});
