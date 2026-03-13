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
      "discriminator": [
        149,
        95,
        181,
        242,
        94,
        90,
        158,
        162
      ],
      "accounts": [
        {
          "name": "game",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  97,
                  109,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "game.host",
                "account": "gameAccount"
              }
            ]
          }
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "game"
              }
            ]
          }
        },
        {
          "name": "winner",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "createGame",
      "discriminator": [
        124,
        69,
        75,
        66,
        184,
        220,
        72,
        206
      ],
      "accounts": [
        {
          "name": "game",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  97,
                  109,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "host"
              }
            ]
          }
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "game"
              }
            ]
          }
        },
        {
          "name": "host",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "stakeAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "joinAndStake",
      "discriminator": [
        144,
        143,
        186,
        255,
        137,
        200,
        75,
        22
      ],
      "accounts": [
        {
          "name": "game",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  97,
                  109,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "game.host",
                "account": "gameAccount"
              }
            ]
          }
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "game"
              }
            ]
          }
        },
        {
          "name": "joiner",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "makeMove",
      "discriminator": [
        78,
        77,
        152,
        203,
        222,
        211,
        208,
        233
      ],
      "accounts": [
        {
          "name": "game",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  97,
                  109,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "game.host",
                "account": "gameAccount"
              }
            ]
          }
        },
        {
          "name": "player",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "from",
          "type": "u8"
        },
        {
          "name": "to",
          "type": "u8"
        }
      ]
    },
    {
      "name": "stakeHost",
      "discriminator": [
        60,
        221,
        7,
        130,
        189,
        244,
        226,
        143
      ],
      "accounts": [
        {
          "name": "game",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  97,
                  109,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "host"
              }
            ]
          }
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "game"
              }
            ]
          }
        },
        {
          "name": "host",
          "writable": true,
          "signer": true,
          "relations": [
            "game"
          ]
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "gameAccount",
      "discriminator": [
        168,
        26,
        58,
        96,
        13,
        208,
        230,
        188
      ]
    },
    {
      "name": "vaultAccount",
      "discriminator": [
        230,
        251,
        241,
        83,
        139,
        202,
        93,
        28
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "gameNotActive",
      "msg": "Game not active"
    },
    {
      "code": 6001,
      "name": "notYourTurn",
      "msg": "Not your turn"
    },
    {
      "code": 6002,
      "name": "invalidMove",
      "msg": "Invalid move"
    },
    {
      "code": 6003,
      "name": "unauthorized",
      "msg": "unauthorized"
    },
    {
      "code": 6004,
      "name": "gameNotFinished",
      "msg": "Game not finished"
    },
    {
      "code": 6005,
      "name": "invalidIndex",
      "msg": "Invalid board index"
    },
    {
      "code": 6006,
      "name": "notYourPiece",
      "msg": "Not your piece"
    },
    {
      "code": 6007,
      "name": "invalidDestination",
      "msg": "Cannot capture own piece"
    },
    {
      "code": 6008,
      "name": "joinerAlreadySet",
      "msg": "Game already has a joiner"
    },
    {
      "code": 6009,
      "name": "hostStakeRequired",
      "msg": "Host must stake first"
    },
    {
      "code": 6010,
      "name": "joinerIsHost",
      "msg": "Joiner cannot be host"
    },
    {
      "code": 6011,
      "name": "invalidHostStakePhase",
      "msg": "Game not waiting for host stake"
    },
    {
      "code": 6012,
      "name": "invalidJoinPhase",
      "msg": "Game not waiting for joiner"
    }
  ],
  "types": [
    {
      "name": "gameAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "host",
            "type": "pubkey"
          },
          {
            "name": "joiner",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "winner",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "board",
            "type": {
              "array": [
                "u8",
                64
              ]
            }
          },
          {
            "name": "turn",
            "type": "pubkey"
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "gameStatus"
              }
            }
          },
          {
            "name": "stakeAmount",
            "type": "u64"
          },
          {
            "name": "gameBump",
            "type": "u8"
          },
          {
            "name": "vaultBump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "gameStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "waitingForHostStake"
          },
          {
            "name": "waitingForJoiner"
          },
          {
            "name": "active"
          },
          {
            "name": "finished"
          }
        ]
      }
    },
    {
      "name": "vaultAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "game",
            "type": "pubkey"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ]
};
