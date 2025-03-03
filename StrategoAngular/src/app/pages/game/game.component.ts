import { Component, Input, OnInit } from '@angular/core';
import { GameService } from '../../services/game.service';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';

interface Piece {
  index: number;
  pieceName: string;
  isPlaced: boolean;
  count?: number;
  type?: string;
  row?: number;
  col?: number;
}

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css']
})
export class GameComponent implements OnInit {
  @Input() gameId!: string;
  board: any[][] = [];
  pieces: Piece[] = [];
  playerId: number = 1;
  gamePhase: string = 'setup';  // Setup phase to place pieces
  currentPieceIndex: number = 0;  // Index to track which piece to place next
  selectedPiece: Piece | null = null; // Selected piece for movement
  currentPlayer: number = 1; // Control turns (1 = blue, 2 = red)
  highlightedCells: {row: number, col: number}[] = []; // Mark valid moves

  constructor(private gameService: GameService, private route: ActivatedRoute) {}

  ngOnInit(): void {
    if (!this.gameId) {
      this.gameId = this.route.snapshot.paramMap.get('id') || '';
    }
    this.loadGameState();
    
    // Update game state every 5 seconds if it's not our turn
    setInterval(() => {
      this.refreshGameState();
    }, 5000);
  }

  refreshGameState(): void {
    // Only update if we're in play phase and it's not our turn
    if (this.gamePhase === 'play' && this.currentPlayer !== this.playerId) {
      this.gameService.getGameState(this.gameId).subscribe(
        response => {
          if (response && response.board) {
            this.board = response.board;
            this.currentPlayer = response.currentPlayer || 1;
            
            // Update piece positions
            if (response.pieces && response.pieces.length > 0) {
              this.pieces = response.pieces.map((piece: any, index: number) => ({
                ...piece,
                index: index,
                isPlaced: piece.isPlaced || false
              }));
            }
          }
        }
      );
    }
  }

  loadGameState(): void {
    this.gameService.getGameState(this.gameId).subscribe(
      response => {
        if (response && response.board) {
          this.board = response.board;
          if (response.pieces && response.pieces.length > 0) {
            this.pieces = response.pieces.map((piece: any, index: number) => ({
              ...piece,
              index: index,
              isPlaced: piece.isPlaced || false
            }));
          } else {
            this.pieces = this.initializePieces();
          }
          this.gamePhase = this.pieces.every(p => p.isPlaced) ? 'play' : 'setup';
          
          // Initialize currentPlayer if in play phase
          if (this.gamePhase === 'play') {
            this.currentPlayer = response.currentPlayer || 1;
          }
        } else {
          this.pieces = this.initializePieces();
        }
      },
      error => {
        console.error('Error loading game state:', error);
        this.pieces = this.initializePieces();
      }
    );
  }

  initializePieces(): Piece[] {
    const pieceCounts: { [key: string]: number } = {
      'Marshal': 1, 'General': 1, 'Colonel': 2, 'Major': 3, 'Captain': 4,
      'Lieutenant': 4, 'Sergeant': 4, 'Miner': 5, 'Scout': 8, 'Spy': 1,
      'Bomb': 6, 'Flag': 1
    };
    const pieces: Piece[] = [];
    let index = 0;

    for (const [pieceName, count] of Object.entries(pieceCounts)) {
      for (let i = 0; i < count; i++) {
        pieces.push({
          index: index++,
          pieceName: pieceName,
          isPlaced: false
        });
      }
    }
    return pieces;
  }

  // Get piece display for cell
  getPieceAt(row: number, col: number): string {
    if (!this.board || !this.board[row] || !this.board[row][col]) return '';
    const cell = this.board[row][col];
    if (!cell) return '';
    if (cell.pieceName && cell.pieceName !== 'None') {
      const icon = this.getPieceIcon(cell.pieceName);
      return icon;
    }
    if (!cell.isPlayable) return '💧';
    return '';
  }

  // Check if a cell contains a piece
  isPieceAtCell(row: number, col: number): boolean {
    if (!this.board || !this.board[row] || !this.board[row][col]) return false;
    const cell = this.board[row][col];
    return cell && cell.pieceName && cell.pieceName !== 'None';
  }

  // Get icon for piece type
  getPieceIcon(pieceName: string): string {
    switch (pieceName) {
      case 'Marshal': return '⭐';
      case 'General': return 'G';
      case 'Colonel': return 'C';
      case 'Major': return 'M';
      case 'Captain': return 'Cap';
      case 'Lieutenant': return 'Li';
      case 'Sergeant': return '✵';
      case 'Miner': return '⛏️';
      case 'Scout': return '🔍';
      case 'Spy': return '🕵️';
      case 'Bomb': return '💣';
      case 'Flag': return '🏁';
      default: return '?';
    }
  }

