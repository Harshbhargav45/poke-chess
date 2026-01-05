import { useEffect, useState } from "react";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { Program, AnchorProvider, web3, BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { Buffer } from "buffer";
import idl from "../idl/pokechess.json";

const PROGRAM_ID = new PublicKey(idl.address);

export function usePokechess() {
    const { connection } = useConnection();
    const wallet = useAnchorWallet();
    const [program, setProgram] = useState(null);
    const [gameAccount, setGameAccount] = useState(null);
    const [gamePda, setGamePda] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (wallet && connection) {
            const provider = new AnchorProvider(connection, wallet, {
                preflightCommitment: "processed",
            });
            const prog = new Program(idl, provider);
            setProgram(prog);

            const pda = findGameAddress(wallet.publicKey);
            fetchGame(prog, pda);
        }
    }, [wallet, connection]);

    const findGameAddress = (hostKey) => {
        const [pda] = PublicKey.findProgramAddressSync(
            [Buffer.from("game"), hostKey.toBuffer()],
            PROGRAM_ID
        );
        return pda;
    };

    const fetchGame = async (prog, pda) => {
        const programToUse = prog || program;
        if (!programToUse) return;

        try {
            const account = await programToUse.account.gameAccount.fetch(pda);
            setGameAccount(account);
            setGamePda(pda);
            console.log("Found existing game:", account);
        } catch (err) {
            console.log("No existing game or error fetching:", err);
        }
    };


    const createGame = async (stakeAmountSol) => {
        if (!program || !wallet) return;
        setLoading(true);
        setError(null);
        try {
            const [pda] = PublicKey.findProgramAddressSync(
                [Buffer.from("game"), wallet.publicKey.toBuffer()],
                PROGRAM_ID
            );
            const [vault] = PublicKey.findProgramAddressSync(
                [Buffer.from("vault"), pda.toBuffer()],
                PROGRAM_ID
            );

            const lamports = new BN(stakeAmountSol * web3.LAMPORTS_PER_SOL);

            await program.methods
                .createGame(lamports)
                .accounts({
                    game: pda,
                    vault: vault,
                    host: wallet.publicKey,
                    systemProgram: web3.SystemProgram.programId,
                })
                .rpc();

            await fetchGame(pda);
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const stakeHost = async () => {
        if (!program || !gamePda) return;
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
                    vault: vault,
                    host: wallet.publicKey,
                    systemProgram: web3.SystemProgram.programId,
                })
                .rpc();
            await fetchGame(gamePda);
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const joinAndStake = async (hostPublicKey) => {
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
                    vault: vault,
                    joiner: wallet.publicKey,
                    systemProgram: web3.SystemProgram.programId,
                })
                .rpc();

            setGamePda(pda);
            await fetchGame(pda);
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const makeMove = async (from, to) => {
        if (!program || !gamePda) return;
        setLoading(true);
        try {
            await program.methods
                .makeMove(from, to)
                .accounts({
                    game: gamePda,
                    player: wallet.publicKey,
                })
                .rpc();
            await fetchGame(gamePda);
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const claimReward = async () => {
        if (!program || !gamePda) return;
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
                    vault: vault,
                    winner: wallet.publicKey,
                })
                .rpc();
            await fetchGame(gamePda);
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return {
        program,
        gameAccount,
        loading,
        error,
        createGame,
        stakeHost,
        joinAndStake,
        makeMove,
        claimReward,
        fetchGame,
        wallet
    };
}
