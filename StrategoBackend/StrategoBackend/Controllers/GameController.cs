using Microsoft.AspNetCore.Mvc;
using StrategoBackend.Models.Dto;
using StrategoBackend.Service;
using StrategoBackend.Services;
using System;

namespace StrategoBackend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class GameController : ControllerBase
    {
        private readonly GameService _gameService;
        private readonly GameManagerService _gameManagerService;

        public GameController(GameService gameService, GameManagerService gameManagerService)
        {
            _gameService = gameService;
            _gameManagerService = gameManagerService;
        }

        [HttpPost("matchmaking")]
        public IActionResult StartMatchmaking([FromQuery] int playerId)
        {
            _gameManagerService.RequestMatchmaking(playerId);
            return Ok(new { Message = "Buscando partida..." });
        }

        [HttpGet("game-state")]
        public IActionResult GetGameState([FromQuery] Guid gameId)
        {
            var gameState = _gameService.GetGameState(gameId);
            return gameState == null ? NotFound("Partida no encontrada") : Ok(gameState);
        }

        [HttpPost("place-piece")]
        public IActionResult PlacePiece([FromQuery] Guid gameId, [FromBody] PiecePlacementDto request)
        {
            return _gameService.PlacePiece(gameId, request)
                ? Ok(new { Message = "Pieza colocada correctamente" })
                : BadRequest("No se pudo colocar la pieza.");
        }

        [HttpPost("move-piece")]
        public IActionResult MovePiece([FromQuery] Guid gameId, [FromBody] MovePieceDto request)
        {
            int result = _gameService.MovePiece(gameId, request);
            return result == -1 ? NotFound("Partida no encontrada") : Ok(new { Result = result });
        }
    }
}
