
using StrategoBackend.Models.Database.Entities;
using System.IO.Pipelines;
using System.Numerics;
using System.Security.AccessControl;

namespace StrategoBackend.Game
{
    public class StrategoGame
    {
        public List<Piece> player1Pieces, player2Pieces;
        public List<Piece> player1Lost, player2Lost;
        public Grid initialGrid;

        public StrategoGame(Player p1, Player p2)
        {
            initPlayerPieces(p1, p2);
            initGrid();
        }

        private void initPlayerPieces(Player p1, Player p2)
        {
            player1Pieces = new List<Piece>();
            player2Pieces = new List<Piece>();

     
            player1Pieces.Add(new Piece(piecesTypes.Marshal, p1));
            player1Pieces.Add(new Piece(piecesTypes.General, p1));
            player1Pieces.Add(new Piece(piecesTypes.Spy, p1));
            player1Pieces.Add(new Piece(piecesTypes.Flag, p1));
            for (int i = 0; i < 2; i++) player1Pieces.Add(new Piece(piecesTypes.Colonel, p1));
            for (int i = 0; i < 3; i++) player1Pieces.Add(new Piece(piecesTypes.Major, p1));
            for (int i = 0; i < 4; i++) player1Pieces.Add(new Piece(piecesTypes.Captain, p1));
            for (int i = 0; i < 4; i++) player1Pieces.Add(new Piece(piecesTypes.Lieutenant, p1));
            for (int i = 0; i < 4; i++) player1Pieces.Add(new Piece(piecesTypes.Sergeant, p1));
            for (int i = 0; i < 5; i++) player1Pieces.Add(new Piece(piecesTypes.Miner, p1));
            for (int i = 0; i < 8; i++) player1Pieces.Add(new Piece(piecesTypes.Scout, p1));
            for (int i = 0; i < 6; i++) player1Pieces.Add(new Piece(piecesTypes.Bomb, p1));

            player2Pieces.Add(new Piece(piecesTypes.Marshal, p2));
            player2Pieces.Add(new Piece(piecesTypes.General, p2));
            player2Pieces.Add(new Piece(piecesTypes.Spy, p2));
            player2Pieces.Add(new Piece(piecesTypes.Flag, p2));
            for (int i = 0; i < 2; i++) player2Pieces.Add(new Piece(piecesTypes.Colonel, p2));
            for (int i = 0; i < 3; i++) player2Pieces.Add(new Piece(piecesTypes.Major, p2));
            for (int i = 0; i < 4; i++) player2Pieces.Add(new Piece(piecesTypes.Captain, p2));
            for (int i = 0; i < 4; i++) player2Pieces.Add(new Piece(piecesTypes.Lieutenant, p2));
            for (int i = 0; i < 4; i++) player2Pieces.Add(new Piece(piecesTypes.Sergeant, p2));
            for (int i = 0; i < 5; i++) player2Pieces.Add(new Piece(piecesTypes.Miner, p2));
            for (int i = 0; i < 8; i++) player2Pieces.Add(new Piece(piecesTypes.Scout, p2));
            for (int i = 0; i < 6; i++) player2Pieces.Add(new Piece(piecesTypes.Bomb, p2));
        }

        private void initGrid()
        {
            initialGrid = new Grid();
        }

        // Coloca una pieza en el tablero, verificando que se coloque en la zona correcta.
        public bool setPieceOnGrid(Piece p, Position pos)
        {
            if (p.piecePlayer.playerType != initialGrid.mainGrid[pos.row, pos.col]._type)
                return false;
            initialGrid.mainGrid[pos.row, pos.col]._piece = p;
            return true;
        }

