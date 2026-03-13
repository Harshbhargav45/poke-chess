import { useCallback, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

export type LobbyGame = {
  host: string;
  stake: number;
  createdAt: number;
};

type UseLobbyArgs = {
  enabled?: boolean;
  url?: string;
};

export function useLobby({ enabled = false, url }: UseLobbyArgs) {
  const [games, setGames] = useState<LobbyGame[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!enabled || !url) return undefined;

    const socket = io(url, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => socket.emit("list_games"));
    socket.on("games", (payload: LobbyGame[]) => setGames(payload));

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [enabled, url]);

  const advertise = useCallback(
    (host: string, stake: number) =>
      socketRef.current?.emit("host_game", { host, stake }),
    []
  );

  const removeGame = useCallback(
    (host: string) => socketRef.current?.emit("remove_game", { host }),
    []
  );

  const refresh = useCallback(
    () => socketRef.current?.emit("list_games"),
    []
  );

  return { games, advertise, removeGame, refresh };
}
