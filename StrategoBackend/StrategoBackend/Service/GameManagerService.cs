    using System;
    using System.Collections.Concurrent;
    using System.Collections.Generic;
    using System.Linq;
    using StrategoBackend.Models.Database.Entities;
    using StrategoBackend.Service;

    namespace StrategoBackend.Services
    {
        public class GameManagerService
        {
            private readonly GameService _gameService;
            private ConcurrentDictionary<Guid, GameSession> _activeGames = new ConcurrentDictionary<Guid, GameSession>();
            private Queue<int> _matchmakingQueue = new Queue<int>();

            public GameManagerService(GameService gameService)
            {
                _gameService = gameService;
            }

            // Emparejar jugadores y crear partida
            public GameSession MatchPlayers(int player1Id, int player2Id)
            {
                Player player1 = new Player("Jugador" + player1Id, SpaceType.Player1, PlayerColor.Red);
                Player player2 = new Player("Jugador" + player2Id, SpaceType.Player2, PlayerColor.Blue);

                var gameId = _gameService.CreateGame(player1, player1Id, player2, player2Id);
                var session = _gameService.GetGameSession(gameId);

                _activeGames.TryAdd(gameId, session);
                return session;
            }

            // Obtener partida por ID
            public GameSession GetGameSession(Guid gameId)
            {
                _activeGames.TryGetValue(gameId, out var session);
                return session;
            }

            // Matchmaking en cola
            public void RequestMatchmaking(int playerId)
            {
                if (_matchmakingQueue.Count > 0)
                {
                    int opponentId = _matchmakingQueue.Dequeue();
                    var session = MatchPlayers(opponentId, playerId);
                    Console.WriteLine($"Partida creada: {session.GameId} entre {playerId} y {opponentId}");
                }
                else
                {
                    _matchmakingQueue.Enqueue(playerId);
                }
            }
        }
    }
