using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using StrategoBackend.Models.Database;
using StrategoBackend.Models.Database.Entities;
using StrategoBackend.Models.Dto;
using StrategoBackend.Recursos;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace StrategoBackend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserController : ControllerBase
    {
        private readonly MyDbContext _dbContext;
        private readonly TokenValidationParameters _tokenParameters;

        public UserController(MyDbContext dbContext, TokenValidationParameters tokenParameters)
        {
            _dbContext = dbContext;
            _tokenParameters = tokenParameters;
        }

        [HttpGet]
        public IEnumerable<User> GetUsers()
        {
            return _dbContext.Users;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromForm] UserRegisterDto userDto)
        {
            if (_dbContext.Users.Any(u => u.Nickname == userDto.Nickname))
                return BadRequest("El nombre del usuario ya está en uso");

            string? avatarPath = null;
            if (userDto.Ruta != null && userDto.Ruta.Length > 0)
            {
                var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot/uploads");
                if (!Directory.Exists(uploadsFolder))
                    Directory.CreateDirectory(uploadsFolder);

                string uniqueFileName = $"{Guid.NewGuid()}_{Path.GetFileName(userDto.Ruta.FileName)}";
                avatarPath = Path.Combine("uploads", uniqueFileName);
                string fullPath = Path.Combine(uploadsFolder, uniqueFileName);

                using (var fileStream = new FileStream(fullPath, FileMode.Create))
                {
                    await userDto.Ruta.CopyToAsync(fileStream);
                }
            }

            var newUser = new User
            {
                Nickname = userDto.Nickname,
                Email = userDto.Email,
                Password = PasswordHash.Hash(userDto.Password),
                Ruta = avatarPath // Guarda la ruta en la base de datos
            };

            await _dbContext.Users.AddAsync(newUser);
            await _dbContext.SaveChangesAsync();

            return Ok(new { Message = "Usuario registrado con éxito", Avatar = avatarPath });
        }

        [HttpPost("login")]
        public IActionResult Login([FromBody] UserLoginDto userLoginDto)
        {
            var user = _dbContext.Users.FirstOrDefault(u => u.Email == userLoginDto.Email);
            if (user == null)
                return Unauthorized("Usuario no existe");

            if (!PasswordHash.Hash(userLoginDto.Password).Equals(user.Password))
                return Unauthorized("Contraseña incorrecta");

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
            new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
            new Claim(ClaimTypes.Name, user.Nickname)
        }),
                Expires = DateTime.UtcNow.AddDays(5),
                SigningCredentials = new SigningCredentials(
                    _tokenParameters.IssuerSigningKey,
                    SecurityAlgorithms.HmacSha256Signature)
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var token = tokenHandler.CreateToken(tokenDescriptor);
            var accessToken = tokenHandler.WriteToken(token);

            string avatarUrl = string.IsNullOrEmpty(user.Ruta)
                ? null
                : $"{Request.Scheme}://{Request.Host}/" + user.Ruta;

            return Ok(new { AccessToken = accessToken, UserId = user.UserId, Avatar = avatarUrl });
        }

    }
}
