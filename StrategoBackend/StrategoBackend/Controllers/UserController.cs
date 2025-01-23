using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using StrategoBackend.Models.Database;
using StrategoBackend.Models.Database.Entities;
using StrategoBackend.Models.Dto;
using StrategoBackend.Recursos;
using System.IdentityModel.Tokens.Jwt;
namespace StrategoBackend.Controllers
{   
    [Route("api/[controller]")]
    [ApiController]
    public class UserController : ControllerBase
    {
        private MyDbContext _dbContext;
        private readonly PasswordHash passwordHash;
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

        [HttpPost("Register")]
        public async Task<IActionResult> Register([FromBody] UserRegisterDto user)
        {
            if (_dbContext.Users.Any(User => User.Nickname == user.Nickname))
            {
                return BadRequest("El nombre del usuario ya está en uso");
            }

            User newUser = new User()
            {
                Nickname = user.Nickname,
                Email = user.Email,
                Password = PasswordHash.Hash(user.Password),
              
            };

            await _dbContext.Users.AddAsync(newUser);
            await _dbContext.SaveChangesAsync();
            UserRegisterDto userCreated = ToDto(newUser);

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Expires = DateTime.UtcNow.AddDays(5),
                SigningCredentials = new SigningCredentials(
          _tokenParameters.IssuerSigningKey,
          SecurityAlgorithms.HmacSha256Signature)
            };

            JwtSecurityTokenHandler tokenHandler = new JwtSecurityTokenHandler();
            SecurityToken token = tokenHandler.CreateToken(tokenDescriptor);
            string accessToken = tokenHandler.WriteToken(token);

            return Ok(new { StringToken = accessToken });
        }

        [HttpPost("login")]
        public IActionResult Login([FromBody] UserLoginDto userLoginDto)
        {
            var user = _dbContext.Users.FirstOrDefault(u => u.Email == userLoginDto.Email);
            if (user == null)
            {
                return Unauthorized("Usuario no existe");
            }

            if (!PasswordHash.Hash(userLoginDto.Password).Equals(user.Password))
            {
                return Unauthorized("Contraseña incorrecta");
            }

            var tokenDescriptor = new SecurityTokenDescriptor
            {
               
                Expires = DateTime.UtcNow.AddDays(5),
                SigningCredentials = new SigningCredentials(
                    _tokenParameters.IssuerSigningKey,
                    SecurityAlgorithms.HmacSha256Signature)
            };

            JwtSecurityTokenHandler tokenHandler = new JwtSecurityTokenHandler();
            SecurityToken token = tokenHandler.CreateToken(tokenDescriptor);
            string accessToken = tokenHandler.WriteToken(token);

            return Ok(new { StringToken = accessToken, user.UserId });
        }
        private UserRegisterDto ToDto(User users)
        {
            return new UserRegisterDto()
            {
                UserId = users.UserId,
                Nickname = users.Nickname,
                Email = users.Email,
                Password = users.Password,
            };
        }
    }

    
}
