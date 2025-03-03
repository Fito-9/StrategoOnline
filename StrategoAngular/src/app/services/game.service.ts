import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface MovePieceRequest {
  pieceIndex: number;
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
}

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
  
  // Método para colocar una pieza
  placePiece(gameId: string, playerId: number, pieceIndex: number, row: number, col: number, pieceName: string): Observable<any> {
    // El backend espera los parámetros en la URL, no en el cuerpo
    const url = `${this.apiUrl}/Game/place-piece?gameId=${gameId}&playerId=${playerId}&pieceIndex=${pieceIndex}&row=${row}&col=${col}&pieceName=${pieceName}`;
    
    console.log(`Colocando pieza: ${url}`);
    
    // Enviamos un cuerpo vacío ya que todos los parámetros van en la URL
    return this.http.post(url, {})
      .pipe(catchError(this.handleError));
  }
  
  // Método para mover una pieza
  movePiece(gameId: string, request: MovePieceRequest): Observable<any> {
    // Construimos la URL con los parámetros necesarios para mantener coherencia
    const url = `${this.apiUrl}/Game/move-piece?gameId=${gameId}&pieceIndex=${request.pieceIndex}&fromRow=${request.fromRow}&fromCol=${request.fromCol}&toRow=${request.toRow}&toCol=${request.toCol}`;
    
    console.log(`Moviendo pieza: ${url}`);
    
    // Enviamos un cuerpo vacío ya que todos los parámetros van en la URL
    return this.http.post(url, {})
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
      errorMessage = `Código: ${error.status}, Mensaje: ${error.error}`;
      
      console.error('Detalles completos del error:', error);
    }
    
    console.error('Error en la petición HTTP:', errorMessage);
    
    return throwError(error);
  }
}