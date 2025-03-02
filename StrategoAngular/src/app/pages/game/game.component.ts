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
      console.log('Estado del juego:', response);  // Ver qué se está recibiendo
      if (response && response.board && response.pieces) {
        this.board = response.board;
        this.pieces = response.pieces;
      } else {
        console.error('Datos incompletos recibidos del servidor');
      }
    }, error => {
      console.error('Error al obtener el estado del juego:', error);
    });
  }
  

  getPieceAt(row: number, col: number): any | null {
    // Devuelve la pieza si existe en la posición especificada
    return this.pieces.find(piece => piece.row === row && piece.col === col) || null;
  }
}