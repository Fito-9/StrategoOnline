import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GameService {
  constructor(private http: HttpClient) {}

  getGameState(gameId: string): Observable<any> {
    return this.http.get(`${environment.apiUrl}Game/game-state?gameId=${gameId}`);
  }

  movePiece(gameId: string, fromRow: number, fromCol: number, toRow: number, toCol: number): Observable<any> {
    return this.http.post(`${environment.apiUrl}Game/move-piece?gameId=${gameId}`, {
      FromRow: fromRow,
      FromCol: fromCol,
      ToRow: toRow,
      ToCol: toCol
    });
  }
}