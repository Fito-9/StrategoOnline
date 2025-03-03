import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { GameService } from '../../services/game.service';
import { WebsocketService } from '../../services/websocket.service';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

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
export class GameComponent implements OnInit, OnDestroy {
  @Input() gameId!: string;
  board: any[][] = [];
  pieces: Piece[] = [];
  
  // Identificación de jugadores y turnos
  playerId: number = 2; // El jugador actual (2 o 3)
  isPlayer1: boolean = true; // ¿Soy el jugador 2? (azul)
  isPlayer2: boolean = false; // ¿Soy el jugador 3? (rojo)
  
  gamePhase: string = 'setup';  // Fase: 'setup' o 'play'
  currentPieceIndex: number = 0;  // Índice para seguir qué pieza colocar
  selectedPiece: Piece | null = null; // Pieza seleccionada para movimiento
  currentPlayer: number = 2; // Control de turnos (2 = azul, 3 = rojo)
  highlightedCells: {row: number, col: number}[] = []; // Marcar movimientos válidos
  
  // Para WebSocket
  private subscriptions: Subscription[] = [];
  opponentId: number | null = null;
  
  // Estado de la partida
  gameReady: boolean = false;
  
  constructor(
    private gameService: GameService,
    private websocketService: WebsocketService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    if (!this.gameId) {
      this.gameId = this.route.snapshot.paramMap.get('id') || '';
    }
    
    // Extraer ID del jugador del token JWT o generar uno temporal para pruebas
    this.extractPlayerIdFromToken();
    
    // Determinar si soy jugador 2 o 3 basado en información de matchmaking
    this.subscriptions.push(
      this.websocketService.matchmakingMessage$.subscribe(message => {
        if (message && message.type === 'matchFound' && message.payload.gameId === this.gameId) {
          this.opponentId = message.payload.opponentId;
          console.log(`Partida iniciada contra jugador ${this.opponentId}`);
          
          // Determinar qué jugador soy comparando IDs
          // Si mi ID es menor que el del oponente, soy jugador 2, de lo contrario jugador 3
          const amIPlayer1 = this.playerId < this.opponentId;
          this.isPlayer1 = amIPlayer1;
          this.isPlayer2 = !amIPlayer1;
          
          if (this.isPlayer1) {
            this.playerId = 2;
            console.log('Jugando como jugador 2 (azul)');
          } else {
            this.playerId = 3;
            console.log('Jugando como jugador 3 (rojo)');
          }
          
          this.gameReady = true;
          this.loadGameState(); // Recargar estado después de determinar qué jugador soy
        }
      })
    );
    
    // Suscribirse a eventos de juego para recibir actualizaciones del otro jugador
    this.subscriptions.push(
      this.websocketService.gameMessage$.subscribe(message => {
        if (message && message.gameId === this.gameId) {
          console.log('Evento de juego recibido:', message);
          
          // Actualizar estado del juego cuando recibamos eventos
          if (message.type === 'pieceMoved' || message.type === 'piecePlaced') {
            // Esperar un breve momento para dar tiempo al servidor a actualizar su estado
            setTimeout(() => this.refreshGameState(), 500);
          }
        }
      })
    );
    
    // Asegurarse de que el WebSocket esté conectado
    if (!this.websocketService.connected$.getValue()) {
      this.websocketService.connect();
    }
    
    // Para pruebas: permitir alternancia entre jugadores con una tecla
    this.setupDebugKeys();
    
    // Cargar estado inicial del juego
    this.loadGameState();
    
    // Configurar actualización periódica (cada 3 segundos)
    const refreshInterval = setInterval(() => {
      this.refreshGameState();
    }, 3000);
    
    // Añadir el intervalo a las suscripciones para limpiarlo al destruir
    this.subscriptions.push({
      unsubscribe: () => clearInterval(refreshInterval)
    } as Subscription);
  }
  
