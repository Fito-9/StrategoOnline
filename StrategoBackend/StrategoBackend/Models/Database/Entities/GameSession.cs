using StrategoBackend.Game;

namespace StrategoBackend.Models.Database.Entities
{
    public class GameSession
    {
        public Guid GameId { get; private set; }
        public int Player1Id { get; private set; }
        public int Player2Id { get; private set; }
        public SpaceType currentTurn { get; set; }

        public StrategoGame Game { get; private set; }  // Instancia de la partida

        public GameSession(Player player1, int player1Id, Player player2, int player2Id)
        {
            GameId = Guid.NewGuid();
            Player1Id = player1Id;
            Player2Id = player2Id;
            Game = new StrategoGame(player1, player2); // Crear la partida correctamente
        }
    }
}
