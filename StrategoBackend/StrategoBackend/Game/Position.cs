namespace StrategoBackend.Game
{
    public class Position
    {
        private int _row, _col;
        public int row
        {
            get { return _row; }
            set
            {
                _row = value;
                if (value > 9) _row = 9;
                if (value < 0) _row = 0;
            }
        }
        public int col
        {
            get { return _col; }
            set
            {
                _col = value;
                if (value > 9) _col = 9;
                if (value < 0) _col = 0;
            }
        }

        public static bool operator ==(Position p1, Position p2)
        {
            return p1.col == p2.col && p1.row == p2.row;
        }
        public static bool operator !=(Position p1, Position p2)
        {
            return !(p1 == p2);
        }
    }
}
