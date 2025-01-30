namespace StrategoBackend.Models.Dto
{
    public class UserRegisterDto
    {
        public int UserId { get; set; }
        public string Nickname { get; set; }
        public string Password { get; set; }
        public string Email { get; set; }
        public IFormFile? Ruta { get; set; }
    }
}
