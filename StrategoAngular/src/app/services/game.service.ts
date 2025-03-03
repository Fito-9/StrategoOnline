import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private apiUrl = 'https://localhost:7232/api';

  constructor(private http: HttpClient) { }

  // Método para obtener el estado del juego
  getGameState(gameId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/Game/game-state?gameId=${gameId}`)
      .pipe(catchError(this.handleError));
  }

  // Método para colocar una pieza con mejor manejo de errores
  placePiece(gameId: string, playerId: number, pieceIndex: number, row: number, col: number, pieceName: string): Observable<any> {
    const body = {
      playerId: playerId,
      pieceIndex: pieceIndex,
      row: row,
      col: col,
      pieceName: pieceName
    };
    
    console.log(`Enviando: gameId=${gameId} (query), body=`, body);
    
    // Intentar enviar los datos en un formato diferente (más plano)
    return this.http.post(`${this.apiUrl}/Game/place-piece?gameId=${gameId}&playerId=${playerId}&pieceIndex=${pieceIndex}&row=${row}&col=${col}&pieceName=${pieceName}`, {})
      .pipe(catchError(this.handleError));
  }

  // Método para mover una pieza
  movePiece(gameId: string, pieceIndex: number, fromRow: number, fromCol: number, toRow: number, toCol: number): Observable<any> {
    const body = {
      pieceIndex: pieceIndex,
      fromRow: fromRow,
      fromCol: fromCol,
      toRow: toRow,
      toCol: toCol
    };

    return this.http.post(`${this.apiUrl}/Game/move-piece?gameId=${gameId}`, body)
      .pipe(catchError(this.handleError));
  }

  // Método para iniciar matchmaking
  requestMatchmaking(playerId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/Game/matchmaking?playerId=${playerId}`, {})
      .pipe(catchError(this.handleError));
  }

  // Método para manejar errores
  private handleError(error: HttpErrorResponse) {
    let errorMessage = '';
    
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      errorMessage = `Código: ${error.status}, ` +
                     `Mensaje: ${error.error}`;
      
      console.error('Detalles completos del error:', error);
    }
    
    // Puedes mostrar el mensaje en una alerta para depuración
    console.error('Error en la petición HTTP:', errorMessage);
    
    return throwError(error);
  }
}