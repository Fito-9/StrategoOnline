using StrategoBackend.Game;
using StrategoBackend.Models.Database.Entities;
using StrategoBackend.Models.Dto;
using StrategoBackend.WebSockets;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
namespace StrategoBackend.Service
{
    public class GameService
    {
        private ConcurrentDictionary<Guid, GameSession> _games = new ConcurrentDictionary<Guid, GameSession>();
        private readonly WebSocketNetwork _webSocketNetwork;

        public GameService(WebSocketNetwork webSocketNetwork)
        {
            _webSocketNetwork = webSocketNetwork;
        }

        // Crear una nueva partida
        public Guid CreateGame(Player player1, int player1Id, Player player2, int player2Id)
        {
            var session = new GameSession(player1, player1Id, player2, player2Id);
            _games.TryAdd(session.GameId, session);
            return session.GameId;
        }

        // Obtener una partida
        public GameSession GetGameSession(Guid gameId)
        {
            _games.TryGetValue(gameId, out var session);
            return session;
        }

        // Colocar una pieza en el tablero
        public bool PlacePiece(Guid gameId, PiecePlacementDto request)
        {
            if (!_games.TryGetValue(gameId, out var session)) return false;
            List<Piece> pieces = request.PlayerId == session.Player1Id
                ? session.Game.player1Pieces
                : session.Game.player2Pieces;
            if (request.PieceIndex < 0 || request.PieceIndex >= pieces.Count) return false;
            Piece piece = pieces[request.PieceIndex];
            Position pos = new Position { row = request.Row, col = request.Col };
            return session.Game.setPieceOnGrid(piece, pos);
        }

        // Obtener el estado del juego
        public GameStateDto GetGameState(Guid gameId)
        {
            if (!_games.TryGetValue(gameId, out var session)) return null;

            var gameState = CreateGameStateDto(session);
            return gameState;
        }

        // MÃ©todo auxiliar para crear DTO del estado del juego
        private GameStateDto CreateGameStateDto(GameSession session)
        {
            var boardRep = new List<List<PieceInfoDto>>();
            for (int r = 0; r < 10; r++)
            {
                var row = new List<PieceInfoDto>();
                for (int c = 0; c < 10; c++)
                {
                    var gs = session.Game.initialGrid.mainGrid[r, c];
                    var pieceInfo = new PieceInfoDto
                    {
                        type = gs._type.ToString(),
                        isPlayable = gs._isPlayable,
                        pieceName = gs._piece != null ? gs._piece.pieceName.ToString() : "None",
                        playerName = gs._piece != null ? gs._piece.piecePlayer.name : ""
                    };
                    row.Add(pieceInfo);
                }
                boardRep.Add(row);
            }

            return new GameStateDto
            {
                Board = boardRep,
                Status = "Partida en curso",
                CurrentTurn = session.Game.currentTurn.ToString()
            };
        }

        // Mover una pieza en el tablero
        public int MovePiece(Guid gameId, MovePieceDto request)
        {
            if (!_games.TryGetValue(gameId, out var session)) return -1;
            Position from = new Position { row = request.FromRow, col = request.FromCol };
            Position to = new Position { row = request.ToRow, col = request.ToCol };
            int result = session.Game.movePiece(from, to);

            // Si el movimiento fue exitoso, notificar a los jugadores
            if (result == 1 || result == 10 || result == 20 || result == 30)
            {
                NotifyGameUpdate(session);
            }
            else if (result == 50) // Captura de bandera
            {
                NotifyGameUpdate(session);
                HandleFlagCapture(gameId);
            }

            return result;
        }


        // Notificar a los jugadores de cambios en el juego
        private void NotifyGameUpdate(GameSession session)
        {
            var gameState = CreateGameStateDto(session);
            var payload = new
            {
                gameId = session.GameId,
                board = gameState.Board,
                status = gameState.Status,
                currentTurn = gameState.CurrentTurn
            };

            _webSocketNetwork.SendMessageToUser(session.Player1Id, "gameUpdate", payload);
            _webSocketNetwork.SendMessageToUser(session.Player2Id, "gameUpdate", payload);
        }

        public void HandleFlagCapture(Guid gameId)
        {
            if (_games.TryGetValue(gameId, out var session))
            {
                // Determinar el ganador basado en qué jugador capturó la bandera
                var winnerPlayerType = session.Game.currentTurn == SpaceType.Player1
                    ? SpaceType.Player2
                    : SpaceType.Player1;

                // Notificar a los jugadores sobre el fin del juego
                var payload = new
                {
                    gameId = session.GameId,
                    status = "Fin del juego",
                    winner = winnerPlayerType.ToString(),
                    reason = "Bandera capturada"
                };

                _webSocketNetwork.SendMessageToUser(session.Player1Id, "gameEnd", payload);
                _webSocketNetwork.SendMessageToUser(session.Player2Id, "gameEnd", payload);

                //Eliminar la partida de la lista de juegos activos
                EndGame(gameId);
            }
        }


        // Eliminar una partida
        public bool EndGame(Guid gameId)
        {
            return _games.TryRemove(gameId, out _);
        }
    }
}