using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using StrategoBackend.Models.Dto;
using StrategoBackend.Services;

namespace StrategoBackend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class FriendshipController : ControllerBase
    {
        private readonly FriendshipService _friendshipService;

        public FriendshipController(FriendshipService friendshipService)
        {
            _friendshipService = friendshipService;
        }

        [HttpPost("send-request")]
        public async Task<IActionResult> SendFriendRequest([FromBody] FriendRequestDto request)
        {
            await _friendshipService.SendFriendRequest(request.SenderId, request.ReceiverId);
            return Ok(new { Message = "Solicitud de amistad enviada" });
        }

        [HttpPost("accept-request")]
        public async Task<IActionResult> AcceptFriendRequest([FromBody] FriendRequestDto request)
        {
            await _friendshipService.AcceptFriendRequest(request.SenderId, request.ReceiverId);
            return Ok(new { Message = "Solicitud de amistad aceptada" });
        }

        [HttpPost("reject-request")]
        public async Task<IActionResult> RejectFriendRequest([FromBody] FriendRequestDto request)
        {
            await _friendshipService.RejectFriendRequest(request.SenderId, request.ReceiverId);
            return Ok(new { Message = "Solicitud de amistad rechazada" });
        }


        [HttpGet("friends/{userId}")]
        public async Task<IActionResult> GetFriends(int userId)
        {
            var friends = await _friendshipService.GetFriends(userId);
            return Ok(friends);
        }
    }
}