import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { expect } from "chai";

describe("pokechess", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Pokechess;

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
      lamports: 0.5 * anchor.web3.LAMPORTS_PER_SOL,
    });
    const transferIxJoiner = anchor.web3.SystemProgram.transfer({
      fromPubkey: provider.wallet.publicKey,
      toPubkey: joiner.publicKey,
      lamports: 0.5 * anchor.web3.LAMPORTS_PER_SOL,
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

  describe("Game Creation", () => {
    it("Creates a game with valid stake", async () => {
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
      expect(game.isDelegated).to.be.false;
    });

    it("Rejects stake below minimum", async () => {
      const host2 = anchor.web3.Keypair.generate();
      const [gamePda2] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("game"), host2.publicKey.toBuffer()],
        program.programId
      );
      const [vaultPda2] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), gamePda2.toBuffer()],
        program.programId
      );

      const transferIx = anchor.web3.SystemProgram.transfer({
        fromPubkey: provider.wallet.publicKey,
        toPubkey: host2.publicKey,
        lamports: 0.1 * anchor.web3.LAMPORTS_PER_SOL,
      });
      const tx = new anchor.web3.Transaction().add(transferIx);
      await provider.sendAndConfirm(tx);

      try {
        await program.methods
          .createGame(new anchor.BN(1000)) // Too low
          .accounts({
            game: gamePda2,
            vault: vaultPda2,
            host: host2.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([host2])
          .rpc();
        expect.fail("Should have thrown");
      } catch (err: any) {
        expect(err.toString()).to.include("StakeTooLow");
      }
    });
  });

  describe("Staking", () => {
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

      const game = await program.account.gameAccount.fetch(gamePda);
      expect(game.status.waitingForJoiner).to.not.be.undefined;
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
  });

  describe("Gameplay", () => {
    it("Host makes a pawn move (e2-e4)", async () => {
      // e2 = index 12, e4 = index 28
      await program.methods
        .makeMove(12, 28, null)
        .accounts({
          game: gamePda,
          player: host.publicKey,
        })
        .signers([host])
        .rpc();

      const game = await program.account.gameAccount.fetch(gamePda);
      expect(game.board[28]).to.equal(9); // WHITE_PAWN
      expect(game.board[12]).to.equal(0); // EMPTY
      expect(game.status.active).to.not.be.undefined;
    });

    it("Joiner makes a pawn move (e7-e5)", async () => {
      // e7 = index 52, e5 = index 36
      await program.methods
        .makeMove(52, 36, null)
        .accounts({
          game: gamePda,
          player: joiner.publicKey,
        })
        .signers([joiner])
        .rpc();

      const game = await program.account.gameAccount.fetch(gamePda);
      expect(game.board[36]).to.equal(17); // BLACK_PAWN
      expect(game.board[52]).to.equal(0); // EMPTY
    });

    it("Host cannot move out of turn", async () => {
      try {
        await program.methods
          .makeMove(11, 27, null)
          .accounts({
            game: gamePda,
            player: host.publicKey,
          })
          .signers([host])
          .rpc();
        expect.fail("Should have thrown");
      } catch (err: any) {
        expect(err.toString()).to.include("NotYourTurn");
      }
    });
  });

  describe("Game Control", () => {
    let host2: anchor.web3.Keypair;
    let joiner2: anchor.web3.Keypair;
    let gamePda2: anchor.web3.PublicKey;
    let vaultPda2: anchor.web3.PublicKey;

    before(async () => {
      host2 = anchor.web3.Keypair.generate();
      joiner2 = anchor.web3.Keypair.generate();

      const transferIxHost = anchor.web3.SystemProgram.transfer({
        fromPubkey: provider.wallet.publicKey,
        toPubkey: host2.publicKey,
        lamports: 0.5 * anchor.web3.LAMPORTS_PER_SOL,
      });
      const transferIxJoiner = anchor.web3.SystemProgram.transfer({
        fromPubkey: provider.wallet.publicKey,
        toPubkey: joiner2.publicKey,
        lamports: 0.5 * anchor.web3.LAMPORTS_PER_SOL,
      });

      const tx = new anchor.web3.Transaction().add(transferIxHost, transferIxJoiner);
      await provider.sendAndConfirm(tx);

      [gamePda2] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("game"), host2.publicKey.toBuffer()],
        program.programId
      );

      [vaultPda2] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), gamePda2.toBuffer()],
        program.programId
      );
    });

    it("Host can cancel game before joiner joins", async () => {
      await program.methods
        .createGame(stakeAmount)
        .accounts({
          game: gamePda2,
          vault: vaultPda2,
          host: host2.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([host2])
        .rpc();

      await program.methods
        .cancelGame()
        .accounts({
          game: gamePda2,
          vault: vaultPda2,
          host: host2.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([host2])
        .rpc();

      const game = await program.account.gameAccount.fetch(gamePda2);
      expect(game.status.cancelled).to.not.be.undefined;
    });

    it("Player can resign active game", async () => {
      // Create new game for resign test
      const host3 = anchor.web3.Keypair.generate();
      const joiner3 = anchor.web3.Keypair.generate();

      const transferIx = anchor.web3.SystemProgram.transfer({
        fromPubkey: provider.wallet.publicKey,
        toPubkey: host3.publicKey,
        lamports: 0.5 * anchor.web3.LAMPORTS_PER_SOL,
      });
      const transferIx2 = anchor.web3.SystemProgram.transfer({
        fromPubkey: provider.wallet.publicKey,
        toPubkey: joiner3.publicKey,
        lamports: 0.5 * anchor.web3.LAMPORTS_PER_SOL,
      });
      const tx = new anchor.web3.Transaction().add(transferIx, transferIx2);
      await provider.sendAndConfirm(tx);

      const [gamePda3] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("game"), host3.publicKey.toBuffer()],
        program.programId
      );
      const [vaultPda3] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), gamePda3.toBuffer()],
        program.programId
      );

      await program.methods
        .createGame(stakeAmount)
        .accounts({
          game: gamePda3,
          vault: vaultPda3,
          host: host3.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([host3])
        .rpc();

      await program.methods
        .stakeHost()
        .accounts({
          game: gamePda3,
          vault: vaultPda3,
          host: host3.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([host3])
        .rpc();

      await program.methods
        .joinAndStake()
        .accounts({
          game: gamePda3,
          vault: vaultPda3,
          joiner: joiner3.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([joiner3])
        .rpc();

      await program.methods
        .resign()
        .accounts({
          game: gamePda3,
          player: host3.publicKey,
        })
        .signers([host3])
        .rpc();

      const game = await program.account.gameAccount.fetch(gamePda3);
      expect(game.status.finished).to.not.be.undefined;
      expect(game.winner!.toBase58()).to.equal(joiner3.publicKey.toBase58());
    });
  });

  describe("Reward Claim", () => {
    it("Winner claims reward", async () => {
      const winnerBalanceBefore =
        await provider.connection.getBalance(host.publicKey);

      await program.methods
        .claimReward()
        .accounts({
          game: gamePda,
          vault: vaultPda,
          winner: host.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([host])
        .rpc();

      const winnerBalanceAfter =
        await provider.connection.getBalance(host.publicKey);

      expect(winnerBalanceAfter).to.be.greaterThan(winnerBalanceBefore);

      const game = await program.account.gameAccount.fetch(gamePda);
      expect(game.status.claimed).to.not.be.undefined;
    });

    it("Cannot claim reward twice", async () => {
      try {
        await program.methods
          .claimReward()
          .accounts({
            game: gamePda,
            vault: vaultPda,
            winner: host.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([host])
          .rpc();
        expect.fail("Should have thrown");
      } catch (err: any) {
        expect(err.toString()).to.include("GameNotFinished");
      }
    });

    it("Close game after claim", async () => {
      await program.methods
        .closeGame()
        .accounts({
          game: gamePda,
          vault: vaultPda,
          host: host.publicKey,
        })
        .signers([host])
        .rpc();

      // Account should be closed, fetch should fail
      try {
        await program.account.gameAccount.fetch(gamePda);
        expect.fail("Account should be closed");
      } catch (err: any) {
        expect(err.toString()).to.include("Account does not exist");
      }
    });
  });
});
