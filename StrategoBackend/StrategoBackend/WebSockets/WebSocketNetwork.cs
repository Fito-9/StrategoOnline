using StrategoBackend.Models.Dto;
using System.Net.WebSockets;

namespace StrategoBackend.WebSockets
{
    public class WebSocketNetwork
    {
        // Diccionario de conexiones activas (userId -> handler)
        private readonly Dictionary<int, WebSocketHandler> _handlers = new Dictionary<int, WebSocketHandler>();
        private readonly SemaphoreSlim _semaphore = new SemaphoreSlim(1, 1);

        // Cola para el matchmaking (almacena userIds esperando partida)
        private readonly Queue<int> _matchmakingQueue = new Queue<int>();

        public async Task HandleAsync(WebSocket webSocket, int userId)
        {
            // Añadimos el nuevo handler y suscribimos a sus eventos
            WebSocketHandler handler = await AddHandlerAsync(webSocket, userId);

            // Enviamos la lista actualizada de usuarios conectados
            await BroadcastOnlineUsersAsync();

            // Esperamos y procesamos los mensajes de este handler
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
                // Si el usuario estaba esperando en matchmaking, lo quitamos
                RemoveFromMatchmakingQueue(handler.UserId);
            }
            _semaphore.Release();

            // Actualizamos la lista de usuarios conectados
            await BroadcastOnlineUsersAsync();
        }

        // Procesa los mensajes recibidos según su tipo
        private async Task OnMessageReceivedAsync(WebSocketHandler handler, WebSocketMessageDto message)
        {
            switch (message.Type)
            {
                case "matchmakingRequest":
                    await HandleMatchmakingRequest(handler);
                    break;
                // Aquí puedes agregar otros tipos, por ejemplo "friendRequest", "chat", etc.
                default:
                    // Por defecto, realizamos un broadcast del mensaje recibido
                    await BroadcastMessageAsync(new WebSocketMessageDto
                    {
                        Type = "broadcast",
                        Payload = $"Usuario {handler.UserId} dice: {message.Payload}"
                    });
                    break;
            }
        }

        // Gestiona la solicitud de matchmaking
        private async Task HandleMatchmakingRequest(WebSocketHandler handler)
        {
            await _semaphore.WaitAsync();
            // Si el usuario ya está en cola, no hacemos nada
            if (_matchmakingQueue.Contains(handler.UserId))
            {
                _semaphore.Release();
                return;
            }

            if (_matchmakingQueue.Count > 0)
            {
                // Hay al menos un jugador esperando: hacemos match
                int opponentId = _matchmakingQueue.Dequeue();
                if (_handlers.ContainsKey(opponentId))
                {
                    // Se envía a ambos el mensaje de match encontrado
                    var matchInfo = new { player1 = opponentId, player2 = handler.UserId };
                    if (_handlers.TryGetValue(opponentId, out var opponentHandler))
                    {
                        await opponentHandler.SendAsync(new WebSocketMessageDto
                        {
                            Type = "matchFound",
                            Payload = new { opponentId = handler.UserId }
                        });
                    }
                    await handler.SendAsync(new WebSocketMessageDto
                    {
                        Type = "matchFound",
                        Payload = new { opponentId = opponentId }
                    });
                }
                else
                {
                    // Si por alguna razón el oponente ya no está conectado, se reincorpora el actual a la cola
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
                // No hay nadie esperando: agregamos al usuario a la cola de matchmaking
                _matchmakingQueue.Enqueue(handler.UserId);
                await handler.SendAsync(new WebSocketMessageDto
                {
                    Type = "waitingForMatch",
                    Payload = "Esperando oponente..."
                });
            }
            _semaphore.Release();
        }

        // Elimina un usuario de la cola de matchmaking (si estaba esperando)
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

        // Envía a todos la lista actualizada de usuarios conectados
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

        // Envía un mensaje (DTO) a todas las conexiones activas
        private async Task BroadcastMessageAsync(WebSocketMessageDto message)
        {
            await _semaphore.WaitAsync();
            var tasks = _handlers.Values.Select(handler => handler.SendAsync(message));
            await Task.WhenAll(tasks);
            _semaphore.Release();
        }

        // Métodos auxiliares para consultar el estado
        public List<int> GetConnectedUsers()
        {
            return _handlers.Keys.ToList();
        }

        public bool IsUserConnected(int userId)
        {
            return _handlers.ContainsKey(userId);
        }
    }
}