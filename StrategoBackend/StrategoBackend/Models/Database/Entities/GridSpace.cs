using System.IO.Pipelines;

namespace StrategoBackend.Models.Database.Entities
{
    public struct GridSpace
    {
        public SpaceType _type { get; set; }
        public bool _isPlayable { get; set; }
        public Piece _piece { get; set; }
    }

    public enum SpaceType { Player1 = 1, Player2 = 2, Empty = 3, All = 4 }
}
