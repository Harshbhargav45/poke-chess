import { useMemo, useState } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";
import ChessBoard from "./components/ChessBoard";
import WalletButton from "./components/WalletButton";
import GameActions from "./components/GameActions";
import LobbyPanel from "./components/LobbyPanel";
import { useLobby } from "./hooks/useLobby";
import { ErrorBoundary } from "./components/ErrorBoundary";

import "@solana/wallet-adapter-react-ui/styles.css";

export default function App() {
  const network = WalletAdapterNetwork.Devnet;
  const magicEndpoint = import.meta.env.VITE_MAGICBLOCK_RPC as
    | string
    | undefined;
  const [useMagic, setUseMagic] = useState(Boolean(magicEndpoint));
  const endpoint = useMemo(
    () =>
      useMagic && magicEndpoint
        ? magicEndpoint
        : clusterApiUrl(network),
    [useMagic, magicEndpoint, network]
  );

  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    [network]
  );

  const [hostKey, setHostKey] = useState("");
  const lobbyUrl = import.meta.env.VITE_LOBBY_URL as string | undefined;
  const lobbyEnabled = Boolean(lobbyUrl);
  const lobby = useLobby({ enabled: lobbyEnabled, url: lobbyUrl });

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <ErrorBoundary>
            <div className="page">
              <header className="hero">
                <div>
                  <p className="eyebrow">On-chain chess × Pokémon</p>
                  <h1>PokeChess</h1>
                  <p className="lede">
                    Duel with Snorlax kings, stake SOL, and let Solana verify
                    every move. No servers. No custodians. Just pure on-chain
                    play.
                  </p>
                  <div className="cta-row">
                    <WalletButton />
                    <span className="hint">
                      {useMagic && magicEndpoint
                        ? "MagicBlock rollup endpoint"
                        : "Devnet RPC"}{" "}
                      • auto-connect enabled
                    </span>
                  </div>
                </div>
                <div className="hero-card">
                  <p className="muted">Game loop</p>
                  <ol>
                    <li>Host creates a game & stakes SOL</li>
                    <li>Opponent joins and stakes</li>
                    <li>Snorlax duel — your turn is enforced on-chain</li>
                    <li>Winner claims the vault</li>
                  </ol>
                </div>
              </header>

              <main className="layout">
                <section className="left-column">
                  <ChessBoard />
                </section>
                <section className="right-column">
                  <div className="btn-row" style={{ marginBottom: 8 }}>
                    <button
                      className="btn ghost"
                      onClick={() => setUseMagic((v) => !v)}
                      disabled={!magicEndpoint}
                    >
                      {useMagic && magicEndpoint
                        ? "Using MagicBlock rollup RPC"
                        : "Use MagicBlock rollup RPC"}
                    </button>
                    <span className="hint">
                      Endpoint: {endpoint.replace(/^https?:\/\//, "")}
                    </span>
                  </div>

                  <GameActions
                    hostKey={hostKey}
                    setHostKey={setHostKey}
                    onAdvertise={(host, stake) => {
                      if (lobbyEnabled) lobby.advertise(host, stake);
                    }}
                    onRemoveAdvert={(host) => {
                      if (lobbyEnabled) lobby.removeGame(host);
                    }}
                  />
                  <LobbyPanel
                    lobbyEnabled={lobbyEnabled}
                    games={lobby.games}
                    onRefresh={lobby.refresh}
                    onSelectHost={(host) => setHostKey(host)}
                  />
                </section>
              </main>
            </div>
          </ErrorBoundary>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
