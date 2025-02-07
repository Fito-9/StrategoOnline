using System.Net.WebSockets;
using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;

namespace StrategoBackend.WebSockets
{
    public class WebSocketMiddleware : IMiddleware
    {
        private readonly WebSocketNetwork _webSocketNetwork;

        public WebSocketMiddleware(WebSocketNetwork webSocketNetwork)
        {
            _webSocketNetwork = webSocketNetwork;
        }

        public async Task InvokeAsync(HttpContext context, RequestDelegate next)
        {
            // Si la petición es WebSocket, proceder
            if (context.WebSockets.IsWebSocketRequest)
            {
                // Extraer el token de la query string y colocarlo en la cabecera
                string token = context.Request.Query["token"];
                if (!string.IsNullOrEmpty(token))
                {
                    context.Request.Headers["Authorization"] = $"Bearer {token}";
                }

                // Aceptamos la conexión WebSocket y la delegamos al servicio
                using WebSocket webSocket = await context.WebSockets.AcceptWebSocketAsync();
                await _webSocketNetwork.HandleAsync(webSocket);
                return; // Finalizamos aquí porque ya se manejó la conexión
            }
            else
            {
                // Si no es WebSocket, pasar al siguiente middleware
                await next(context);
            }
        }
    }
}