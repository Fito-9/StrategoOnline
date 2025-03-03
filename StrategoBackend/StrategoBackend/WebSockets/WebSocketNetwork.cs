using StrategoBackend.Models.Dto;
using StrategoBackend.Services;
using System.Net.WebSockets;
using Microsoft.Extensions.DependencyInjection;

namespace StrategoBackend.WebSockets
{
    public class WebSocketNetwork
    {
        private readonly Dictionary<int, WebSocketHandler> _handlers = new Dictionary<int, WebSocketHandler>();
        private readonly SemaphoreSlim _semaphore = new SemaphoreSlim(1, 1);
        private readonly Queue<int> _matchmakingQueue = new Queue<int>();
        private readonly IServiceProvider _serviceProvider;

        public WebSocketNetwork(IServiceProvider serviceProvider)
        {
            _serviceProvider = serviceProvider;
        }

        public async Task HandleAsync(WebSocket webSocket, int userId)
        {
            WebSocketHandler handler = await AddHandlerAsync(webSocket, userId);
            await BroadcastOnlineUsersAsync();
            await handler.HandleAsync();
        }

        private async Task<WebSocketHandler> AddHandlerAsync(WebSocket webSocket, int userId)
        {
            await _semaphore.WaitAsync();
            var handler = new WebSocketHandler(userId, webSocket);
            handler.MessageReceived += OnMessageReceivedAsync;
            handler.Disconnected += OnDisconnectedAsync;
            _handlers[userId] = handler;
            _semaphore.Release();
            return handler;
        }

        private async Task OnDisconnectedAsync(WebSocketHandler handler)
        {
            await _semaphore.WaitAsync();
            if (_handlers.ContainsKey(handler.UserId))
            {
                _handlers.Remove(handler.UserId);
                RemoveFromMatchmakingQueue(handler.UserId);
            }
            _semaphore.Release();
            await BroadcastOnlineUsersAsync();
        }

        private async Task OnMessageReceivedAsync(WebSocketHandler handler, WebSocketMessageDto message)
        {
            switch (message.Type)
            {
                case "matchmakingRequest":
                    await HandleMatchmakingRequest(handler);
                    break;
                default:
                    await BroadcastMessageAsync(new WebSocketMessageDto
                    {
                        Type = "broadcast",
                        Payload = $"Usuario {handler.UserId} dice: {message.Payload}"
                    });
                    break;
            }
        }

        private async Task HandleMatchmakingRequest(WebSocketHandler handler)
        {
            await _semaphore.WaitAsync();

            if (_matchmakingQueue.Contains(handler.UserId))
            {
                _semaphore.Release();
                return;
            }

            if (_matchmakingQueue.Count > 0)
            {
                int opponentId = _matchmakingQueue.Dequeue();

                if (_handlers.ContainsKey(opponentId))
                {
                    using (var scope = _serviceProvider.CreateScope())
                    {
                        var gameManagerService = scope.ServiceProvider.GetRequiredService<GameManagerService>();
                        var gameSession = gameManagerService.MatchPlayers(opponentId, handler.UserId);

                        var matchMessage = new WebSocketMessageDto
                        {
                            Type = "matchFound",
                            Payload = new
                            {
                                opponentId = handler.UserId,
                                gameId = gameSession.GameId,
                                player1Id = gameSession.Player1Id,
                                player2Id = gameSession.Player2Id
                            }
                        };

                        // Enviar información a ambos jugadores
                        if (_handlers.TryGetValue(opponentId, out var opponentHandler))
                        {
                            await opponentHandler.SendAsync(matchMessage);
                        }

                        await handler.SendAsync(matchMessage);
                    }
                }
                else
                {
                    _matchmakingQueue.Enqueue(handler.UserId);
                    await handler.SendAsync(new WebSocketMessageDto
                    {
                        Type = "waitingForMatch",
                        Payload = "Esperando oponente..."
                    });
                }
            }
            else
            {
                _matchmakingQueue.Enqueue(handler.UserId);
                await handler.SendAsync(new WebSocketMessageDto
                {
                    Type = "waitingForMatch",
                    Payload = "Esperando oponente..."
                });
            }

            _semaphore.Release();
        }

        private void RemoveFromMatchmakingQueue(int userId)
        {
            if (_matchmakingQueue.Contains(userId))
            {
                var newQueue = new Queue<int>(_matchmakingQueue.Where(id => id != userId));
                _matchmakingQueue.Clear();
                foreach (var id in newQueue)
                {
                    _matchmakingQueue.Enqueue(id);
                }
            }
        }

        private async Task BroadcastOnlineUsersAsync()
        {
            var onlineUserIds = _handlers.Keys.ToList();
            var dto = new WebSocketMessageDto
            {
                Type = "onlineUsers",
                Payload = onlineUserIds
            };
            await BroadcastMessageAsync(dto);
        }

        private async Task BroadcastMessageAsync(WebSocketMessageDto message)
        {
            await _semaphore.WaitAsync();
            var tasks = _handlers.Values.Select(handler => handler.SendAsync(message));
            await Task.WhenAll(tasks);
            _semaphore.Release();
        }
        public List<int> GetConnectedUsers()
        {
            return _handlers.Keys.ToList();
        }

        public bool IsUserConnected(int userId)
        {
            return _handlers.ContainsKey(userId);
        }
    
    // Método para enviar un mensaje a un usuario específico
    public async Task SendMessageToUser(int userId, string messageType, object payload)
        {
            await _semaphore.WaitAsync();
            try
            {
                if (_handlers.TryGetValue(userId, out var handler))
                {
                    var message = new WebSocketMessageDto
                    {
                        Type = messageType,
                        Payload = payload
                    };
                    await handler.SendAsync(message);
                }
                else
                {
                    Console.WriteLine($"Usuario {userId} no está conectado actualmente.");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error al enviar mensaje al usuario {userId}: {ex.Message}");
            }
            finally
            {
                _semaphore.Release();
            }
        }
    }
}