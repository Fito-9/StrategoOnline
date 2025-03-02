using System.Net.WebSockets;
using Microsoft.AspNetCore.Http;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
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
                int userId = 0;

                if (!string.IsNullOrEmpty(token))
                {
                    context.Request.Headers["Authorization"] = $"Bearer {token}";

                    // 🔥 Extraer el userId del token
                    userId = ExtractUserIdFromToken(token);
                }

                // Aceptamos la conexión WebSocket y pasamos el userId
                using WebSocket webSocket = await context.WebSockets.AcceptWebSocketAsync();
                await _webSocketNetwork.HandleAsync(webSocket, userId);
                return;
            }
            else
            {
                // Si no es WebSocket, pasar al siguiente middleware
                await next(context);
            }
        }

        // 🔥 Función para extraer userId del token JWT
        private int ExtractUserIdFromToken(string token)
        {
            try
            {
                var handler = new JwtSecurityTokenHandler();
                var jwtToken = handler.ReadJwtToken(token);

                // Extraer el userId del claim (nombre del claim puede variar según configuración del token)
                var userIdClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == "nameid")?.Value;

                return userIdClaim != null ? int.Parse(userIdClaim) : 0;
            }
            catch
            {
                return 0; // Si hay un error, retornar 0 (usuario no identificado)
            }
        }
    }
}