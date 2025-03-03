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

        // Agregamos la propiedad para controlar el turno.
        public SpaceType currentTurn { get; set; }

        public StrategoGame(Player p1, Player p2)
        {
            initPlayerPieces(p1, p2);
            initGrid();
            SetupDefaultPositions();  // Colocar piezas por defecto
            // Inicializamos el turno, por ejemplo, para que empiece el Player1.
            currentTurn = SpaceType.Player1;
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

        // Método para colocar las piezas por defecto en el tablero
        public void SetupDefaultPositions()
        {
            Random random = new Random();

            // Colocar piezas de Player2 en filas 0 a 3
            PlacePlayerPiecesRandomly(SpaceType.Player2, player2Pieces, 0, 3, random);

            // Colocar piezas de Player1 en filas 6 a 9
            PlacePlayerPiecesRandomly(SpaceType.Player1, player1Pieces, 6, 9, random);
        }

        private void PlacePlayerPiecesRandomly(SpaceType playerType, List<Piece> playerPieces, int startRow, int endRow, Random random)
        {
            // Crear una lista de todas las posiciones disponibles para el jugador
            var availablePositions = new List<Position>();
            for (int row = startRow; row <= endRow; row++)
            {
                for (int col = 0; col < 10; col++)
                {
                    if (initialGrid.mainGrid[row, col]._type == playerType &&
                        initialGrid.mainGrid[row, col]._isPlayable)
                    {
                        availablePositions.Add(new Position { row = row, col = col });
                    }
                }
            }

            // Mezclar las posiciones disponibles
            for (int i = 0; i < availablePositions.Count; i++)
            {
                int j = random.Next(i, availablePositions.Count);
                var temp = availablePositions[i];
                availablePositions[i] = availablePositions[j];
                availablePositions[j] = temp;
            }

            // Colocar cada pieza en una posición aleatoria
            int positionIndex = 0;
            foreach (var piece in playerPieces)
            {
                // Buscar una posición no ocupada
                while (positionIndex < availablePositions.Count)
                {
                    var pos = availablePositions[positionIndex];
                    if (initialGrid.mainGrid[pos.row, pos.col]._piece == null)
                    {
                        initialGrid.mainGrid[pos.row, pos.col]._piece = piece;
                        break;
                    }
                    positionIndex++;
                }

                // Si no quedan posiciones, detener la colocación (aunque esto no debería ocurrir)
                if (positionIndex >= availablePositions.Count)
                {
                    break;
                }
            }
        }
        // Calcula los movimientos posibles para una pieza, devolviendo la lista de posiciones y un código.
        public List<Position> getMoves(Position pos, out int returnCode)
        {
            List<Position> listPos = new List<Position>();
            GridSpace gs = initialGrid.mainGrid[pos.row, pos.col];

            Console.WriteLine($"[getMoves] Posición origen: ({pos.row}, {pos.col})");
            Console.WriteLine($"[getMoves] Pieza en la celda: {(gs._piece != null ? gs._piece.pieceName.ToString() : "Ninguna")}");
            Console.WriteLine($"[getMoves] Celda jugable: {gs._isPlayable}");

            if (gs._piece != null && gs._isPlayable)
            {
                if (gs._piece.pieceCanMove)
                {
                    int max = gs._piece.pieceCanRun ? 10 : 1;
                    // Movimientos hacia abajo
                    for (int i = pos.row + 1; i < pos.row + max + 1; i++)
                    {
                        if (i > 9 || !initialGrid.mainGrid[i, pos.col]._isPlayable) break;
                        if (initialGrid.mainGrid[i, pos.col]._piece != null &&
                            initialGrid.mainGrid[i, pos.col]._piece.piecePlayer.playerType ==
                            gs._piece.piecePlayer.playerType) break;
                        listPos.Add(new Position { row = i, col = pos.col });
                        if (initialGrid.mainGrid[i, pos.col]._piece != null) break;
                    }
                    // Movimientos hacia arriba
                    for (int i = pos.row - 1; i > pos.row - max - 1; i--)
                    {
                        if (i < 0 || !initialGrid.mainGrid[i, pos.col]._isPlayable) break;
                        if (initialGrid.mainGrid[i, pos.col]._piece != null &&
                            initialGrid.mainGrid[i, pos.col]._piece.piecePlayer.playerType ==
                            gs._piece.piecePlayer.playerType) break;
                        listPos.Add(new Position { row = i, col = pos.col });
                        if (initialGrid.mainGrid[i, pos.col]._piece != null) break;
                    }
                    // Movimientos hacia la izquierda
                    for (int i = pos.col - 1; i > pos.col - max - 1; i--)
                    {
                        if (i < 0 || !initialGrid.mainGrid[pos.row, i]._isPlayable) break;
                        if (initialGrid.mainGrid[pos.row, i]._piece != null &&
                            initialGrid.mainGrid[pos.row, i]._piece.piecePlayer.playerType ==
                            gs._piece.piecePlayer.playerType) break;
                        listPos.Add(new Position { row = pos.row, col = i });
                        if (initialGrid.mainGrid[pos.row, i]._piece != null) break;
                    }
                    // Movimientos hacia la derecha
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
                    Console.WriteLine("[getMoves] La pieza no puede moverse.");
                    returnCode = 20;
                }
            }
            else
            {
                Console.WriteLine("[getMoves] No hay pieza en la celda o la celda no es jugable.");
                returnCode = 30;
            }

            Console.WriteLine("[getMoves] Movimientos válidos:");
            foreach (Position p in listPos)
            {
                Console.WriteLine($"    ({p.row}, {p.col})");
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

        public int movePiece(Position now, Position next)
        {
            Console.WriteLine($"[movePiece] Intento de mover pieza desde ({now.row}, {now.col}) hacia ({next.row}, {next.col})");
            bool isAllowed = false;
            int returnValue;
            Piece nowPiece = initialGrid.mainGrid[now.row, now.col]._piece;
            Piece nextPiece = initialGrid.mainGrid[next.row, next.col]._piece;

            // Mostrar información de la pieza que se quiere mover
            Console.WriteLine($"[movePiece] Pieza a mover: {(nowPiece != null ? nowPiece.pieceName.ToString() : "Ninguna")}");

            // Verificar que la pieza corresponda al turno actual.
            if (nowPiece == null || nowPiece.piecePlayer.playerType != currentTurn)
            {
                Console.WriteLine("[movePiece] No es el turno de este jugador.");
                return 5; // Código para "no es tu turno"
            }

            List<Position> validMoves = getMoves(now, out returnValue);
            Console.WriteLine($"[movePiece] Código de retorno de getMoves: {returnValue}");

            foreach (Position p in validMoves)
            {
                Console.WriteLine($"[movePiece] Movimiento permitido: ({p.row}, {p.col})");
                if (p == next)
                    isAllowed = true;
            }

            if (!isAllowed)
            {
                Console.WriteLine("[movePiece] Movimiento no permitido: la posición destino no está entre los movimientos válidos.");
                return 0;
            }

            int result = 0;
            if (nextPiece == null)
            {
                Console.WriteLine("[movePiece] Movimiento a celda vacía.");
                updateMoveGrid(now, next);
                result = 1;
            }
            else
            {
                Console.WriteLine($"[movePiece] Celda destino contiene pieza: {nextPiece.pieceName}");
                if (nextPiece.piecePlayer.playerType != nowPiece.piecePlayer.playerType)
                {
                    if (nextPiece.pieceName == piecesTypes.Flag)
                    {
                        Console.WriteLine("[movePiece] Captura de bandera.");
                        updateWinGrid(now, next);
                        result = 50;
                    }
                    else if (nextPiece.pieceName == piecesTypes.Bomb && nowPiece.pieceName == piecesTypes.Miner)
                    {
                        Console.WriteLine("[movePiece] Desactivación de bomba por Minero.");
                        updateWinGrid(now, next);
                        result = 10;
                    }
                    else if (nextPiece.pieceName == piecesTypes.Marshal && nowPiece.pieceName == piecesTypes.Spy)
                    {
                        Console.WriteLine("[movePiece] Victoria del Espía contra el Mariscal.");
                        updateWinGrid(now, next);
                        result = 10;
                    }
                    else if ((int)nextPiece.pieceName == (int)nowPiece.pieceName)
                    {
                        Console.WriteLine("[movePiece] Empate entre piezas iguales.");
                        updateTieGrid(now, next);
                        result = 20;
                    }
                    else if ((int)nextPiece.pieceName > (int)nowPiece.pieceName)
                    {
                        Console.WriteLine("[movePiece] Derrota: pieza enemiga de mayor rango.");
                        updateLoseGrid(now, next);
                        result = 30;
                    }
                    else
                    {
                        Console.WriteLine("[movePiece] Victoria: pieza enemiga de menor rango.");
                        updateWinGrid(now, next);
                        result = 10;
                    }
                }
                else
                {
                    Console.WriteLine("[movePiece] Movimiento inválido: intento de mover sobre una pieza propia.");
                    return 4;
                }
            }

            // Si el movimiento se realizó correctamente, cambiamos el turno.
            if (result == 1 || result == 10 || result == 20 || result == 30 || result == 50)
            {
                currentTurn = (currentTurn == SpaceType.Player1) ? SpaceType.Player2 : SpaceType.Player1;
                Console.WriteLine("[movePiece] Turno cambiado a: " + currentTurn.ToString());
            }

            return result;
        }

        private void updateMoveGrid(Position p1, Position p2)
        {
            initialGrid.mainGrid[p2.row, p2.col]._piece = initialGrid.mainGrid[p1.row, p1.col]._piece;
            initialGrid.mainGrid[p1.row, p1.col]._piece = null;
        }
        private void updateWinGrid(Position p1, Position p2)
        {
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
