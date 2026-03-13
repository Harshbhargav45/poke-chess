import { useEffect, useMemo, useState } from "react";
import { usePokechess } from "../solana/usePokechess";

import bulbasaur from "../assets/pieces/bulbasaur.png";
import charizard from "../assets/pieces/charizard.png";
import pikachu from "../assets/pieces/pikachu.png";
import snorlax from "../assets/pieces/snorlax.png";
import squirtle from "../assets/pieces/squirtle.png";

const EMPTY = 0;
const PAWN = 1;
const KNIGHT = 2;
const BISHOP = 3;
const ROOK = 4;
const QUEEN = 5;
const KING = 6;
const WHITE = 8;
const BLACK = 16;

const startingBoard = (): number[] => {
  const next = Array(64).fill(EMPTY);
  next[0] = WHITE | ROOK; next[1] = WHITE | KNIGHT; next[2] = WHITE | BISHOP; next[3] = WHITE | QUEEN;
  next[4] = WHITE | KING; next[5] = WHITE | BISHOP; next[6] = WHITE | KNIGHT; next[7] = WHITE | ROOK;
  for (let i = 8; i < 16; i++) next[i] = WHITE | PAWN;

  for (let i = 48; i < 56; i++) next[i] = BLACK | PAWN;
  next[56] = BLACK | ROOK; next[57] = BLACK | KNIGHT; next[58] = BLACK | BISHOP; next[59] = BLACK | QUEEN;
  next[60] = BLACK | KING; next[61] = BLACK | BISHOP; next[62] = BLACK | KNIGHT; next[63] = BLACK | ROOK;
  return next;
};

const formatKey = (key?: { toString: () => string } | null) =>
  key ? `${key.toString().slice(0, 4)}...${key.toString().slice(-4)}` : "—";

export default function ChessBoard() {
  const { gameAccount, makeMove, wallet, isHost, isJoiner } = usePokechess();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [localBoard, setLocalBoard] = useState<number[]>(startingBoard());
  const [lastMove, setLastMove] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (gameAccount?.board) {
      setLocalBoard([...gameAccount.board]);
    } else {
      setLocalBoard(startingBoard());
    }
    setSelectedIndex(null);
    setLastMove(null);
  }, [gameAccount]);

  const myColor = isHost ? WHITE : isJoiner ? BLACK : null;
  const isMyTurn =
    gameAccount &&
    wallet &&
    gameAccount.turn.toString() === wallet.publicKey.toString();

  const statusLabel = useMemo(() => {
    if (!gameAccount) return "No game";
    if (gameAccount.status.finished) return "Game Over";
    if (gameAccount.status.active) return "Active";
    if (gameAccount.status.waitingForJoiner) return "Waiting for opponent";
    if (gameAccount.status.waitingForHostStake) return "Stake to start";
    return "Loading";
  }, [gameAccount]);

  // We rely fully on smart contract for moves validation, but we visually let the user try any square
  const candidateMoves = useMemo(() => {
    return [];
  }, [selectedIndex]);

  function handleSquareClick(index: number) {
    if (!myColor || !gameAccount?.status.active || !isMyTurn) return;

    const value = localBoard[index];
    const isOwnPiece = value !== EMPTY && (value & (WHITE | BLACK)) === myColor;

    if (selectedIndex === null) {
      if (!isOwnPiece) return;
      setSelectedIndex(index);
      return;
    }

    if (selectedIndex === index) {
      setSelectedIndex(null);
      return;
    }

    const movingVal = localBoard[selectedIndex];
    if (!movingVal) {
      setSelectedIndex(null);
      return;
    }

    const targetVal = localBoard[index];
    if (targetVal !== EMPTY && (targetVal & (WHITE | BLACK)) === myColor) {
      setSelectedIndex(index);
      return;
    }

    const draft = [...localBoard];
    draft[selectedIndex] = EMPTY;
    draft[index] = movingVal;

    setLocalBoard(draft);
    setSelectedIndex(null);
    setLastMove([selectedIndex, index]);

    makeMove(selectedIndex, index).catch(() => {
      // Revert optimism if error
      if (gameAccount?.board) {
        setLocalBoard([...gameAccount.board]);
      }
    });
  }

  const squares = useMemo(() => {
    const ordered = [];
    for (let r = 7; r >= 0; r -= 1) {
      for (let c = 0; c < 8; c += 1) {
        ordered.push(r * 8 + c);
      }
    }
    return ordered;
  }, []);

  const renderPiece = (value: number) => {
    if (!value) return null;
    const color = (value & WHITE) === WHITE ? "w" : "b";
    const type = value & 7;

    let src = snorlax;
    let label = "Piece";
    switch (type) {
      case PAWN: src = pikachu; label = "Pawn"; break;
      case KNIGHT: src = bulbasaur; label = "Knight"; break;
      case BISHOP: src = squirtle; label = "Bishop"; break;
      case ROOK: src = snorlax; label = "Rook"; break;
      case QUEEN: src = charizard; label = "Queen"; break;
      case KING: src = snorlax; label = "King"; break;
    }

    return (
      <img
        src={src}
        alt={`${color === "w" ? "White" : "Black"} ${label}`}
        className={`piece ${color === "b" ? "black" : "white"} p-${type}`}
      />
    );
  };

  return (
    <div className="board-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">On-chain Status</p>
          <h2 className="panel-title">{statusLabel}</h2>
        </div>
        <div className="pill">{isMyTurn ? "Your turn" : "Their turn"}</div>
      </div>

      <div className="meta">
        <div className="chip host">
          White: {formatKey(gameAccount?.host)}
        </div>
        <div className="chip joiner">
          Black: {formatKey(gameAccount?.joiner)}
        </div>
      </div>

      <div className="board">
        {squares.map((idx) => {
          const row = Math.floor(idx / 8);
          const col = idx % 8;
          const isLight = (row + col) % 2 === 1;
          const isSelected = idx === selectedIndex;
          const isDestination = lastMove?.[1] === idx;
          return (
            <button
              type="button"
              key={idx}
              onClick={() => handleSquareClick(idx)}
              className={`square ${isLight ? "light" : "dark"} ${isSelected ? "selected" : ""
                } ${isDestination ? "last-move" : ""}`}
            >
              {renderPiece(localBoard[idx])}
            </button>
          );
        })}
      </div>

      <div className="legend">
        <span className="dot host-dot" />
        White: Hosted Game
        <span className="dot joiner-dot" />
        Black: Joined Game
      </div>
    </div>
  );
}