  // Handle click on a board cell
  handleCellClick(row: number, col: number): void {
    console.log(`Cell clicked: (${row}, ${col})`);
    
    if (this.gamePhase === 'setup') {
      this.handlePiecePlacement(row, col);
    } else if (this.gamePhase === 'play') {
      // Check if it's current player's turn
      if (this.playerId !== this.currentPlayer) {
        console.log('Not your turn');
        return;
      }
      
      // If there's a piece in the cell and no piece is selected, select it
      if (!this.selectedPiece && this.isPieceAtCell(row, col)) {
        const cell = this.board[row][col];
        // Check if the piece belongs to the current player
        if ((this.playerId === 1 && cell.type === 'Player1') || 
            (this.playerId === 2 && cell.type === 'Player2')) {
          
          // Find corresponding piece in the pieces array
          const pieceIndex = this.pieces.findIndex(p => 
            p.row === row && p.col === col && p.pieceName === cell.pieceName);
          
          if (pieceIndex >= 0) {
            this.selectedPiece = this.pieces[pieceIndex];
            console.log(`Selected piece: ${this.selectedPiece.pieceName} at (${row}, ${col})`);
            this.highlightValidMoves(this.selectedPiece);
          }
        }
      } 
      // If a piece is already selected and another cell is clicked, try to move
      else if (this.selectedPiece) {
        // If clicked on the same cell, deselect
        if (this.selectedPiece.row === row && this.selectedPiece.col === col) {
          this.selectedPiece = null;
          this.highlightedCells = [];
          console.log('Piece deselected');
        } else {
          // Try to move the piece
          this.movePiece(this.selectedPiece, row, col);
        }
      }
    }
  }

  // Highlight valid moves for selected piece
  highlightValidMoves(piece: Piece): void {
    this.highlightedCells = [];
    
    if (!piece.row || !piece.col || piece.pieceName === 'Bomb' || piece.pieceName === 'Flag') {
      return;
    }
    
    // For regular pieces: only orthogonal moves of 1 square
    if (piece.pieceName !== 'Scout') {
      const directions = [
        { row: -1, col: 0 },  // Up
        { row: 1, col: 0 },   // Down
        { row: 0, col: -1 },  // Left
        { row: 0, col: 1 }    // Right
      ];
      
      for (const dir of directions) {
        const newRow = piece.row + dir.row;
        const newCol = piece.col + dir.col;
        
        if (this.isValidMove(piece, newRow, newCol)) {
          this.highlightedCells.push({ row: newRow, col: newCol });
        }
      }
    } else {
      // For scouts: can move multiple squares in a straight line
      const directions = [
        { row: -1, col: 0 },  // Up
        { row: 1, col: 0 },   // Down
        { row: 0, col: -1 },  // Left
        { row: 0, col: 1 }    // Right
      ];
      
      for (const dir of directions) {
        let newRow = piece.row + dir.row;
        let newCol = piece.col + dir.col;
        
        while (
          newRow >= 0 && newRow < this.board.length && 
          newCol >= 0 && newCol < this.board[0].length
        ) {
          if (this.isValidMove(piece, newRow, newCol)) {
            this.highlightedCells.push({ row: newRow, col: newCol });
            
            // Stop if there's an enemy piece
            if (this.isPieceAtCell(newRow, newCol)) {
              break;
            }
          } else {
            break;
          }
          
          newRow += dir.row;
          newCol += dir.col;
        }
      }
    }
  }

  // Check if a cell is highlighted for movement
  isCellHighlighted(row: number, col: number): boolean {
    return this.highlightedCells.some(cell => cell.row === row && cell.col === col);
  }

  // Handle piece placement during setup phase
  handlePiecePlacement(row: number, col: number): void {
    // Check if coordinates are within board bounds
    if (row < 0 || row >= 10 || col < 0 || col >= 10) {
      console.log('Coordinates out of board bounds');
      return;
    }
    
    // Check if the cell is playable
    if (!this.board[row][col] || !this.board[row][col].isPlayable) {
      console.log('Cell not playable');
      return;
    }
    
    // Check if it's the correct zone for the player (first 4 rows for player 1)
    const playerRows = this.playerId === 1 ? [6, 7, 8, 9] : [0, 1, 2, 3];
    if (!playerRows.includes(row)) {
      console.log('Outside your placement zone');
      return;
    }
    
    // Check if the cell is already occupied
    if (this.isPieceAtCell(row, col)) {
      console.log('Cell already occupied');
      return;
    }
  
    const pieceToPlace = this.pieces[this.currentPieceIndex];
    if (pieceToPlace && !pieceToPlace.isPlaced) {
      this.placePiece(pieceToPlace, row, col);
    }
  }

