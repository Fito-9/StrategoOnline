public class GameStateDto
{
    public List<List<PieceInfoDto>> Board { get; set; }
    public string Status { get; set; }
    public string CurrentTurn { get; set; }
}

public class PieceInfoDto
{
    public string type { get; set; }
    public string pieceName {    get; set; }
    public string playerName { get; set; }
    public bool isPlayable { get; set; }
}