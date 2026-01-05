import * as anchor from "@coral-xyz/anchor";
import idl from "../idl/pokechess.json";

export const PROGRAM_ID = new anchor.web3.PublicKey(
  idl.metadata.address
);

export function getProgram(wallet) {
  const provider = new anchor.AnchorProvider(
    anchor.getProvider().connection,
    wallet,
    {}
  );
  return new anchor.Program(idl, PROGRAM_ID, provider);
}