  // Place a piece on the board
  placePiece(piece: Piece, row: number, col: number): void {
    console.log(`Placing piece: ${piece.pieceName} at row: ${row}, column: ${col}`);
    
    this.gameService.placePiece(this.gameId, this.playerId, piece.index, row, col, piece.pieceName).subscribe(
      response => {
        // Update local piece state
        piece.isPlaced = true;
        piece.row = row;
        piece.col = col;
        piece.type = this.playerId === 1 ? 'Player1' : 'Player2';
  
        // Update local board state
        this.board[row][col] = {
          pieceName: piece.pieceName,
          type: this.playerId === 1 ? 'Player1' : 'Player2',
          isPlayable: true,
          pieceIndex: piece.index
        };
  
        this.currentPieceIndex++;
        
        // Find next unplaced piece
        while (
          this.currentPieceIndex < this.pieces.length && 
          this.pieces[this.currentPieceIndex].isPlaced
        ) {
          this.currentPieceIndex++;
        }
        
        // Check if all pieces are placed
        if (this.pieces.every(p => p.isPlaced)) {
          this.gamePhase = 'play';
          this.currentPlayer = 1; // Blue player starts
        }
      },
      error => {
        console.error('Error placing piece:', error);
        
        // Show specific error if available
        if (error.error && typeof error.error === 'string') {
          alert(`Error: ${error.error}`);
        }
      }
    );
  }

  // Check if a move is valid
  isValidMove(piece: Piece, toRow: number, toCol: number): boolean {
    // Check board bounds
    if (
      toRow < 0 || toRow >= this.board.length || 
      toCol < 0 || toCol >= this.board[0].length
    ) {
      return false;
    }
    
    // Don't allow moving bombs or flags
    if (piece.pieceName === 'Bomb' || piece.pieceName === 'Flag') {
      return false;
    }

    // Check if destination cell is playable
    if (!this.board[toRow][toCol] || !this.board[toRow][toCol].isPlayable) {
      return false;
    }

    // Check if there's a friendly piece at destination
    if (this.isPieceAtCell(toRow, toCol)) {
      const targetCell = this.board[toRow][toCol];
      const isAlly = (
        (this.playerId === 1 && targetCell.type === 'Player1') || 
        (this.playerId === 2 && targetCell.type === 'Player2')
      );
      
      if (isAlly) {
        return false;
      }
      // If enemy, attack is allowed
    }

    // For regular pieces: only orthogonal moves of 1 square
    if (piece.pieceName !== 'Scout') {
      const isAdjacent = (
        (Math.abs(toRow - piece.row!) === 1 && toCol === piece.col!) || 
        (Math.abs(toCol - piece.col!) === 1 && toRow === piece.row!)
      );
      
      if (!isAdjacent) {
        return false;
      }
    } else {
      // For scouts: can move multiple squares in a straight line
      if (toRow !== piece.row! && toCol !== piece.col!) {
        return false;
      }

      // Check for pieces in the path
      if (toRow === piece.row!) {
        // Horizontal movement
        const start = Math.min(piece.col!, toCol);
        const end = Math.max(piece.col!, toCol);
        for (let c = start + 1; c < end; c++) {
          if (this.isPieceAtCell(toRow, c)) {
            return false;
          }
        }
      } else {
        // Vertical movement
        const start = Math.min(piece.row!, toRow);
        const end = Math.max(piece.row!, toRow);
        for (let r = start + 1; r < end; r++) {
          if (this.isPieceAtCell(r, toCol)) {
            return false;
          }
        }
      }
    }

    return true;
  }

