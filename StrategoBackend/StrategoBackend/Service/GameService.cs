using StrategoBackend.Game;
using StrategoBackend.Models.Database.Entities;
using StrategoBackend.Models.Dto;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;

namespace StrategoBackend.Service
{
    public class GameService
    {
        private ConcurrentDictionary<Guid, GameSession> _games = new ConcurrentDictionary<Guid, GameSession>();

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
            var boardRep = new List<List<PieceInfoDto>>();

            for (int r = 0; r < 10; r++)
            {
                var row = new List<PieceInfoDto>();
                for (int c = 0; c < 10; c++)
                {
                    var gs = session.Game.initialGrid.mainGrid[r, c];
                    var pieceInfo = new PieceInfoDto
                    {
                        Type = gs._type.ToString(),
                        IsPlayable = gs._isPlayable,
                        PieceName = gs._piece != null ? gs._piece.pieceName.ToString() : "None",
                        PlayerName = gs._piece != null ? gs._piece.piecePlayer.name : ""
                    };
                    row.Add(pieceInfo);
                }
                boardRep.Add(row);
            }

            return new GameStateDto { Board = boardRep, Status = "Partida en curso" };
        }

        // Mover una pieza en el tablero
        public int MovePiece(Guid gameId, MovePieceDto request)
        {
            if (!_games.TryGetValue(gameId, out var session)) return -1;

            Position from = new Position { row = request.FromRow, col = request.FromCol };
            Position to = new Position { row = request.ToRow, col = request.ToCol };

            return session.Game.movePiece(from, to);
        }

        // Eliminar una partida
        public bool EndGame(Guid gameId)
        {
            return _games.TryRemove(gameId, out _);
        }
    }
}
