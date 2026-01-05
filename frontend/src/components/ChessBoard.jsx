import { useState } from "react";
import { Chess } from "chess.js";
import { usePokechess } from "../solana/usePokechess";

import pikachu from "../assets/pieces/pikachu.png";
import charizard from "../assets/pieces/charizard.png";
import bulbasaur from "../assets/pieces/bulbasaur.png";
import squirtle from "../assets/pieces/squirtle.png";
import snorlax from "../assets/pieces/snorlax.png";

const pieceMap = {
  p: pikachu,
  n: squirtle,
  b: bulbasaur,
  r: charizard,
  q: charizard,
  k: snorlax,
};

export default function ChessBoard() {
  const { gameAccount, makeMove, wallet } = usePokechess();
  const [game, setGame] = useState(new Chess());
  const [selectedSquare, setSelectedSquare] = useState(null);

  const isHost = wallet && gameAccount && wallet.publicKey.toString() === gameAccount.host.toString();
  const isJoiner = wallet && gameAccount && gameAccount.joiner && wallet.publicKey.toString() === gameAccount.joiner.toString();
  const myColor = isHost ? 'w' : isJoiner ? 'b' : null;
  const isMyTurn = gameAccount && wallet && gameAccount.turn.toString() === wallet.publicKey.toString();

  function getPieceAt(square) {
    return game.get(square);
  }

  function handleSquareClick(square) {
    if (!myColor) return;

    if (selectedSquare) {
      if (selectedSquare === square) {
        setSelectedSquare(null);
        return;
      }

      try {
        const move = game.move({
          from: selectedSquare,
          to: square,
          promotion: "q",
        });

        if (move) {
          setGame(new Chess(game.fen()));
          setSelectedSquare(null);

          if (move.piece === "k") {
            const fromIndex = squareToIndex(move.from);
            const toIndex = squareToIndex(move.to);
            console.log(`Snorlax moved from ${move.from} to ${move.to}. Sending transaction...`);
            makeMove(fromIndex, toIndex);
          }
          return;
        }
      } catch (e) {
      }
    }

    const piece = getPieceAt(square);
    if (piece) {
      if (piece.color === myColor && piece.color === game.turn()) {
        setSelectedSquare(square);
      } else {
        setSelectedSquare(null);
      }
    } else {
      setSelectedSquare(null);
    }
  }

  const board = game.board();

  function getSquareName(rowIndex, colIndex) {
    const file = String.fromCharCode(97 + colIndex);
    const rank = 8 - rowIndex;
    return `${file}${rank}`;
  }

  function squareToIndex(square) {
    const file = square.charCodeAt(0) - 97;
    const rank = parseInt(square[1]) - 1;
    return rank * 8 + file;
  }

  return (
    <div className="board-wrapper">
      {gameAccount && (
        <div className="status">
          <p className="status-label">
            {gameAccount.status.finished ? "🏆 Game Over" :
              gameAccount.status.active ? "⚔️ Game Active" :
                gameAccount.status.waitingForJoiner ? "⏳ Waiting for Opponent" :
                  "⏳ Waiting for Host Stake"}
          </p>

          {gameAccount.status.finished && gameAccount.winner && (
            <p className="winner-display">
              Winner: {gameAccount.winner.toString() === wallet?.publicKey.toString()
                ? "🎉 You!"
                : gameAccount.winner.toString().slice(0, 8) + "..."}
            </p>
          )}

          {gameAccount.status.active && myColor && (
            <p className={isMyTurn ? "my-turn" : "waiting"}>
              {isMyTurn ? "🎮 Your Turn!" : "⏳ Waiting for opponent..."}
            </p>
          )}
        </div>
      )}

      <div className="board">
        {board.map((row, rowIndex) =>
          row.map((piece, colIndex) => {
            const squareName = getSquareName(rowIndex, colIndex);
            const isLight = (rowIndex + colIndex) % 2 === 0;
            const isSelected = selectedSquare === squareName;

            return (
              <div
                key={squareName}
                onClick={() => handleSquareClick(squareName)}
                className={`square ${isLight ? "light" : "dark"} ${isSelected ? "selected" : ""}`}
              >
                {piece && (
                  <img
                    src={pieceMap[piece.type]}
                    alt={`${piece.color} ${piece.type}`}
                    className={`piece ${piece.color === "b" ? "black" : ""}`}
                  />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