  ngOnDestroy(): void {
    // Limpiar todas las suscripciones
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
  
  // Para desarrollo: configurar teclas para alternar entre jugadores
  private setupDebugKeys(): void {
    const keyHandler = (event: KeyboardEvent) => {
      // Presionar "T" para alternar entre jugadores
      if (event.key === 't' || event.key === 'T') {
        this.toggleDebugPlayer();
      }
    };
    
    document.addEventListener('keydown', keyHandler);
    
    // Añadir a suscripciones para limpiar al destruir
    this.subscriptions.push({
      unsubscribe: () => document.removeEventListener('keydown', keyHandler)
    } as Subscription);
  }
  
  // Para desarrollo: alternar entre jugador 2 y 3
  toggleDebugPlayer(): void {
    this.isPlayer1 = !this.isPlayer1;
    this.isPlayer2 = !this.isPlayer2;
    this.playerId = this.isPlayer1 ? 2 : 3;
    console.log(`[DEBUG] Cambiado a Jugador ${this.playerId}`);
    this.refreshGameState();
  }
  
  // Extraer ID del jugador del token JWT
  private extractPlayerIdFromToken(): void {
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        // Decodificar el token (sin verificar la firma)
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        const payload = JSON.parse(jsonPayload);
        // Obtener el ID del jugador (asumiendo que está en el claim "nameid")
        if (payload.nameid) {
          const userId = parseInt(payload.nameid, 10);
          // Guardamos el ID único del usuario, pero playerId será 2 o 3 según la partida
          console.log('ID del usuario extraído del token:', userId);
        }
      } catch (error) {
        console.error('Error al decodificar el token JWT:', error);
      }
    }
  }
  
  loadGameState(): void {
    this.gameService.getGameState(this.gameId).subscribe(
      response => {
        if (response && response.board) {
          this.board = response.board;
          
          // Depuración: ver estructura del tablero
          console.log("Estado del tablero cargado:", this.board);
          
          if (response.pieces && response.pieces.length > 0) {
            this.pieces = response.pieces.map((piece: any, index: number) => ({
              ...piece,
              index: index,
              isPlaced: piece.isPlaced || false
            }));
          } else {
            this.pieces = this.initializePieces();
          }
          
          // Determinar fase del juego
          this.gamePhase = this.pieces.every(p => p.isPlaced) ? 'play' : 'setup';
          
          // Inicializar currentPlayer si estamos en fase de juego
          if (this.gamePhase === 'play') {
            this.currentPlayer = response.currentPlayer || 2;
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

  refreshGameState(): void {
    // Actualizar estado independientemente de si es nuestro turno o no
    this.gameService.getGameState(this.gameId).subscribe(
      response => {
        if (response && response.board) {
          this.board = response.board;
          this.currentPlayer = response.currentPlayer || 2;
          
          // Actualizar posiciones de las piezas
          if (response.pieces && response.pieces.length > 0) {
            this.pieces = response.pieces.map((piece: any, index: number) => ({
              ...piece,
              index: index,
              isPlaced: piece.isPlaced || false
            }));
          }
          
          // Verifica si todos los elementos están presentes en el tablero para prevenir errores
          this.validateBoardState();
          
          console.log("Estado del juego actualizado:", {
            currentPlayer: this.currentPlayer,
            gamePhase: this.gamePhase,
            totalPieces: this.pieces.length,
            placedPieces: this.pieces.filter(p => p.isPlaced).length
          });
        }
      },
      error => {
        console.error('Error al refrescar el estado del juego:', error);
      }
    );
  }
  
  // Validar que el tablero tenga todos los elementos necesarios
  validateBoardState(): void {
    // Verificar que el tablero esté inicializado correctamente
    if (!this.board || !Array.isArray(this.board) || this.board.length === 0) {
      console.error('El tablero no está correctamente inicializado');
      // Reinicializar el tablero con celdas vacías si es necesario
      this.board = Array(10).fill(null).map(() => 
        Array(10).fill(null).map(() => ({ 
          pieceName: 'None', 
          isPlayable: true 
        }))
      );
      
      // Marcar los lagos (celdas no jugables)
      const lakes = [
        {row: 2, col: 4}, {row: 2, col: 5}, 
        {row: 3, col: 4}, {row: 3, col: 5},
        {row: 6, col: 4}, {row: 6, col: 5},
        {row: 7, col: 4}, {row: 7, col: 5}
      ];
      
      lakes.forEach(({row, col}) => {
        if (this.board[row] && this.board[row][col]) {
          this.board[row][col].isPlayable = false;
        }
      });
    }
    
    // Verificar las piezas colocadas en el tablero para asegurar consistencia
    this.pieces.forEach(piece => {
      if (piece.isPlaced && piece.row !== undefined && piece.col !== undefined) {
        // Asegurarse de que la pieza está correctamente representada en el tablero
        if (!this.board[piece.row][piece.col] || 
            this.board[piece.row][piece.col].pieceName !== piece.pieceName) {
          
          // Actualizar el tablero para que coincida con la información de la pieza
          this.board[piece.row][piece.col] = {
            pieceName: piece.pieceName,
            type: piece.type,
            isPlayable: true,
            pieceIndex: piece.index
          };
        }
      }
    });
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
      // Verificar si es el turno del jugador actual
      if (this.playerId !== this.currentPlayer) {
        console.log('No es tu turno');
        return;
      }
      
      // Si hay una pieza en la celda y no hay pieza seleccionada, seleccionarla
      if (!this.selectedPiece && this.isPieceAtCell(row, col)) {
        const cell = this.board[row][col];
        // Verificar si la pieza pertenece al jugador actual
        const playerCellType = this.playerId === 2 ? 'Player1' : 'Player2';
        
        if (cell.type === playerCellType) {
          // Encontrar la pieza correspondiente en el array de piezas
          const pieceIndex = this.pieces.findIndex(p => 
            p.row === row && p.col === col && p.pieceName === cell.pieceName);
          
          if (pieceIndex >= 0) {
            this.selectedPiece = this.pieces[pieceIndex];
            console.log(`Pieza seleccionada: ${this.selectedPiece.pieceName} en (${row}, ${col})`);
            this.highlightValidMoves(this.selectedPiece);
          }
        } else {
          console.log('No puedes seleccionar piezas del oponente');
        }
      } 
      // Si ya hay una pieza seleccionada y se hace clic en otra celda, intentar mover
      else if (this.selectedPiece) {
        // Si se hace clic en la misma celda, deseleccionar
        if (this.selectedPiece.row === row && this.selectedPiece.col === col) {
          this.selectedPiece = null;
          this.highlightedCells = [];
          console.log('Pieza deseleccionada');
        } else {
          // Intentar mover la pieza
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
    
    // Para piezas normales: solo movimientos ortogonales de 1 casilla
    if (piece.pieceName !== 'Scout') {
      const directions = [
        { row: -1, col: 0 },  // Arriba
        { row: 1, col: 0 },   // Abajo
        { row: 0, col: -1 },  // Izquierda
        { row: 0, col: 1 }    // Derecha
      ];
      
      for (const dir of directions) {
        const newRow = piece.row + dir.row;
        const newCol = piece.col + dir.col;
        
        if (this.isValidMove(piece, newRow, newCol)) {
          this.highlightedCells.push({ row: newRow, col: newCol });
        }
      }
    } else {
      // Para exploradores: pueden moverse múltiples casillas en línea recta
      const directions = [
        { row: -1, col: 0 },  // Arriba
        { row: 1, col: 0 },   // Abajo
        { row: 0, col: -1 },  // Izquierda
        { row: 0, col: 1 }    // Derecha
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
            
            // Detenerse si hay una pieza enemiga
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
    // Verificar si las coordenadas están dentro de los límites del tablero
    if (row < 0 || row >= 10 || col < 0 || col >= 10) {
      console.log('Coordenadas fuera de los límites del tablero');
      return;
    }
    
    // Verificar si la celda es jugable
    if (!this.board[row][col] || !this.board[row][col].isPlayable) {
      console.log('Celda no jugable');
      return;
    }
    
    // Determinar zona de colocación según el jugador
    let validRows: number[];
    if (this.playerId === 2) {
      validRows = [6, 7, 8, 9]; // Jugador 2 coloca en la parte inferior
    } else {
      validRows = [0, 1, 2, 3]; // Jugador 3 coloca en la parte superior
    }
    
    // Verificar si está en la zona correcta
    if (!validRows.includes(row)) {
      console.log(`Fuera de tu zona de colocación. Filas permitidas: ${validRows.join(', ')}`);
      return;
    }
    
    // Verificar si la celda ya está ocupada
    if (this.isPieceAtCell(row, col)) {
      console.log('Celda ya ocupada');
      return;
    }
  
    const pieceToPlace = this.pieces[this.currentPieceIndex];
    if (pieceToPlace && !pieceToPlace.isPlaced) {
      this.placePiece(pieceToPlace, row, col);
    }
  }

  // Place a piece on the board
  placePiece(piece: Piece, row: number, col: number): void {
    console.log(`Colocando pieza: ${piece.pieceName} en fila: ${row}, columna: ${col}`);
    
    // Determinar el tipo de jugador basado en el ID del jugador
    const playerType = this.playerId === 2 ? 'Player1' : 'Player2';
    
    this.gameService.placePiece(
      this.gameId, 
      this.playerId, 
      piece.index, 
      row, 
      col, 
      piece.pieceName
    ).subscribe(
      response => {
        console.log('Respuesta exitosa al colocar pieza:', response);
        
        // Actualizar estado local de la pieza
        piece.isPlaced = true;
        piece.row = row;
        piece.col = col;
        piece.type = playerType;
  
        // Actualizar estado local del tablero
        this.board[row][col] = {
          ...this.board[row][col],  // Mantener el tipo original y otras propiedades
          pieceName: piece.pieceName,
          pieceIndex: piece.index,
          type: playerType  // Asegurarse de que el tipo sea correcto
        };
  
        this.currentPieceIndex++;
        
        // Encontrar la siguiente pieza no colocada
        while (
          this.currentPieceIndex < this.pieces.length && 
          this.pieces[this.currentPieceIndex].isPlaced
        ) {
          this.currentPieceIndex++;
        }
        
        // Verificar si todas las piezas están colocadas
        if (this.pieces.every(p => p.isPlaced)) {
          this.gamePhase = 'play';
          this.currentPlayer = 2; // El jugador azul comienza
          
          // Notificar a otros jugadores que todas las piezas están colocadas
          this.notifyGameEvent('setupComplete', {});
        } else {
          // Notificar a otros jugadores sobre la pieza colocada
          this.notifyGameEvent('piecePlaced', {
            pieceIndex: piece.index,
            row: row,
            col: col
          });
        }
      },
      error => {
        console.error('Error al colocar pieza:', error);
        
        // Mostrar error específico si está disponible
        if (error.error && typeof error.error === 'string') {
          alert(`Error: ${error.error}`);
        }
      }
    );
  }

  // Check if a move is valid
  isValidMove(piece: Piece, toRow: number, toCol: number): boolean {
    // Verificar límites del tablero
    if (
      toRow < 0 || toRow >= this.board.length || 
      toCol < 0 || toCol >= this.board[0].length
    ) {
      return false;
    }
    
    // No permitir mover bombas o banderas
    if (piece.pieceName === 'Bomb' || piece.pieceName === 'Flag') {
      return false;
    }

    // Verificar si la celda de destino es jugable
    if (!this.board[toRow][toCol] || !this.board[toRow][toCol].isPlayable) {
      return false;
    }

    // Verificar si hay una pieza amiga en el destino
    if (this.isPieceAtCell(toRow, toCol)) {
      const targetCell = this.board[toRow][toCol];
      const playerType = this.playerId === 2 ? 'Player1' : 'Player2';
      const isAlly = targetCell.type === playerType;
      
      if (isAlly) {
        return false;
      }
      // Si es enemigo, se permite el ataque
    }

    // Para piezas normales: solo movimientos ortogonales de 1 casilla
    if (piece.pieceName !== 'Scout') {
      const isAdjacent = (
        (Math.abs(toRow - piece.row!) === 1 && toCol === piece.col!) || 
        (Math.abs(toCol - piece.col!) === 1 && toRow === piece.row!)
      );
      
      if (!isAdjacent) {
        return false;
      }
    } else {
      // Para exploradores: pueden moverse múltiples casillas en línea recta
      if (toRow !== piece.row! && toCol !== piece.col!) {
        return false;
      }

      // Verificar piezas en el camino
      if (toRow === piece.row!) {
        // Movimiento horizontal
        const start = Math.min(piece.col!, toCol);
        const end = Math.max(piece.col!, toCol);
        for (let c = start + 1; c < end; c++) {
          if (this.isPieceAtCell(toRow, c)) {
            return false;
          }
        }
      } else {
        // Movimiento vertical
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
      console.error('La pieza no tiene una posición válida');
      return;
    }
    
    if (!this.isValidMove(piece, toRow, toCol)) {
      console.log('Movimiento no válido');
      return;
    }

    console.log(`Moviendo pieza: ${piece.pieceName} de (${piece.row}, ${piece.col}) a (${toRow}, ${toCol})`);
    
    // Guardar una copia del estado actual del tablero antes del movimiento
    const boardBackup = JSON.parse(JSON.stringify(this.board));
    const piecesBackup = JSON.parse(JSON.stringify(this.pieces));
    
    const moveRequest = {
      pieceIndex: piece.index,
      fromRow: piece.row,
      fromCol: piece.col,
      toRow: toRow,
      toCol: toCol
    };
    
    // Primero actualizar localmente para dar feedback inmediato
    const fromRow = piece.row;
    const fromCol = piece.col;
    const playerType = this.playerId === 2 ? 'Player1' : 'Player2';
    
    // Verificar si hay una pieza enemiga en el destino (posible combate)
    const targetHasPiece = this.isPieceAtCell(toRow, toCol);
    const targetCell = targetHasPiece ? this.board[toRow][toCol] : null;
    const isAttack = targetHasPiece && targetCell && targetCell.type !== playerType;
    
    if (!isAttack) {
      // Movimiento simple sin combate
      // Vaciar celda original
      this.board[fromRow][fromCol] = { 
        pieceName: 'None', 
        isPlayable: true 
      };
      
      // Actualizar nueva celda
      this.board[toRow][toCol] = { 
        pieceName: piece.pieceName,
        type: playerType,
        isPlayable: true,
        pieceIndex: piece.index
      };
      
      // Actualizar posición de la pieza
      piece.row = toRow;
      piece.col = toCol;
    }
    
    // Llamar al servicio backend para mover la pieza
    this.gameService.movePiece(
      this.gameId, 
      moveRequest
    ).subscribe(
      response => {
        // Limpiar celdas resaltadas
        this.highlightedCells = [];
        
        if (response && response.result) {
          // Manejar resultado del combate según el código de respuesta
          this.handleCombatResult(piece, toRow, toCol, response.result);
        } else if (isAttack) {
          // Si era un ataque pero no hay resultado, restaurar el estado previo
          // y cargar de nuevo el estado del juego
          this.board = boardBackup;
          this.pieces = piecesBackup;
          this.refreshGameState();
        }
        
        // Cambiar turno
        this.currentPlayer = this.currentPlayer === 2 ? 3 : 2;
        this.selectedPiece = null;
        
        // Notificar a otros jugadores sobre el movimiento
        this.notifyGameEvent('pieceMoved', {
          ...moveRequest,
          result: response?.result
        });
      },
      error => {
        console.error('Error al mover pieza:', error);
        // Restaurar estado previo en caso de error
        this.board = boardBackup;
        this.pieces = piecesBackup;
        this.selectedPiece = null;
      }
    );
  }

  // Handle combat result
  handleCombatResult(attackingPiece: Piece, row: number, col: number, resultCode: number): void {
    const fromRow = attackingPiece.row!;
    const fromCol = attackingPiece.col!;
    
    // Encontrar pieza defensora
    const defenderCell = this.board[row][col];
    let defenderPiece: Piece | null = null;
    
    if (defenderCell && defenderCell.pieceName !== 'None') {
      const defenderIndex = this.pieces.findIndex(p => 
        p.row === row && p.col === col);
      
      if (defenderIndex >= 0) {
        defenderPiece = this.pieces[defenderIndex];
      }
    }
    
    console.log(`Resultado de combate: ${resultCode}`, {
      attackerPiece: attackingPiece.pieceName,
      defenderPiece: defenderPiece?.pieceName,
      location: `(${row}, ${col})`
    });
    
    switch (resultCode) {
      case 10: // Atacante gana
        // Atacante gana, defensor es eliminado
        if (defenderPiece) {
          defenderPiece.isPlaced = false;
          defenderPiece.row = undefined;
          defenderPiece.col = undefined;
        }
        
        // Actualizar tablero: vaciar celda original
        this.board[fromRow][fromCol] = { 
          pieceName: 'None', 
          isPlayable: true 
        };
        
        // Mover pieza atacante a nueva posición
        this.board[row][col] = { 
          pieceName: attackingPiece.pieceName,
          type: attackingPiece.type,
          isPlayable: true,
          pieceIndex: attackingPiece.index
        };
        
        // Actualizar posición de la pieza atacante
        attackingPiece.row = row;
        attackingPiece.col = col;
        break;
        
      case 30: // Atacante pierde
        // Atacante pierde, es eliminado
        attackingPiece.isPlaced = false;
        attackingPiece.row = undefined;
        attackingPiece.col = undefined;
        
        // Vaciar celda del atacante
        this.board[fromRow][fromCol] = { 
          pieceName: 'None', 
          isPlayable: true 
        };
        break;
        
      case 20: // Empate
        // Ambas piezas son eliminadas
        attackingPiece.isPlaced = false;
        attackingPiece.row = undefined;
        attackingPiece.col = undefined;
        
        if (defenderPiece) {
          defenderPiece.isPlaced = false;
          defenderPiece.row = undefined;
          defenderPiece.col = undefined;
        }
        
        // Vaciar ambas celdas
        this.board[fromRow][fromCol] = { 
          pieceName: 'None', 
          isPlayable: true 
        };
        
        this.board[row][col] = { 
          pieceName: 'None', 
          isPlayable: true 
        };
        break;
        
      case 50: // Bandera capturada
        // Fin del juego - bandera capturada
        this.endGame(attackingPiece.type === 'Player1' ? 2 : 3);
        break;
        
      case 1: // Movimiento normal (sin combate)
      default: // Por defecto, ejecutar movimiento normal
        // Vaciar celda original
        this.board[fromRow][fromCol] = { 
          pieceName: 'None', 
          isPlayable: true 
        };
        
        // Actualizar nueva celda
        this.board[row][col] = { 
          pieceName: attackingPiece.pieceName,
          type: attackingPiece.type,
          isPlayable: true,
          pieceIndex: attackingPiece.index
        };
        
        // Actualizar posición de la pieza atacante
        attackingPiece.row = row;
        attackingPiece.col = col;
        break;
    }
    
    // Asegurar que el turno cambie después de cualquier combate
    this.currentPlayer = this.currentPlayer === 2 ? 3 : 2;
  }

  // End game and show winner
  endGame(winnerId: number): void {
    alert(`¡El Jugador ${winnerId} ha ganado la partida!`);
    
    // Notificar el fin del juego a través de WebSocket
    this.notifyGameEvent('gameEnded', {
      winnerId: winnerId
    });
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
    
    // Añadir clase para pieza seleccionada
    if (this.selectedPiece && this.selectedPiece.row === row && this.selectedPiece.col === col) {
      classes += 'selected ';
    }
    
    // Añadir clase para celdas de movimiento válido
    if (this.isCellHighlighted(row, col)) {
      classes += 'valid-move ';
    }
    
    return classes;
  }
  
  private notifyGameEvent(eventType: string, data: any): void {
    if (this.websocketService.connected$.getValue()) {
      try {
        // Crear un mensaje de evento de juego usando el formato esperado
        const gameEvent = {
          type: 'gameEvent',
          payload: {
            eventType: eventType,
            gameId: this.gameId,
            playerId: this.playerId,
            timestamp: new Date().toISOString(),
            ...data
          }
        };
        
        // Enviar el evento usando el método sendCustomMessage que ya existe
        this.websocketService.sendCustomMessage(gameEvent);
        
        console.log(`Evento de juego enviado (tipo: ${eventType}):`, gameEvent);
      } catch (error) {
        console.error('Error al enviar evento de juego:', error);
      }
    } else {
      console.warn('WebSocket no conectado, no se puede enviar notificación');
      // Intentar reconectar
      this.websocketService.connect();
    }
  }
  
  // Método para pasar a la siguiente pieza durante la configuración
  nextPiece(): void {
    if (this.currentPieceIndex < this.pieces.length) {
      // Encontrar la siguiente pieza no colocada
      while (
        this.currentPieceIndex < this.pieces.length && 
        this.pieces[this.currentPieceIndex].isPlaced
      ) {
        this.currentPieceIndex++;
      }
    }
  }
}