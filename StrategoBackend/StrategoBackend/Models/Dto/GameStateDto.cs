public class GameStateDto
{
    public List<List<PieceInfoDto>> Board { get; set; }
    public string Status { get; set; }
}

public class PieceInfoDto
{
    public string Type { get; set; }      
    public string PieceName { get; set; } 
    public string PlayerName { get; set; }
    public bool IsPlayable { get; set; }  
}