// File: WebSockets/WebSocketHandler.cs
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using StrategoBackend.Models.Dto;

namespace StrategoBackend.WebSockets
{
    public class WebSocketHandler : IDisposable
    {
        private const int BUFFER_SIZE = 4096;
        private readonly WebSocket _webSocket;
        private readonly byte[] _buffer;

        // Usamos el userId extraído del token para identificar la conexión
        public int UserId { get; }
        public bool IsOpen => _webSocket.State == WebSocketState.Open;

        // Eventos para notificar cuando se recibe un mensaje (ya convertido a DTO) y cuando se desconecta
        public event Func<WebSocketHandler, WebSocketMessageDto, Task> MessageReceived;
        public event Func<WebSocketHandler, Task> Disconnected;

        public WebSocketHandler(int userId, WebSocket webSocket)
        {
            UserId = userId;
            _webSocket = webSocket;
            _buffer = new byte[BUFFER_SIZE];
        }

        public async Task HandleAsync()
        {
            // Enviamos un mensaje de bienvenida usando el DTO
            await SendAsync(new WebSocketMessageDto { Type = "welcome", Payload = $"Bienvenido, tu id es {UserId}" });

            while (IsOpen)
            {
                string message = await ReadAsync();
                if (!string.IsNullOrWhiteSpace(message))
                {
                    WebSocketMessageDto messageDto;
                    try
                    {
                        messageDto = JsonSerializer.Deserialize<WebSocketMessageDto>(message);
                        if (messageDto == null)
                        {
                            messageDto = new WebSocketMessageDto { Type = "text", Payload = message };
                        }
                    }
                    catch
                    {
                        messageDto = new WebSocketMessageDto { Type = "text", Payload = message };
                    }

                    if (MessageReceived != null)
                    {
                        await MessageReceived.Invoke(this, messageDto);
                    }
                }
            }

            if (Disconnected != null)
            {
                await Disconnected.Invoke(this);
            }
        }

        private async Task<string> ReadAsync()
        {
            using var ms = new MemoryStream();
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
            } while (!result.EndOfMessage);

            return Encoding.UTF8.GetString(ms.ToArray());
        }

        // Método para enviar mensajes en forma de cadena JSON
        public async Task SendAsync(string message)
        {
            if (IsOpen)
            {
                var bytes = Encoding.UTF8.GetBytes(message);
                await _webSocket.SendAsync(new ArraySegment<byte>(bytes), WebSocketMessageType.Text, true, CancellationToken.None);
            }
        }

        // Sobrecarga para enviar mensajes usando el DTO (se serializa a JSON internamente)
        public async Task SendAsync(WebSocketMessageDto dto)
        {
            string json = JsonSerializer.Serialize(dto);
            await SendAsync(json);
        }

        public void Dispose()
        {
            _webSocket.Dispose();
        }
    }
}