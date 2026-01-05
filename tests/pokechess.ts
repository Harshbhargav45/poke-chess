import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Pokechess } from "../target/types/pokechess";
import { expect } from "chai";

describe("pokechess (lightweight)", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Pokechess as Program<Pokechess>;

  const host = anchor.web3.Keypair.generate();
  const joiner = anchor.web3.Keypair.generate();

  let gamePda: anchor.web3.PublicKey;
  let vaultPda: anchor.web3.PublicKey;

  const stakeAmount = new anchor.BN(
    0.1 * anchor.web3.LAMPORTS_PER_SOL
  );

  before(async () => {
    const transferIxHost = anchor.web3.SystemProgram.transfer({
      fromPubkey: provider.wallet.publicKey,
      toPubkey: host.publicKey,
      lamports: 0.15 * anchor.web3.LAMPORTS_PER_SOL,
    });
    const transferIxJoiner = anchor.web3.SystemProgram.transfer({
      fromPubkey: provider.wallet.publicKey,
      toPubkey: joiner.publicKey,
      lamports: 0.15 * anchor.web3.LAMPORTS_PER_SOL,
    });

    const tx = new anchor.web3.Transaction().add(transferIxHost, transferIxJoiner);
    await provider.sendAndConfirm(tx);

    [gamePda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("game"), host.publicKey.toBuffer()],
      program.programId
    );

    [vaultPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), gamePda.toBuffer()],
      program.programId
    );
  });

  it("Creates a game", async () => {
    await program.methods
      .createGame(stakeAmount)
      .accounts({
        game: gamePda,
        vault: vaultPda,
        host: host.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([host])
      .rpc();

    const game = await program.account.gameAccount.fetch(gamePda);

    expect(game.host.toBase58()).to.equal(host.publicKey.toBase58());
    expect(game.stakeAmount.toNumber()).to.equal(stakeAmount.toNumber());
    expect(game.status.waitingForHostStake).to.not.be.undefined;
  });

  it("Host stakes SOL", async () => {
    const vaultBalanceBefore =
      await provider.connection.getBalance(vaultPda);

    await program.methods
      .stakeHost()
      .accounts({
        game: gamePda,
        vault: vaultPda,
        host: host.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([host])
      .rpc();

    const vaultBalanceAfter =
      await provider.connection.getBalance(vaultPda);

    expect(vaultBalanceAfter - vaultBalanceBefore).to.equal(
      stakeAmount.toNumber()
    );
  });

  it("Joiner joins and stakes", async () => {
    await program.methods
      .joinAndStake()
      .accounts({
        game: gamePda,
        vault: vaultPda,
        joiner: joiner.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([joiner])
      .rpc();

    const game = await program.account.gameAccount.fetch(gamePda);
    expect(game.status.active).to.not.be.undefined;
    expect(game.joiner.toBase58()).to.equal(joiner.publicKey.toBase58());
  });

  it("Host makes a move (Snorlax move ends game)", async () => {
    await program.methods
      .makeMove(4, 12)
      .accounts({
        game: gamePda,
        player: host.publicKey,
      })
      .signers([host])
      .rpc();

    const game = await program.account.gameAccount.fetch(gamePda);
    expect(game.status.finished).to.not.be.undefined;
    expect(game.winner).to.not.be.null;
    expect(game.winner!.toBase58()).to.equal(host.publicKey.toBase58());
  });

  it("Winner claims reward", async () => {
    const winnerBalanceBefore =
      await provider.connection.getBalance(host.publicKey);

    await program.methods
      .claimReward()
      .accounts({
        game: gamePda,
        vault: vaultPda,
        winner: host.publicKey,
      })
      .signers([host])
      .rpc();

    const winnerBalanceAfter =
      await provider.connection.getBalance(host.publicKey);

    expect(winnerBalanceAfter).to.be.greaterThan(winnerBalanceBefore);
  });
});