        // Calcula los movimientos posibles para una pieza, devolviendo la lista de posiciones y un código.
        public List<Position> getMoves(Position pos, out int returnCode)
        {
            List<Position> listPos = new List<Position>();
            GridSpace gs = initialGrid.mainGrid[pos.row, pos.col];

            if (gs._piece != null && gs._isPlayable)
            {
                if (gs._piece.pieceCanMove)
                {
                    int max = gs._piece.pieceCanRun ? 10 : 1;

                    // Posiciones hacia abajo
                    for (int i = pos.row + 1; i < pos.row + max + 1; i++)
                    {
                        if (i > 9 || !initialGrid.mainGrid[i, pos.col]._isPlayable) break;
                        if (initialGrid.mainGrid[i, pos.col]._piece != null &&
                            initialGrid.mainGrid[i, pos.col]._piece.piecePlayer.playerType ==
                            gs._piece.piecePlayer.playerType) break;
                        listPos.Add(new Position { row = i, col = pos.col });
                        if (initialGrid.mainGrid[i, pos.col]._piece != null) break;
                    }

                    // Posiciones hacia arriba
                    for (int i = pos.row - 1; i > pos.row - max - 1; i--)
                    {
                        if (i < 0 || !initialGrid.mainGrid[i, pos.col]._isPlayable) break;
                        if (initialGrid.mainGrid[i, pos.col]._piece != null &&
                            initialGrid.mainGrid[i, pos.col]._piece.piecePlayer.playerType ==
                            gs._piece.piecePlayer.playerType) break;
                        listPos.Add(new Position { row = i, col = pos.col });
                        if (initialGrid.mainGrid[i, pos.col]._piece != null) break;
                    }

                    // Posiciones hacia la izquierda
                    for (int i = pos.col - 1; i > pos.col - max - 1; i--)
                    {
                        if (i < 0 || !initialGrid.mainGrid[pos.row, i]._isPlayable) break;
                        if (initialGrid.mainGrid[pos.row, i]._piece != null &&
                            initialGrid.mainGrid[pos.row, i]._piece.piecePlayer.playerType ==
                            gs._piece.piecePlayer.playerType) break;
                        listPos.Add(new Position { row = pos.row, col = i });
                        if (initialGrid.mainGrid[pos.row, i]._piece != null) break;
                    }

                    // Posiciones hacia la derecha
                    for (int i = pos.col + 1; i < pos.col + max + 1; i++)
                    {
                        if (i > 9 || !initialGrid.mainGrid[pos.row, i]._isPlayable) break;
                        if (initialGrid.mainGrid[pos.row, i]._piece != null &&
                            initialGrid.mainGrid[pos.row, i]._piece.piecePlayer.playerType ==
                            gs._piece.piecePlayer.playerType) break;
                        listPos.Add(new Position { row = pos.row, col = i });
                        if (initialGrid.mainGrid[pos.row, i]._piece != null) break;
                    }

                    returnCode = 1;
                }
                else
                {
                    returnCode = 20; // La pieza no puede moverse
                }
            }
            else
            {
                returnCode = 30; // No hay pieza en la posición
            }
            return listPos;
        }

        // Prepara el juego una vez que se han colocado todas las piezas.
        public bool start()
        {
            int count = 0;
            for (int row = 0; row < 10; row++)
            {
                for (int col = 0; col < 10; col++)
                {
                    if (initialGrid.mainGrid[row, col]._piece != null)
                        count++;
                }
            }
            // Puedes descomentar la verificación de las 80 piezas si lo consideras necesario.
            // if (count != 80) return false;
            initialGrid.startUpGrid();
            return true;
        }

        // Realiza un movimiento, evaluando el resultado según las reglas de enfrentamiento.
        public int movePiece(Position now, Position next)
        {
            bool isAllowed = false;
            int returnValue;
            Piece nowPiece = initialGrid.mainGrid[now.row, now.col]._piece;
            Piece nextPiece = initialGrid.mainGrid[next.row, next.col]._piece;

            foreach (Position p in getMoves(now, out returnValue))
            {
                if (p == next)
                    isAllowed = true;
            }
            if (!isAllowed) return 0;

            if (nextPiece == null)
            {
                updateMoveGrid(now, next);
                return 1;
            }
            else
            {
                if (nextPiece.piecePlayer.playerType != nowPiece.piecePlayer.playerType)
                {
                    if (nextPiece.pieceName == piecesTypes.Flag) return 50;
                    if (nextPiece.pieceName == piecesTypes.Bomb && nowPiece.pieceName == piecesTypes.Miner)
                    {
                        updateWinGrid(now, next);
                        return 10;
                    }
                    if (nextPiece.pieceName == piecesTypes.Marshal && nowPiece.pieceName == piecesTypes.Spy)
                    {
                        updateWinGrid(now, next);
                        return 10;
                    }
                    if ((int)nextPiece.pieceName == (int)nowPiece.pieceName)
                    {
                        updateTieGrid(now, next);
                        return 20;
                    }
                    if ((int)nextPiece.pieceName > (int)nowPiece.pieceName)
                    {
                        updateLoseGrid(now, next);
                        return 30;
                    }
                    else
                    {
                        updateWinGrid(now, next);
                        return 10;
                    }
                }
                else
                {
                    return 4; // Mismo equipo (no debería ocurrir)
                }
            }
        }

        private void updateMoveGrid(Position p1, Position p2)
        {
            initialGrid.mainGrid[p2.row, p2.col]._piece = initialGrid.mainGrid[p1.row, p1.col]._piece;
            initialGrid.mainGrid[p1.row, p1.col]._piece = null;
        }
        private void updateWinGrid(Position p1, Position p2)
        {
            // Se podría agregar lógica para agregar la pieza a la lista de perdidas
            initialGrid.mainGrid[p2.row, p2.col]._piece = initialGrid.mainGrid[p1.row, p1.col]._piece;
            initialGrid.mainGrid[p1.row, p1.col]._piece = null;
        }
        private void updateLoseGrid(Position p1, Position p2)
        {
            initialGrid.mainGrid[p1.row, p1.col]._piece = null;
        }
        private void updateTieGrid(Position p1, Position p2)
        {
            initialGrid.mainGrid[p2.row, p2.col]._piece = null;
            initialGrid.mainGrid[p1.row, p1.col]._piece = null;
        }
    }
}

