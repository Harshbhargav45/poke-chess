import { useEffect, useMemo, useState } from "react";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { Program, AnchorProvider, web3, BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { Buffer } from "buffer";
import { Pokechess } from "../idl/pokechess";
import idl from "../idl/pokechess.json";

type GameStatus = {
  waitingForHostStake?: {};
  waitingForJoiner?: {};
  active?: {};
  finished?: {};
};

export type GameAccount = {
  host: PublicKey;
  joiner: PublicKey | null;
  winner: PublicKey | null;
  board: number[];
  turn: PublicKey;
  status: GameStatus;
  stakeAmount: BN;
  gameBump: number;
  vaultBump: number;
};

const PROGRAM_ID = new PublicKey((idl as { address: string }).address);
const POLL_MS = 6_000;

export function usePokechess() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const [program, setProgram] = useState<Program<Pokechess> | null>(null);
  const [gameAccount, setGameAccount] = useState<GameAccount | null>(null);
  const [gamePda, setGamePda] = useState<PublicKey | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const findGameAddress = (hostKey: PublicKey) => {
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("game"), hostKey.toBuffer()],
      PROGRAM_ID
    );
    return pda;
  };

  useEffect(() => {
    if (wallet && connection) {
      const provider = new AnchorProvider(connection, wallet, {
        preflightCommitment: "processed",
      });
      const prog = new Program<Pokechess>(idl as unknown as Pokechess, provider);
      setProgram(prog);

      const pda = findGameAddress(wallet.publicKey);
      fetchGame(pda, prog);
    }
  }, [wallet, connection]);

  useEffect(() => {
    if (!program || !gamePda) return undefined;
    const id = setInterval(() => fetchGame(gamePda, program), POLL_MS);
    return () => clearInterval(id);
  }, [program, gamePda]);

  const fetchGame = async (pda: PublicKey | null, prog?: Program<Pokechess>) => {
    const programToUse = prog || program;
    if (!programToUse || !pda) return;

    try {
      const account = (await programToUse.account.gameAccount.fetch(
        pda
      )) as GameAccount;
      setGameAccount(account);
      setGamePda(pda);
    } catch (err) {
      console.warn("No existing game or error fetching:", err);
    }
  };

  const createGame = async (stakeAmountSol?: number) => {
    if (!program || !wallet) return;
    const parsed = Number(stakeAmountSol);
    if (Number.isNaN(parsed) || parsed <= 0) {
      setError("Enter a stake > 0");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const pda = findGameAddress(wallet.publicKey);
      const [vault] = PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), pda.toBuffer()],
        PROGRAM_ID
      );

      const lamports = new BN(parsed * web3.LAMPORTS_PER_SOL);

      await program.methods
        .createGame(lamports)
        .accounts({
          game: pda,
          vault,
          host: wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
        } as any)
        .rpc();

      await fetchGame(pda, program);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const stakeHost = async () => {
    if (!program || !gamePda || !wallet) return;
    setLoading(true);
    try {
      const [vault] = PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), gamePda.toBuffer()],
        PROGRAM_ID
      );
      await program.methods
        .stakeHost()
        .accounts({
          game: gamePda,
          vault,
          host: wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
        } as any)
        .rpc();
      await fetchGame(gamePda, program);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const joinAndStake = async (hostPublicKey: PublicKey) => {
    if (!program || !wallet) return;
    setLoading(true);
    try {
      const pda = findGameAddress(hostPublicKey);
      const [vault] = PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), pda.toBuffer()],
        PROGRAM_ID
      );
      await program.methods
        .joinAndStake()
        .accounts({
          game: pda,
          vault,
          joiner: wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
        } as any)
        .rpc();

      setGamePda(pda);
      await fetchGame(pda, program);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const makeMove = async (from, to) => {
    if (!program || !gamePda || !wallet) return;
    setLoading(true);
    try {
      await program.methods
        .makeMove(from, to)
        .accounts({
          game: gamePda,
          player: wallet.publicKey,
        } as any)
        .rpc();
      await fetchGame(gamePda, program);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const claimReward = async () => {
    if (!program || !gamePda || !wallet) return;
    setLoading(true);
    try {
      const [vault] = PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), gamePda.toBuffer()],
        PROGRAM_ID
      );
      await program.methods
        .claimReward()
        .accounts({
          game: gamePda,
          vault,
          winner: wallet.publicKey,
        } as any)
        .rpc();
      await fetchGame(gamePda, program);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const refreshGame = async (hostKey?: string) => {
    if (!program) return;
    if (hostKey) {
      const key = new PublicKey(hostKey);
      const pda = findGameAddress(key);
      await fetchGame(pda, program);
    } else if (gamePda) {
      await fetchGame(gamePda, program);
    }
  };

  const resetLocal = () => {
    setGameAccount(null);
    setGamePda(null);
    setError(null);
  };

  const isHost = useMemo(
    () =>
      wallet &&
      gameAccount &&
      wallet.publicKey.toString() === gameAccount.host.toString(),
    [wallet, gameAccount]
  );

  const isJoiner = useMemo(
    () =>
      wallet &&
      gameAccount &&
      gameAccount.joiner &&
      wallet.publicKey.toString() === gameAccount.joiner.toString(),
    [wallet, gameAccount]
  );

  return {
    program,
    gameAccount,
    gamePda,
    loading,
    error,
    isHost,
    isJoiner,
    createGame,
    stakeHost,
    joinAndStake,
    makeMove,
    claimReward,
    refreshGame,
    resetLocal,
    wallet,
  };
}