  // Move a piece on the board
  movePiece(piece: Piece, toRow: number, toCol: number): void {
    if (!piece.row || !piece.col) {
      console.error('Piece does not have a valid position');
      return;
    }
    
    if (!this.isValidMove(piece, toRow, toCol)) {
      console.log('Invalid move');
      return;
    }

    console.log(`Moving piece: ${piece.pieceName} from (${piece.row}, ${piece.col}) to (${toRow}, ${toCol})`);
    
    // Call backend service to move piece
    this.gameService.movePiece(
      this.gameId, 
      piece.index, 
      piece.row, 
      piece.col, 
      toRow, 
      toCol
    ).subscribe(
      response => {
        // Clear highlighted cells
        this.highlightedCells = [];
        
        if (response && response.combatResult) {
          // Handle combat result based on response
          this.handleCombatResult(piece, toRow, toCol, response.combatResult);
        } else {
          // Normal move without combat
          // Empty original cell
          this.board[piece.row!][piece.col!] = { 
            pieceName: 'None', 
            isPlayable: true 
          };
          
          // Update new cell
          this.board[toRow][toCol] = { 
            pieceName: piece.pieceName,
            type: piece.type,
            isPlayable: true,
            pieceIndex: piece.index
          };
          
          // Update piece position
          piece.row = toRow;
          piece.col = toCol;
        }
        
        // Change turn
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
        this.selectedPiece = null;
      },
      error => {
        console.error('Error moving piece:', error);
        this.selectedPiece = null;
      }
    );
  }

  // Handle combat result
  handleCombatResult(attackingPiece: Piece, row: number, col: number, result: string): void {
    const fromRow = attackingPiece.row!;
    const fromCol = attackingPiece.col!;
    
    // Find defending piece
    const defenderCell = this.board[row][col];
    let defenderPiece: Piece | null = null;
    
    if (defenderCell && defenderCell.pieceName !== 'None') {
      const defenderIndex = this.pieces.findIndex(p => 
        p.row === row && p.col === col && p.pieceName === defenderCell.pieceName);
      
      if (defenderIndex >= 0) {
        defenderPiece = this.pieces[defenderIndex];
      }
    }
    
    switch (result) {
      case 'win':
        // Attacker wins, defender is eliminated
        if (defenderPiece) {
          defenderPiece.isPlaced = false;
        }
        
        // Update board: empty original cell
        this.board[fromRow][fromCol] = { 
          pieceName: 'None', 
          isPlayable: true 
        };
        
        // Move attacking piece to new position
        this.board[row][col] = { 
          pieceName: attackingPiece.pieceName,
          type: attackingPiece.type,
          isPlayable: true,
          pieceIndex: attackingPiece.index
        };
        
        // Update attacking piece position
        attackingPiece.row = row;
        attackingPiece.col = col;
        break;
        
      case 'lose':
        // Attacker loses, is eliminated
        attackingPiece.isPlaced = false;
        
        // Empty attacker's cell
        this.board[fromRow][fromCol] = { 
          pieceName: 'None', 
          isPlayable: true 
        };
        break;
        
      case 'draw':
        // Both pieces are eliminated
        attackingPiece.isPlaced = false;
        if (defenderPiece) {
          defenderPiece.isPlaced = false;
        }
        
        // Empty both cells
        this.board[fromRow][fromCol] = { 
          pieceName: 'None', 
          isPlayable: true 
        };
        
        this.board[row][col] = { 
          pieceName: 'None', 
          isPlayable: true 
        };
        break;
    }
    
    // Check if game has ended (if flag was captured)
    if (defenderPiece && defenderPiece.pieceName === 'Flag') {
      this.endGame(attackingPiece.type === 'Player1' ? 1 : 2);
    }
  }

  // End game and show winner
  endGame(winnerId: number): void {
    alert(`Player ${winnerId} has won the game!`);
    // Additional logic for game end could be added here
  }

  // Move to next piece during setup
  nextPiece(): void {
    if (this.currentPieceIndex < this.pieces.length) {
      // Find next unplaced piece
      while (
        this.currentPieceIndex < this.pieces.length && 
        this.pieces[this.currentPieceIndex].isPlaced
      ) {
        this.currentPieceIndex++;
      }
    }
  }

  // Get CSS classes for cell styling
  getCellClass(row: number, col: number): string {
    if (!this.board || !this.board[row] || !this.board[row][col]) return '';
    
    const cell = this.board[row][col];
    let classes = '';
    
    if (!cell.isPlayable) {
      classes += 'lake ';
    }
    
    if (cell.type === 'Player1') {
      classes += 'player1 ';
    } else if (cell.type === 'Player2') {
      classes += 'player2 ';
    }
    
    // Add class for selected piece
    if (this.selectedPiece && this.selectedPiece.row === row && this.selectedPiece.col === col) {
      classes += 'selected ';
    }
    
    // Add class for valid move cells
    if (this.isCellHighlighted(row, col)) {
      classes += 'valid-move ';
    }
    
    return classes;
  }
}