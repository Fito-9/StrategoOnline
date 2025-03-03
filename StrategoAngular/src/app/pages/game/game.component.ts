import { Component, Input, OnInit } from '@angular/core';
import { GameService } from '../../services/game.service';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game.component.html',
  styleUrl: './game.component.css'
})
export class GameComponent implements OnInit {
  @Input() gameId!: string;
  board: any[][] = []; // Matriz del tablero
  selectedPiece: { row: number, col: number } | null = null;

  constructor(private gameService: GameService, private route: ActivatedRoute) {}

  ngOnInit(): void {
    if (!this.gameId) {
      this.gameId = this.route.snapshot.paramMap.get('id')!; 
    }
    this.loadGameState();
  }

  loadGameState(): void {
    this.gameService.getGameState(this.gameId).subscribe(response => {
      if (response && response.board) {
        this.board = response.board;
      } else {
        console.error('Datos incompletos recibidos del servidor');
      }
    }, error => {
      console.error('Error al obtener el estado del juego:', error);
    });
  }
  
  getPieceAt(row: number, col: number): string {
    const cell = this.board[row][col];
    if (!cell) return '';
    
    const currentPlayerType = localStorage.getItem('playerType') || '';
    
    if (cell.pieceName && cell.pieceName !== 'None') {
      let icon = '';
      switch (cell.pieceName) {
        case 'Marshal': icon = '⭐'; break;
        case 'General': icon = 'G'; break;
        case 'Colonel': icon = 'C'; break;
        case 'Major': icon = 'M'; break;
        case 'Captain': icon = 'CA'; break;
        case 'Lieutenant': icon = 'L'; break;
        case 'Sergeant': icon = 'S'; break;
        case 'Miner': icon = '⛏️'; break;
        case 'Scout': icon = 's'; break;
        case 'Spy': icon = '🕵️'; break;
        case 'Bomb': icon = 'b'; break;
        case 'Flag': icon = '🏁'; break;
        default: icon = '?'; break;
      }
      
      return cell.playerName === localStorage.getItem('playerName') ? `<span>${icon}</span>` : '?';


    }

    return cell.isPlayable ? '' : '💧';
  }

  handleCellClick(row: number, col: number): void {
    const cell = this.board[row][col];
    const currentPlayerType = localStorage.getItem('playerType') || '';

    if (this.selectedPiece) {
      // Intentamos mover la pieza seleccionada a la nueva celda
      this.movePiece(this.selectedPiece.row, this.selectedPiece.col, row, col);
      this.selectedPiece = null; // Deseleccionamos la pieza después del intento de movimiento
    } else {
      // Si la celda tiene una pieza del jugador, la seleccionamos
      if (cell.pieceName && cell.playerName === localStorage.getItem('playerName')) {
        this.selectedPiece = { row, col };
      }
    }
  }

  movePiece(fromRow: number, fromCol: number, toRow: number, toCol: number): void {
    this.gameService.movePiece(this.gameId, fromRow, fromCol, toRow, toCol).subscribe(response => {
      if (response.result === 1) {
        console.log("Movimiento exitoso");
        this.loadGameState();
      } else {
        console.error("Movimiento inválido");
      }
      
    }, error => {
      console.error("Error al mover la pieza:", error);
    });
  }
}
