import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { GameService } from '../../services/game.service';
import { WebsocketService } from '../../services/websocket.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game.component.html',
  styleUrl: './game.component.css'
})
export class GameComponent implements OnInit, OnDestroy {
  @Input() gameId!: string;
  board: any[][] = []; // tablero
  selectedPiece: { row: number, col: number } | null = null;
  private gameUpdateSubscription: Subscription | null = null;
  private gameEndSubscription: Subscription | null = null; // Nueva suscripción
  currentTurn: string = 'Player1'; // Por defecto, El jugador 1 es el que empieza
  isMyTurn: boolean = false;
  message: string = '';
  gameEnded = false; 
  gameResult: {
    status: string, 
    winner: string, 
    winnerName: string
  } | null = null;

  constructor(
    private gameService: GameService, 
    private route: ActivatedRoute,
    private websocketService: WebsocketService,
    private router: Router 
  ) {}

  ngOnInit(): void {
    if (!this.gameId) {
      this.gameId = this.route.snapshot.paramMap.get('id')!; 
    }
  
    console.log(`GameComponent inicializado con gameId: ${this.gameId}`);
  
    // Cargar estado inicial del juego
    this.loadGameState();

    // Suscribirse a las actualizaciones del juego por websockets
    this.gameUpdateSubscription = this.websocketService.gameUpdate$.subscribe(update => {
      if (update.gameId === this.gameId) {
        console.log('WebSocket: Antes de la actualización', JSON.stringify(this.board));
        this.board = update.board; // 🔹 Aquí se actualiza el tablero
        console.log('WebSocket: Después de la actualización', JSON.stringify(this.board));
        this.currentTurn = update.currentTurn;
        this.checkTurn();
        this.debugBoard();
      }
    });

    // llamada al final del juego
    this.gameEndSubscription = this.websocketService.gameEndMessage$
      .pipe(filter(message => message !== null)) 
      .subscribe(gameEndData => {
        this.gameEnded = true;
        this.gameResult = {
          status: gameEndData.status,
          winner: gameEndData.winner,
          winnerName: gameEndData.winnerName
        };
        // mensaje cuando la partida se ha terminado
        this.showGameEndDialog();
      });
  }

  ngOnDestroy(): void {
    if (this.gameUpdateSubscription) {
      this.gameUpdateSubscription.unsubscribe();
    }
    if (this.gameEndSubscription) {
      this.gameEndSubscription.unsubscribe(); // Limpiar suscripción al evento de fin de juego
    }
  }

  loadGameState(): void {
    console.log(`Cargando estado del juego para gameId: ${this.gameId}`);
    this.gameService.getGameState(this.gameId).subscribe(response => {
      console.log('Respuesta del servidor recibida:', response);
      if (response && response.board) {
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
            console.log(`Celda [${i},${j}] es un lago`);
          }
        } else {
          console.log(`Celda [${i},${j}] está vacía`);
        }
      }
    }}

  checkTurn(): void {
    const playerType = this.getPlayerType();
    this.isMyTurn = this.currentTurn === playerType;
    this.message = this.isMyTurn ? 'Es tu turno' : 'Esperando al oponente...';
    console.log(`¿Es mi turno? ${this.isMyTurn}`);
  }

  getPlayerType(): string {
    return localStorage.getItem('playerType') || '';
  }

  getPlayerName(): string {
    return localStorage.getItem('playerName') || '';
  }

  getPieceAt(row: number, col: number): string {
    if (!this.board || !this.board[row] || !this.board[row][col]) {
      return '';
    }
  
    const cell = this.board[row][col];
  
    if (cell.isPlayable === false) { 
      return '💧';
    }

    if (!cell.pieceName || cell.pieceName === 'None') { 
      return '';
    }
  

    const isMyPiece = cell.playerName === this.getPlayerName(); 
  
  
    let icon = '';
    switch (cell.pieceName) {
      case 'Marshal': icon = '⭐'; break;
      case 'General': icon = '👑'; break;
      case 'Colonel': icon = '⚔️'; break;
      case 'Major': icon = '🎖️'; break;
      case 'Captain': icon = '🛡️'; break;
      case 'Lieutenant': icon = '⚓'; break;
      case 'Sergeant': icon = '🗡️'; break;
      case 'Miner': icon = '⛏️'; break;
      case 'Scout': icon = '🏃'; break;
      case 'Spy': icon = '🕵️'; break;
      case 'Bomb': icon = '💣'; break;
      case 'Flag': icon = '🏁'; break;
      default: icon = '?'; break;
    }
  
    console.log(`Comparando: ${cell.PlayerName} vs ${this.getPlayerName()}`);
    return isMyPiece ? `<span>${icon}</span>` : '?';
  }   

  handleCellClick(row: number, col: number): void {
    if (!this.isMyTurn) {
      console.warn('No es tu turno');
      return;
    }
    const cell = this.board[row][col];
    if (this.selectedPiece) {
      this.movePiece(this.selectedPiece.row, this.selectedPiece.col, row, col);
      this.selectedPiece = null;
    } else if (cell.pieceName && cell.playerName === this.getPlayerName()) {
      this.selectedPiece = { row, col };
    } else {
      console.warn(`No puedes seleccionar esta celda`);
    }
  }

  movePiece(fromRow: number, fromCol: number, toRow: number, toCol: number): void {
    this.gameService.movePiece(this.gameId, fromRow, fromCol, toRow, toCol).subscribe(response => {
      if (response.result === 1 || response.result === 10 || response.result === 20 || response.result === 30 || response.result === 50) {
        console.log("Movimiento exitoso");
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

  showGameEndDialog(): void {
    if (!this.gameResult) {
      console.warn('No hay resultados del juego para mostrar');
      return;
    }
    const isWinner = this.gameResult.winner === this.getPlayerType();
    const message = isWinner 
      ? `¡Ganaste!  Has capturado la bandera.` 
      : `Perdiste. El rival capturó tu bandera.`;
    alert(message);

    // Navegar de vuelta al menú principal tras finalizar el juego
    this.router.navigate(['']);
  }
}
