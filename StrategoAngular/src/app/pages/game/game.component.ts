import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { GameService } from '../../services/game.service';
import { WebsocketService } from '../../services/websocket.service';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game.component.html',
  styleUrl: './game.component.css'
})
export class GameComponent implements OnInit, OnDestroy {
  @Input() gameId!: string;
  board: any[][] = []; // Matriz del tablero
  selectedPiece: { row: number, col: number } | null = null;
  private gameUpdateSubscription: Subscription | null = null;
  currentTurn: string = 'Player1'; // Por defecto, Player1 comienza
  isMyTurn: boolean = false;
  message: string = '';

  constructor(
    private gameService: GameService, 
    private route: ActivatedRoute,
    private websocketService: WebsocketService
  ) {}

  ngOnInit(): void {
    if (!this.gameId) {
      this.gameId = this.route.snapshot.paramMap.get('id')!; 
    }
  
    console.log(`GameComponent inicializado con gameId: ${this.gameId}`);
  
    // Cargar estado inicial del juego
    this.loadGameState();
  
    this.websocketService.gameUpdate$.subscribe(update => {
      this.currentTurn = update.currentTurn; // Asegúrate que esto sea "Player1" o "Player2"
      this.checkTurn(); // Actualiza isMyTurn
    
    
      if (update.gameId === this.gameId) {
        console.log('WebSocket: Antes de la actualización', JSON.stringify(this.board));
    
        this.board = update.board; // 🔹 Aquí se actualiza el tablero
    
        console.log('WebSocket: Después de la actualización', JSON.stringify(this.board));
    
        this.currentTurn = update.currentTurn;
        this.checkTurn();
    
        // 🔹 Verificar que las piezas siguen en el tablero tras la actualización
        this.debugBoard();
      }
    });
  }
  ngOnDestroy(): void {
    // Limpiar suscripciones al destruir el componente
    if (this.gameUpdateSubscription) {
      this.gameUpdateSubscription.unsubscribe();
    }
  }

  loadGameState(): void {
    console.log(`Cargando estado del juego para gameId: ${this.gameId}`);
  
    this.gameService.getGameState(this.gameId).subscribe(response => {
      console.log('Respuesta del servidor recibida:', response);
  
      if (response && response.board) {
        console.log('Actualizando tablero desde la respuesta HTTP');
        this.board = response.board;
  
        if (response.currentTurn) {
          this.currentTurn = response.currentTurn;
        }
  
        this.checkTurn();
        this.debugBoard();
      } else {
        console.error('Datos incompletos recibidos del servidor');
      }
    }, error => {
      console.error('Error al obtener el estado del juego:', error);
    });
  }
  private debugBoard(): void {
    if (!this.board || this.board.length === 0) {
      console.log('El tablero está vacío o no existe');
      return;
    }
  
    console.log('Estado actual del tablero:');
  
    // Analizar el tablero y mostrar qué hay en cada celda
    for (let i = 0; i < this.board.length; i++) {
      for (let j = 0; j < this.board[i].length; j++) {
        const cell = this.board[i][j];
  
        if (cell) {
          console.log(`Celda [${i},${j}] ->`, cell);
          
          // Verificar si la celda es un lago
          if (cell.isPlayable === false) {
            console.log(`⚠️ Celda [${i},${j}] es un lago (No jugable)`);
          }
        } else {
          console.log(`Celda [${i},${j}] está vacía`);
        }
      }
    }
  
    // Contar piezas por jugador
    const playerPieces = {
      [this.getPlayerName()]: 0,
      other: 0
    };
    for (let i = 0; i < this.board.length; i++) {
      for (let j = 0; j < this.board[i].length; j++) {
        const cell = this.board[i][j];
        if (cell && cell.pieceName && cell.pieceName !== 'None') {
          if (cell.PlayerName === this.getPlayerName()) {
            playerPieces[this.getPlayerName()]++;
          } else {
            playerPieces.other++;
          }
        }
      }
    }
  
    console.log('Piezas por jugador:', playerPieces);
    console.log('Turno actual:', this.currentTurn);
    console.log('Es mi turno:', this.isMyTurn);
  }
  
  
  checkTurn(): void {
    const playerType = this.getPlayerType();
    console.log(`Comprobando turno - Mi tipo: ${playerType}, Turno actual: ${this.currentTurn}`);
  
    this.isMyTurn = this.currentTurn === playerType;
  
    if (this.isMyTurn) {
      this.message = 'Es tu turno';
    } else {
      this.message = 'Esperando al oponente...';
    }
  
    console.log(`¿Es mi turno? ${this.isMyTurn}`);
  }
  // Método para obtener el tipo de jugador del localStorage
  getPlayerType(): string {
    return localStorage.getItem('playerType') || '';
  }

  // Método para obtener el nombre del jugador del localStorage
  getPlayerName(): string {
    return localStorage.getItem('playerName') || '';
  }

  getPieceAt(row: number, col: number): string {
    if (!this.board || !this.board[row] || !this.board[row][col]) {
      return '';
    }
  
    const cell = this.board[row][col];
    
    // 1. Corregir nombres de propiedades (PascalCase)
    if (cell.isPlayable === false) { // ✔️ Ahora con mayúscula
      return '💧';
    }
  
    // 2. Usar PieceName en vez de pieceName
    if (!cell.pieceName || cell.pieceName === 'None') { // ✔️
      return '';
    }
  
    // 3. Corregir referencia a PlayerName
    const isMyPiece = cell.playerName === this.getPlayerName(); // ✔️
  
  
    // Determinar si la pieza es del jugador actual
  
    // Mostrar el icono adecuado según el tipo de pieza
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
  
    console.log(`Comparando: ${cell.PlayerName} vs ${this.getPlayerName()}`);
    return isMyPiece ? `<span>${icon}</span>` : '?';
  }
  handleCellClick(row: number, col: number): void {
    console.log(`Jugador actual: ${this.getPlayerName()}`);
    console.log(`Celda: ${JSON.stringify(this.board[row][col])}`);
    
    if (!this.isMyTurn) {
      console.warn('No es tu turno');
      return;
    }
  
    const cell = this.board[row][col];
    console.log(`handleCellClick: Celda seleccionada ->`, cell);
  
    if (this.selectedPiece) {
      console.log(`handleCellClick: Moviendo de (${this.selectedPiece.row},${this.selectedPiece.col}) a (${row},${col})`);
      this.movePiece(this.selectedPiece.row, this.selectedPiece.col, row, col);
      this.selectedPiece = null;
    } else if (cell.pieceName && cell.playerName === this.getPlayerName()) {
      console.log(`handleCellClick: Seleccionando pieza en (${row},${col})`);
      this.selectedPiece = { row, col };
    } else {
      console.warn(`handleCellClick: No puedes seleccionar esta celda`);
    }
  }
  

  movePiece(fromRow: number, fromCol: number, toRow: number, toCol: number): void {
    this.gameService.movePiece(this.gameId, fromRow, fromCol, toRow, toCol).subscribe(response => {
      if (response.result === 1 || response.result === 10 || response.result === 20 || response.result === 30 || response.result === 50) {
        console.log("Movimiento exitoso");
        // El tablero se actualizará vía WebSocket, así que no es necesario recargar aquí
        // Pero actualizamos el estado del turno
        this.isMyTurn = false;
        this.message = 'Esperando al oponente...';
      } else {
        console.error("Movimiento inválido:", response.result);
        if (response.result === 5) {
          alert("No es tu turno");
        } else {
          alert("Movimiento inválido");
        }
      }
    }, error => {
      console.error("Error al mover la pieza:", error);
    });
  }
}