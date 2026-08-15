/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/pokechess.json`.
 */
export type Pokechess = {
  "address": "BJkidJiHSTmWFAZkJSaZCc6codPZySCy74LE1dNoi93L",
  "metadata": {
    "name": "pokechess",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "claimReward",
      "discriminator": [149, 95, 181, 242, 94, 90, 158, 162],
      "accounts": [
        { "name": "game", "writable": true },
        { "name": "vault", "writable": true },
        { "name": "winner", "writable": true, "signer": true },
        { "name": "systemProgram", "address": "11111111111111111111111111111111" }
      ],
      "args": []
    },
    {
      "name": "createGame",
      "discriminator": [124, 69, 75, 66, 184, 220, 72, 206],
      "accounts": [
        { "name": "game", "writable": true },
        { "name": "vault", "writable": true },
        { "name": "host", "writable": true, "signer": true },
        { "name": "systemProgram", "address": "11111111111111111111111111111111" }
      ],
      "args": [{ "name": "stakeAmount", "type": "u64" }]
    },
    {
      "name": "joinAndStake",
      "discriminator": [144, 143, 186, 255, 137, 200, 75, 22],
      "accounts": [
        { "name": "game", "writable": true },
        { "name": "vault", "writable": true },
        { "name": "joiner", "writable": true, "signer": true },
        { "name": "systemProgram", "address": "11111111111111111111111111111111" }
      ],
      "args": []
    },
    {
      "name": "makeMove",
      "discriminator": [78, 77, 152, 203, 222, 211, 208, 233],
      "accounts": [
        { "name": "game", "writable": true },
        { "name": "player", "signer": true }
      ],
      "args": [
        { "name": "from", "type": "u8" },
        { "name": "to", "type": "u8" },
        { "name": "promotionPiece", "type": { "option": "u8" } }
      ]
    },
    {
      "name": "stakeHost",
      "discriminator": [60, 221, 7, 130, 189, 244, 226, 143],
      "accounts": [
        { "name": "game", "writable": true },
        { "name": "vault", "writable": true },
        { "name": "host", "writable": true, "signer": true },
        { "name": "systemProgram", "address": "11111111111111111111111111111111" }
      ],
      "args": []
    },
    {
      "name": "cancelGame",
      "discriminator": [93, 44, 243, 133, 207, 41, 129, 33],
      "accounts": [
        { "name": "game", "writable": true },
        { "name": "vault", "writable": true },
        { "name": "host", "writable": true, "signer": true },
        { "name": "systemProgram", "address": "11111111111111111111111111111111" }
      ],
      "args": []
    },
    {
      "name": "resign",
      "discriminator": [48, 211, 170, 200, 55, 148, 134, 88],
      "accounts": [
        { "name": "game", "writable": true },
        { "name": "player", "signer": true }
      ],
      "args": []
    },
    {
      "name": "claimTimeout",
      "discriminator": [196, 66, 42, 189, 107, 240, 196, 144],
      "accounts": [
        { "name": "game", "writable": true },
        { "name": "player", "signer": true }
      ],
      "args": []
    },
    {
      "name": "closeGame",
      "discriminator": [106, 38, 102, 144, 193, 181, 223, 242],
      "accounts": [
        { "name": "game", "writable": true },
        { "name": "vault", "writable": true },
        { "name": "host", "writable": true, "signer": true }
      ],
      "args": []
    },
    {
      "name": "delegateGame",
      "discriminator": [35, 88, 164, 219, 44, 187, 118, 139],
      "accounts": [
        { "name": "game", "writable": true },
        { "name": "host", "writable": true, "signer": true },
        { "name": "delegationProgram" },
        { "name": "bufferPda", "writable": true },
        { "name": "delegationRecordPda", "writable": true },
        { "name": "delegationMetadataPda", "writable": true },
        { "name": "systemProgram", "address": "11111111111111111111111111111111" }
      ],
      "args": []
    },
    {
      "name": "undelegateGame",
      "discriminator": [170, 49, 209, 54, 225, 240, 59, 130],
      "accounts": [
        { "name": "game", "writable": true },
        { "name": "host", "writable": true, "signer": true },
        { "name": "delegationProgram" },
        { "name": "bufferPda", "writable": true },
        { "name": "delegationRecordPda", "writable": true },
        { "name": "delegationMetadataPda", "writable": true },
        { "name": "systemProgram", "address": "11111111111111111111111111111111" }
      ],
      "args": []
    }
  ],
  "accounts": [
    { "name": "gameAccount", "discriminator": [168, 26, 58, 96, 13, 208, 230, 188] },
    { "name": "vaultAccount", "discriminator": [230, 251, 241, 83, 139, 202, 93, 28] }
  ],
  "errors": [
    { "code": 6000, "name": "gameNotActive", "msg": "Game not active" },
    { "code": 6001, "name": "notYourTurn", "msg": "Not your turn" },
    { "code": 6002, "name": "invalidMove", "msg": "Invalid move" },
    { "code": 6003, "name": "unauthorized", "msg": "Unauthorized" },
    { "code": 6004, "name": "gameNotFinished", "msg": "Game not finished" },
    { "code": 6005, "name": "invalidIndex", "msg": "Invalid board index" },
    { "code": 6006, "name": "notYourPiece", "msg": "Not your piece" },
    { "code": 6007, "name": "invalidDestination", "msg": "Cannot capture own piece" },
    { "code": 6008, "name": "joinerAlreadySet", "msg": "Game already has a joiner" },
    { "code": 6009, "name": "hostStakeRequired", "msg": "Host must stake first" },
    { "code": 6010, "name": "joinerIsHost", "msg": "Joiner cannot be host" },
    { "code": 6011, "name": "invalidHostStakePhase", "msg": "Game not waiting for host stake" },
    { "code": 6012, "name": "invalidJoinPhase", "msg": "Game not waiting for joiner" },
    { "code": 6013, "name": "cannotCancel", "msg": "Game cannot be cancelled in current state" },
    { "code": 6014, "name": "notHost", "msg": "Only the host can cancel" },
    { "code": 6015, "name": "cannotResign", "msg": "Game cannot be resigned in current state" },
    { "code": 6016, "name": "gameAlreadyClaimed", "msg": "Game already claimed or closed" },
    { "code": 6017, "name": "noWinner", "msg": "No winner to claim" },
    { "code": 6018, "name": "stakeTooLow", "msg": "Stake amount too low (minimum 0.01 SOL)" },
    { "code": 6019, "name": "stakeTooHigh", "msg": "Stake amount too high (maximum 100 SOL)" }
  ],
  "types": [
    {
      "name": "gameAccount",
      "type": {
        "kind": "struct",
        "fields": [
          { "name": "host", "type": "pubkey" },
          { "name": "joiner", "type": { "option": "pubkey" } },
          { "name": "winner", "type": { "option": "pubkey" } },
          { "name": "board", "type": { "array": ["u8", 64] } },
          { "name": "turn", "type": "pubkey" },
          { "name": "status", "type": { "defined": { "name": "gameStatus" } } },
          { "name": "stakeAmount", "type": "u64" },
          { "name": "gameBump", "type": "u8" },
          { "name": "vaultBump", "type": "u8" },
          { "name": "isDelegated", "type": "bool" },
          { "name": "hasKingMoved", "type": "bool" },
          { "name": "hasWhiteKingsideRookMoved", "type": "bool" },
          { "name": "hasWhiteQueensideRookMoved", "type": "bool" },
          { "name": "hasBlackKingsideRookMoved", "type": "bool" },
          { "name": "hasBlackQueensideRookMoved", "type": "bool" },
          { "name": "enPassantSquare", "type": { "option": "u8" } },
          { "name": "lastMoveFrom", "type": { "option": "u8" } },
          { "name": "lastMoveTo", "type": { "option": "u8" } },
          { "name": "lastMoveTimestamp", "type": "i64" },
          { "name": "moveTimeLimit", "type": "i64" }
        ]
      }
    },
    {
      "name": "gameStatus",
      "type": {
        "kind": "enum",
        "variants": [
          { "name": "waitingForHostStake" },
          { "name": "waitingForJoiner" },
          { "name": "active" },
          { "name": "inCheck" },
          { "name": "finished" },
          { "name": "claimed" },
          { "name": "cancelled" },
          { "name": "draw" }
        ]
      }
    },
    {
      "name": "vaultAccount",
      "type": {
        "kind": "struct",
        "fields": [
          { "name": "game", "type": "pubkey" },
          { "name": "bump", "type": "u8" }
        ]
      }
    }
  ]
};
