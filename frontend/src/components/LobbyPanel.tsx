import { LobbyGame } from "../hooks/useLobby";

type Props = {
  onSelectHost: (host: string) => void;
  lobbyEnabled: boolean;
  games: LobbyGame[];
  onRefresh: () => void;
};

const formatStake = (stake?: number) =>
  stake ? `${stake.toFixed(2)} SOL` : "—";

export default function LobbyPanel({
  onSelectHost,
  lobbyEnabled,
  games,
  onRefresh,
}: Props) {
  if (!lobbyEnabled) {
    return (
      <div className="card action-card">
        <p className="eyebrow">Lobby</p>
        <h3>Peer discovery</h3>
        <p className="muted">
          Set `VITE_LOBBY_URL` to enable real-time public lobbies.
        </p>
      </div>
    );
  }

  const sorted = [...games].sort(
    (a: LobbyGame, b: LobbyGame) => b.createdAt - a.createdAt
  );

  return (
    <div className="card action-card">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Lobby</p>
          <h3>Open games</h3>
        </div>
        <button className="btn ghost" onClick={onRefresh}>
          Refresh
        </button>
      </div>
      {sorted.length === 0 && <p className="muted">No games yet.</p>}
      <div className="lobby-list">
        {sorted.map((game) => (
          <button
            key={game.host}
            className="lobby-row"
            onClick={() => onSelectHost(game.host)}
          >
            <div>
              <p className="label">Host</p>
              <p className="value">{short(game.host)}</p>
            </div>
            <div>
              <p className="label">Stake</p>
              <p className="value">{formatStake(game.stake)}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function short(key: string) {
  return `${key.slice(0, 4)}…${key.slice(-4)}`;
}
