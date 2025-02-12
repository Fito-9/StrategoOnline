using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using StrategoBackend.WebSockets;
using System.IdentityModel.Tokens.Jwt;
using System.Net.WebSockets;

namespace StrategoBackend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class WebSocketController : ControllerBase
    {

        private readonly WebSocketNetwork _webSocketNetwork;

        public WebSocketController(WebSocketNetwork webSocketNetwork)
        {
            _webSocketNetwork = webSocketNetwork;
        }

        [HttpGet]
        public async Task<IActionResult> ConnectAsync()
        {
            if (!HttpContext.WebSockets.IsWebSocketRequest)
            {
                return BadRequest("Solicitud WebSocket inválida.");
            }

            string token = HttpContext.Request.Query["token"];

            if (string.IsNullOrEmpty(token))
            {
                return BadRequest("Token no proporcionado.");
            }

            int? userId = GetUserIdFromToken(token);
            if (!userId.HasValue)
            {
                return Unauthorized("Token inválido.");
            }

            WebSocket webSocket = await HttpContext.WebSockets.AcceptWebSocketAsync();
            await _webSocketNetwork.HandleAsync(webSocket, userId.Value);

            return Ok();
        }

        private int? GetUserIdFromToken(string token)
        {
            try
            {
                var handler = new JwtSecurityTokenHandler();
                var jwtToken = handler.ReadJwtToken(token);
                var userIdClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == "nameid")?.Value;

                if (int.TryParse(userIdClaim, out int userId))
                {
                    return userId;
                }
            }
            catch (Exception)
            {
                return null;
            }

            return null;
        }
    }
}
