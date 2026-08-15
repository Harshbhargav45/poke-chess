import { Dispatch, SetStateAction, useState } from "react";
import { usePokechess } from "../solana/usePokechess";

type Props = {
  hostKey: string;
  setHostKey: Dispatch<SetStateAction<string>>;
  onAdvertise?: (host: string, stake: number) => void;
  onRemoveAdvert?: (host: string) => void;
};

export default function GameActions({
  hostKey,
  setHostKey,
  onAdvertise,
  onRemoveAdvert,
}: Props) {
  const {
    createGame,
    stakeHost,
    joinAndStake,
    claimReward,
    cancelGame,
    resign,
    delegateGame,
    undelegateGame,
    refreshGame,
    resetLocal,
    loading,
    error,
    gameAccount,
    gamePda,
    isHost,
    wallet,
  } = usePokechess();

  const [stake, setStake] = useState("0.1");

  const gameIsActive = !!gameAccount && (gameAccount.status.active || gameAccount.status.inCheck);
  const needsHostStake = !!gameAccount && gameAccount.status.waitingForHostStake;
  const waitingForJoiner = !!gameAccount && gameAccount.status.waitingForJoiner;
  const finished = !!gameAccount && gameAccount.status.finished;
  const canCancel = !!gameAccount && (gameAccount.status.waitingForHostStake || gameAccount.status.waitingForJoiner);
  const canResign = !!gameAccount && (gameAccount.status.active || gameAccount.status.inCheck);
  const canJoin = waitingForJoiner || (!gameAccount && hostKey.length > 0);
  const canDelegate = !!gameAccount && !gameAccount.isDelegated && (gameAccount.status.active || gameAccount.status.inCheck || gameAccount.status.waitingForJoiner);
  const canUndelegate = !!gameAccount && gameAccount.isDelegated;

  return (
    <div className="actions">
      {error && <div className="toast error">⚠️ {error}</div>}
      {loading && <div className="toast muted">⏳ Sending transaction…</div>}

      <div className="card-grid">
        <div className="card action-card">
          <p className="eyebrow">Create</p>
          <h3>Host a duel</h3>
          <p className="muted">
            Set the stake and open a fresh game as the host.
          </p>
          <div className="field">
            <label>Stake (SOL)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.10"
              value={stake}
              onChange={(e) => setStake(e.target.value)}
              disabled={!!gameAccount}
            />
          </div>
          <button
            className="btn primary"
            onClick={async () => {
              await createGame(parseFloat(stake));
              if (wallet?.publicKey) {
                onAdvertise?.(wallet.publicKey.toString(), Number(stake));
                setHostKey(wallet.publicKey.toString());
              }
            }}
            disabled={!!gameAccount}
          >
            {gameAccount ? "Game already open" : "Create game"}
          </button>
        </div>

        <div className="card action-card">
          <p className="eyebrow">Stake</p>
          <h3>Lock funds</h3>
          <p className="muted">
            Host must stake first, then the joiner stakes to activate.
          </p>
          <div className="btn-row">
            <button
              className="btn ghost"
              onClick={stakeHost}
              disabled={!needsHostStake || !isHost}
            >
              Stake as host
            </button>
            <button
              className="btn ghost"
              onClick={async () => {
                try {
                  const { PublicKey } = await import("@solana/web3.js");
                  const key = new PublicKey(hostKey || gameAccount?.host);
                  await joinAndStake(key);
                } catch (e) {
                  console.error(e);
                  alert("Invalid host public key");
                }
              }}
              disabled={!!gameIsActive || !canJoin}
            >
              Stake as joiner
            </button>
          </div>
          <div className="field">
            <label>Host public key</label>
            <input
              type="text"
              placeholder="Paste host address"
              value={hostKey}
              onChange={(e) => setHostKey(e.target.value)}
            />
          </div>
        </div>

        <div className="card action-card">
          <p className="eyebrow">Win</p>
          <h3>Claim reward</h3>
          <p className="muted">Available only to the recorded winner.</p>
          <button
            className="btn success"
            onClick={claimReward}
            disabled={!finished}
          >
            Claim SOL
          </button>
          <div className="btn-row">
            <button
              className="btn ghost"
              onClick={refreshGame}
              disabled={!gamePda}
            >
              Refresh
            </button>
            <button
              className="btn ghost"
              onClick={resetLocal}
            >
              Reset
            </button>
          </div>
        </div>

        <div className="card action-card">
          <p className="eyebrow">Control</p>
          <h3>Game actions</h3>
          <p className="muted">Cancel, resign, or manage delegation.</p>
          <div className="btn-row">
            <button
              className="btn danger"
              onClick={cancelGame}
              disabled={!canCancel || !isHost}
            >
              Cancel game
            </button>
            <button
              className="btn danger"
              onClick={resign}
              disabled={!canResign}
            >
              Resign
            </button>
          </div>
          <div className="btn-row" style={{ marginTop: 8 }}>
            <button
              className="btn primary"
              onClick={delegateGame}
              disabled={!canDelegate}
              title="Delegate to MagicBlock ER for instant moves"
            >
              Delegate to ER
            </button>
            <button
              className="btn ghost"
              onClick={undelegateGame}
              disabled={!canUndelegate}
              title="Undelegate and commit state back to L1"
            >
              Undelegate
            </button>
          </div>
          <p className="muted tiny">
            ER: {gameAccount?.isDelegated ? "Active" : "Inactive"} • PDA: {gamePda ? gamePda.toString().slice(0, 8) + "..." : "—"}
          </p>
        </div>
      </div>
    </div>
  );
}
