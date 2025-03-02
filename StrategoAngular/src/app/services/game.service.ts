import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GameService {
  constructor(private http: HttpClient) {}

  getGameState(gameId: number): Observable<any> {
    return this.http.get(`${environment.apiUrl}Game/game-state?gameId=${gameId}`);
  }
}
