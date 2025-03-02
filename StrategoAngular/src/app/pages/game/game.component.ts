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
  @Input() gameId!: number;
  board: any[][] = []; // Matriz del tablero
  pieces: any[] = []; // Lista de fichas

  constructor(private gameService: GameService, private route: ActivatedRoute) {}

  ngOnInit(): void {
    if (!this.gameId) {
      this.gameId = Number(this.route.snapshot.paramMap.get('id')); // Obtener gameId desde la URL
    }
    this.loadGameState();
  }

  loadGameState(): void {
    this.gameService.getGameState(this.gameId).subscribe(response => {
      console.log('Estado del juego:', response);
        
      if (response && response.board) {
        this.board = response.board;
        // Crear un arreglo de piezas si no existe
        this.pieces = [];
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
    
    // Si hay una pieza específica, mostrar su tipo
    if (cell.pieceName && cell.pieceName !== 'None') {
      let icon = '';
      
      // Mapeo de piezas a iconos (puedes usar emojis o caracteres especiales)
      switch (cell.pieceName) {
        case 'Marshal': icon = '⭐'; break;
        case 'General': icon = '★'; break;
        case 'Colonel': icon = '✹'; break;
        case 'Major': icon = '✸'; break;
        case 'Captain': icon = '✷'; break;
        case 'Lieutenant': icon = '✶'; break;
        case 'Sergeant': icon = '✵'; break;
        case 'Miner': icon = '⛏️'; break;
        case 'Scout': icon = '🔍'; break;
        case 'Spy': icon = '🕵️'; break;
        case 'Bomb': icon = '💣'; break;
        case 'Flag': icon = '🏁'; break;
        default: icon = '?'; break;
      }
      
      // Agregar color según el jugador
      const playerClass = cell.type === 'Player1' ? 'player1' : 'player2';
      return `<span class="${playerClass}">${icon}</span>`;
    }
    
    // Si no hay pieza, mostrar vacío o lago
    if (!cell.isPlayable) {
      return '💧'; // Lagos
    }
    
    return ''; // Espacios vacíos
  }
}