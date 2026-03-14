# PokeChess Frontend (Vite + React + TS)

A TypeScript client for the on-chain PokeChess program. Built with Vite, React 19, Solana Wallet Adapter, and optional MagicBlock rollup RPC.

## Quick start

```bash
cd frontend
yarn install
yarn dev
```

The app targets Solana **devnet** by default and auto-connects to Phantom/Solflare if available.

## Scripts

- `yarn dev` – start Vite dev server
- `yarn build` – production build to `dist/`
- `yarn preview` – preview the production build
- `yarn lint` – run ESLint (flat config)
- `yarn typecheck` – TS type checking (no emit)

## Environment

- `VITE_MAGICBLOCK_RPC` – optional MagicBlock rollup RPC endpoint
- `VITE_LOBBY_URL` – optional Socket.IO lobby server (e.g. `http://localhost:8787`)
- No env is required for default devnet; `clusterApiUrl` is the fallback.

## Structure

- `src/components` – board UI, wallet button, action panel, lobby list
- `src/solana` – program + wallet hooks, IDL
- `src/hooks` – lobby hooks
- `src/assets` – pixel Pokémon pieces
- `src/index.css` – global theme

## Notes

- Full classical 32-piece movement is validated on-chain (the program enforces turns).
- Wallet Adapter UI styles come from `@solana/wallet-adapter-react-ui/styles.css`.
