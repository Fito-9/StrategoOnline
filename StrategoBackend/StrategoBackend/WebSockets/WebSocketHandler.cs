using System.Net.WebSockets;
using System.Text;

namespace StrategoBackend.WebSockets
{
    public class WebSocketHandler : IDisposable
    {
        private const int BUFFER_SIZE = 4096;
        private readonly WebSocket _webSocket;
        private readonly byte[] _buffer;

        public int Id { get; init; }
        public bool IsOpen => _webSocket.State == WebSocketState.Open;

        public event Func<WebSocketHandler, string, Task> MessageReceived;
        public event Func<WebSocketHandler, Task> Disconnected;

        public WebSocketHandler(int id, WebSocket webSocket)
        {
            Id = id;
            _webSocket = webSocket;
            _buffer = new byte[BUFFER_SIZE];
        }

        public async Task HandleAsync()
        {
            // Envía un mensaje inicial para notificar que se ha conectado
            await SendAsync($"Bienvenido, tu id es {Id}");

            while (IsOpen)
            {
                string message = await ReadAsync();
                if (!string.IsNullOrWhiteSpace(message) && MessageReceived != null)
                {
                    await MessageReceived.Invoke(this, message);
                }
            }

            if (Disconnected != null)
            {
                await Disconnected.Invoke(this);
            }
        }

        private async Task<string> ReadAsync()
        {
            using MemoryStream ms = new MemoryStream();
            WebSocketReceiveResult result;
            do
            {
                result = await _webSocket.ReceiveAsync(new ArraySegment<byte>(_buffer), CancellationToken.None);
                if (result.MessageType == WebSocketMessageType.Text)
                {
                    ms.Write(_buffer, 0, result.Count);
                }
                else if (result.CloseStatus.HasValue)
                {
                    await _webSocket.CloseAsync(result.CloseStatus.Value, result.CloseStatusDescription, CancellationToken.None);
                }
            }
            while (!result.EndOfMessage);

            return Encoding.UTF8.GetString(ms.ToArray());
        }

        public async Task SendAsync(string message)
        {
            if (IsOpen)
            {
                byte[] bytes = Encoding.UTF8.GetBytes(message);
                await _webSocket.SendAsync(new ArraySegment<byte>(bytes), WebSocketMessageType.Text, true, CancellationToken.None);
            }
        }

        public void Dispose()
        {
            _webSocket.Dispose();
        }
    }
}