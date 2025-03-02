namespace StrategoBackend.Models.Dto
{
    public class GameStateDto
    {
        public List<List<string>> Board { get; set; }
        public string Status { get; set; }
    }
}
