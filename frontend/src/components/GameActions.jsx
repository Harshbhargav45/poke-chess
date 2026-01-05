import { useState } from "react";
import { usePokechess } from "../solana/usePokechess";

export default function GameActions() {
  const { createGame, stakeHost, joinAndStake, claimReward, loading, error, gameAccount } =
    usePokechess();

  const [hostKey, setHostKey] = useState("");
  const [stake, setStake] = useState("0.1");

  return (
    <div className="actions">
      {error && <div className="error">{error}</div>}
      {loading && <div className="loading">Loading...</div>}

      <div className="action-group">
        <input
          type="text"
          placeholder="Stake (SOL)"
          value={stake}
          onChange={(e) => setStake(e.target.value)}
          disabled={!!gameAccount}
        />
        <button
          onClick={() => createGame(parseFloat(stake))}
          disabled={!!gameAccount}
        >
          {gameAccount ? "Game Active" : "Create Game"}
        </button>
      </div>


      <div className="action-group">
        <button onClick={stakeHost}>Stake (Host)</button>
      </div>

      <div className="action-group">
        <input
          type="text"
          placeholder="Host Public Key"
          value={hostKey}
          onChange={(e) => setHostKey(e.target.value)}
        />
        <button
          onClick={async () => {
            try {
              const { PublicKey } = await import("@solana/web3.js");
              const key = new PublicKey(hostKey);
              joinAndStake(key);
            } catch (e) {
              console.error(e);
              alert("Invalid Public Key");
            }
          }}
        >
          Join Game
        </button>
      </div>

      <div className="action-group">
        <button onClick={claimReward}>Claim Reward</button>
      </div>
    </div>
  );
}
