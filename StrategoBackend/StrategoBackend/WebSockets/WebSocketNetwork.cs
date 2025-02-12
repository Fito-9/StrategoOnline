using System.Net.WebSockets;
using System.Text;
using System.IdentityModel.Tokens.Jwt;

namespace StrategoBackend.WebSockets;

public class WebSocketNetwork
{
    private readonly Dictionary<int, WebSocketHandler> _connectedUsers = new(); // Mapea userId a WebSocketHandler
    private readonly SemaphoreSlim _semaphore = new(1, 1);

    public async Task HandleAsync(WebSocket webSocket, int userId)
    {
        WebSocketHandler handler = await AddHandlerAsync(webSocket, userId);

        await NotifyUserConnectedAsync(userId);

        await handler.HandleAsync();

        await RemoveHandlerAsync(userId);
    }

    private async Task<WebSocketHandler> AddHandlerAsync(WebSocket webSocket, int userId)
    {
        await _semaphore.WaitAsync();

        var handler = new WebSocketHandler(userId, webSocket);
        _connectedUsers[userId] = handler;

        _semaphore.Release();
        return handler;
    }

    private async Task RemoveHandlerAsync(int userId)
    {
        await _semaphore.WaitAsync();

        if (_connectedUsers.ContainsKey(userId))
        {
            _connectedUsers.Remove(userId);
            await NotifyUserDisconnectedAsync(userId);
        }

        _semaphore.Release();
    }

    private async Task NotifyUserConnectedAsync(int userId)
    {
        string message = $"Conectado: {userId}";
        await BroadcastMessageAsync(message);
    }

    private async Task NotifyUserDisconnectedAsync(int userId)
    {
        string message = $"Desconectado: {userId}";
        await BroadcastMessageAsync(message);
    }

    private async Task BroadcastMessageAsync(string message)
    {
        await _semaphore.WaitAsync();

        var tasks = _connectedUsers.Values.Select(handler => handler.SendAsync(message));
        await Task.WhenAll(tasks);

        _semaphore.Release();
    }
    public List<int> GetConnectedUsers()
    {
        return _connectedUsers.Keys.ToList(); // Devuelve una lista de userIds conectados
    }
    public bool IsUserConnected(int userId)
    {
        return _connectedUsers.ContainsKey(userId);
    }
}
