using System.Net.WebSockets;

namespace StrategoBackend.WebSockets;

    public class WebSocketNetwork
{
    // Contador para asignar un ID único a cada conexión
    private static int _idCounter = 1;

    // Lista de handlers activos
    private readonly List<WebSocketHandler> _handlers = new List<WebSocketHandler>();

    // Semáforo para acceso seguro a la lista
    private readonly SemaphoreSlim _semaphore = new SemaphoreSlim(1, 1);

    public async Task HandleAsync(WebSocket webSocket)
    {
        // Creamos y agregamos el handler
        WebSocketHandler handler = await AddHandlerAsync(webSocket);

        // Notificar a todos los usuarios conectados que se ha conectado un nuevo usuario
        await NotifyUserConnectedAsync(handler);

        // Manejar la conexión (leer mensajes, etc.)
        await handler.HandleAsync();

        // Cuando se desconecta, removemos el handler y notificamos
        await RemoveHandlerAsync(handler);
    }

    private async Task<WebSocketHandler> AddHandlerAsync(WebSocket webSocket)
    {
        await _semaphore.WaitAsync();
        var handler = new WebSocketHandler(_idCounter, webSocket);
        _handlers.Add(handler);
        _idCounter++;
        _semaphore.Release();
        return handler;
    }

    private async Task RemoveHandlerAsync(WebSocketHandler handler)
    {
        await _semaphore.WaitAsync();
        _handlers.Remove(handler);
        _semaphore.Release();
        await NotifyUserDisconnectedAsync(handler);
    }

    private Task NotifyUserConnectedAsync(WebSocketHandler newHandler)
    {
        // Envía un mensaje a todos los conectados
        string message = $"Conectado: {newHandler.Id}";
        return BroadcastMessageAsync(message);
    }

    private Task NotifyUserDisconnectedAsync(WebSocketHandler handler)
    {
        string message = $"Desconectado: {handler.Id}";
        return BroadcastMessageAsync(message);
    }

    public async Task BroadcastMessageAsync(string message)
    {
        await _semaphore.WaitAsync();
        var tasks = _handlers.Select(h => h.SendAsync(message));
        await Task.WhenAll(tasks);
        _semaphore.Release();
    }
}