// friendship.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

interface Friendship {
  friendshipId: number;
  senderId: number;
  receiverId: number;
  isAccepted: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class FriendshipService {
  private apiUrl = 'https://localhost:5001/api/friendships';

  constructor(private http: HttpClient) {}

  getFriendships(userId: number): Observable<Friendship[]> {
    return this.http.get<Friendship[]>(`${this.apiUrl}/user/${userId}`);
  }

  acceptFriendship(friendshipId: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/accept/${friendshipId}`, {});
  }

  rejectFriendship(friendshipId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/reject/${friendshipId}`);
  }
}
