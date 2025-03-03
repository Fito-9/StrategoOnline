    namespace StrategoBackend.Models.Dto
    {
        public class PiecePlacementDto
        {
            public int PlayerId { get; set; }
            public int PieceIndex { get; set; } 
            public int Row { get; set; }
            public int Col { get; set; }
        }
    }
